const express = require('express');
const router = express.Router();
const geoService = require('../services/geoService');

router.get('/auto', async (req, res, next) => {
    try {
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Handle local dev environment
        if (ip === '::1' || ip === '127.0.0.1') {
            ip = ''; // Freeipapi will use server IP or default
        }

        const data = await geoService.getAutoLocation(ip);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
