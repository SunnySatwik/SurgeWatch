const express = require('express');
const router = express.Router();
const intelligenceEngine = require('../services/intelligenceEngine');
const hospitalDataService = require('../services/hospitalDataService');

/**
 * @route   POST /api/intelligence/simulate
 * @desc    Process operational scenario and return intelligence payload
 * @access  Public
 */
router.post('/simulate', async (req, res) => {
    try {
        const { baseData, scenario } = req.body;

        if (!baseData || !scenario) {
            return res.status(400).json({ 
                error: 'Missing required parameters: baseData and scenario' 
            });
        }

        // Fetch real operational hospital state
        const hospitalState = await hospitalDataService.buildOperationalState();

        const result = intelligenceEngine.processScenario(baseData, scenario, hospitalState);
        res.json(result);
    } catch (error) {
        console.error('Intelligence Engine Error:', error);
        res.status(500).json({ error: 'Failed to process intelligence scenario' });
    }
});

/**
 * @route   POST /api/intelligence/briefing
 * @desc    Generate structured executive briefing data
 * @access  Public
 */
router.post('/briefing', (req, res) => {
    try {
        const { simData, scenario, mode } = req.body;

        if (!simData || !scenario || !mode) {
            return res.status(400).json({ 
                error: 'Missing required parameters: simData, scenario, and mode' 
            });
        }

        const briefing = intelligenceEngine.generateBriefingData(simData, scenario, mode);
        res.json(briefing);
    } catch (error) {
        console.error('Briefing Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate executive briefing' });
    }
});

module.exports = router;
