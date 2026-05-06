const express = require('express');
const router = express.Router();
const geoService = require('../services/geoService');

router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
        }

        const data = await geoService.searchCity(q);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

router.get('/reverse', async (req, res, next) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        const data = await geoService.reverseGeocode(lat, lon);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
