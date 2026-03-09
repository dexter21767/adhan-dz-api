const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Database = require('./db');
const { version: appVersion } = require('./package.json');
const {
    getTodayYmd,
    addDaysToYmd,
    formatGregorianDateEn,
    formatGregorianDateAr,
    formatHijriDateEn,
    formatHijriDateAr,
} = require('./date');

const app = express();
const db = new Database(config);
const staticDir = path.join(__dirname, 'static');
const versionedHtmlRoutes = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/api.html': 'api.html',
    '/api-test.html': 'api-test.html',
};

const templateCache = {
    html: Object.fromEntries(
        Object.values(versionedHtmlRoutes)
            .filter((value, index, values) => values.indexOf(value) === index)
            .map((fileName) => [fileName, fs.readFileSync(path.join(staticDir, fileName), 'utf8')])
    ),
    manifest: fs.readFileSync(path.join(staticDir, 'manifest.webmanifest'), 'utf8'),
    sw: fs.readFileSync(path.join(staticDir, 'sw.js'), 'utf8'),
};

function injectAppVersion(template) {
    return template.replace(/__APP_VERSION__/g, appVersion);
}

const cacheStatic = {
    setHeaders: (res, filePath) => {
        void filePath;
        // Cache for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
};

app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.type('application/javascript');
    res.send(injectAppVersion(templateCache.sw));
});

app.get('/manifest.webmanifest', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.type('application/manifest+json');
    res.send(injectAppVersion(templateCache.manifest));
});

Object.entries(versionedHtmlRoutes).forEach(([routePath, fileName]) => {
    app.get(routePath, (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.type('text/html');
        res.send(injectAppVersion(templateCache.html[fileName]));
    });
});

app.use('/', express.static('static',cacheStatic));
app.use('/db', express.static(config.metaDir, cacheStatic));

app.get('/cities', async (req, res) => {
    db.getCities().then((cities) => {
        res.json(cities);
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    })
});

app.get('/prayerTimes', async (req, res) => {
    const { cityId, startDate, endDate } = req.query;
    if (cityId && !/^\d+$/.test(cityId)) {
        return res.status(400).json({ error: 'Invalid cityId. It must be an integer.' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const query = {cityId};
    query.startDate = startDate || getTodayYmd();
    if(endDate){
        if (endDate > query.startDate) {
            const maxEndDate = addDaysToYmd(query.startDate, 30);
            query.endDate = endDate > maxEndDate ? maxEndDate : endDate;
        }
    }
    db.getPrayerTimes(query).then((prayerTimes) => {
        res.json(prayerTimes);
    }).catch(
        (error) => {
            res.status(500).json({ error: error.message });
        }
    )
});

app.get('/hijriGeoDate', async (req, res) => {
    const { date, startDate, endDate } = req.query;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (
        (date && !dateRegex.test(date)) ||
        (startDate && !dateRegex.test(startDate)) ||
        (endDate && !dateRegex.test(endDate))
    ) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const query = {};
    query.startDate = startDate || date || getTodayYmd();
    if (endDate) {
        if (endDate > query.startDate) {
            const maxEndDate = addDaysToYmd(query.startDate, 30);
            query.endDate = endDate > maxEndDate ? maxEndDate : endDate;
        }
    }

    db.getHijriGeoDates(query).then((rows) => {
        const formattedRows = rows.map((row) => ({
            GeoDate: row.GeoDate,
            HijriDate: row.HijriDate,
            GeoDateEn: formatGregorianDateEn(row.GeoDate),
            HijriDateEn: formatHijriDateEn(row.HijriDate),
            GeoDateAr: formatGregorianDateAr(row.GeoDate),
            HijriDateAr: formatHijriDateAr(row.HijriDate),
        }));

        res.json(formattedRows);
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    });
});



app.listen(config.port, (error) => {
    if (error) {
        console.log('Error: ', error);
    }
    console.log('Server is running on port', config.port);
})
