const express = require('express');
const config = require('./config');
const Database = require('./db');
const { getTodayYmd, addDaysToYmd } = require('./date');

const app = express();
const db = new Database(config);

const cacheStatic = {
    setHeaders: (res, path) => {
        // Cache for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
};

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



app.listen(config.port, (error) => {
    if (error) {
        console.log('Error: ', error);
    }
    console.log('Server is running on port', config.port);
})
