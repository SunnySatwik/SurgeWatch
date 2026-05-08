/**
 * Frontend Intelligence Service
 * Interacts with the backend intelligence API
 */

const API_BASE_URL = '/api/intelligence';

export const simulateScenario = async (baseData, scenario) => {
    try {
        const response = await fetch(`${API_BASE_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ baseData, scenario }),
        });

        if (!response.ok) {
            throw new Error(`Intelligence API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Simulation failed:', error);
        // Fallback to local processing or return baseData to avoid breaking UI
        return {
            ...baseData,
            error: true,
            message: 'Intelligence engine offline'
        };
    }
};
