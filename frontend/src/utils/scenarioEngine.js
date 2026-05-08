/**
 * Centralized Operational Intelligence Engine Helpers
 * Purely functional helpers for the UI layer.
 * Processing logic has been moved to backend/services/intelligenceEngine.js
 */

export const getBaselineMetrics = () => {
    return {
        osi: 32,
        surgeProb: 15,
        delayRisk: 10,
        icuWindow: '> 24h',
        readinessScore: 85
    };
};
