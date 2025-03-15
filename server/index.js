const express = require('express');
const config = require('./config');
const Database = require('./db');

const app = express();
const db = new Database(config);

app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to Adhan DZ API</h1>
        <p>Available routes:</p>
        <ul>
            <li><strong>GET /cities</strong> - Retrieve a list of cities</li>
            <li><strong>GET /prayerTimes</strong> - Retrieve prayer times for a specific city and date range</li>
        </ul>
        <h2>Query Parameters for /prayerTimes:</h2>
        <ul>
            <li><strong>cityId</strong> (optional, int) - Use ParentId if present, or _id if ParentId = null</li>
            <li><strong>startDate</strong> (optional, string) - The start date in YYYY-MM-DD format (defaults to today if not provided)</li>
            <li><strong>endDate</strong> (optional, string) - The end date in YYYY-MM-DD format (if not provided, only returns data for the start date)</li>
        </ul>
        <p>Note: If the end date is more than 30 days after the start date, it will be changed to 30 days after the start date.</p>
    `);
});

app.get('/cities', async (req, res) => {
    db.getCities().then((cities) => {
        res.json(cities);
    }).catch((error) => {
        res.status(500).json({ error: error.message });
    })
});

app.get('/prayerTimes', async (req, res) => {
    const { cityId, startDate, endDate } = req.query;
    if (cityId && isNaN(parseInt(cityId))) {
        return res.status(400).json({ error: 'Invalid cityId. It must be an integer.' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const query = {cityId};
    query.startDate = startDate || new Date().toISOString().split('T')[0];
    if(endDate){
        const start = new Date(query.startDate);
        const end = new Date(endDate);
        if (end > start) {
            const maxEndDate = new Date(start);
            maxEndDate.setDate(start.getDate() + 30);
            query.endDate = end > maxEndDate ? maxEndDate.toISOString().split('T')[0] : endDate;
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