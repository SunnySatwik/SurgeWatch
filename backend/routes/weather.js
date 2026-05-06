const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

router.get('/', async (req, res, next) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        const data = await weatherService.getWeather(lat, lon);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
