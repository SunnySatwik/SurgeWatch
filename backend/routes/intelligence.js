const express = require('express');
const router = express.Router();
const intelligenceEngine = require('../services/intelligenceEngine');

/**
 * @route   POST /api/intelligence/simulate
 * @desc    Process operational scenario and return intelligence payload
 * @access  Public
 */
router.post('/simulate', (req, res) => {
    try {
        const { baseData, scenario } = req.body;

        if (!baseData || !scenario) {
            return res.status(400).json({ 
                error: 'Missing required parameters: baseData and scenario' 
            });
        }

        const result = intelligenceEngine.processScenario(baseData, scenario);
        res.json(result);
    } catch (error) {
        console.error('Intelligence Engine Error:', error);
        res.status(500).json({ error: 'Failed to process intelligence scenario' });
    }
});

module.exports = router;
