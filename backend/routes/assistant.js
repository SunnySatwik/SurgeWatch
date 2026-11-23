const express = require('express');
const router = express.Router();
const { answerQuestion } = require('../services/assistantService');

router.post('/chat', async (req, res, next) => {
    try {
        const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
        const hospitalId = Number.isInteger(Number(req.body.hospitalId)) ? Number(req.body.hospitalId) : 1;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }
        if (message.length > 1500) {
            return res.status(400).json({ success: false, error: 'Message must be 1500 characters or fewer' });
        }
        if (!Array.isArray(req.body.history) && req.body.history !== undefined) {
            return res.status(400).json({ success: false, error: 'History must be an array' });
        }

        const result = await answerQuestion({
            message,
            history: req.body.history,
            hospitalId
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
