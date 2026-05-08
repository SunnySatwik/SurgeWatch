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

export const generateBriefing = async (simData, scenario, mode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ simData, scenario, mode }),
        });

        if (!response.ok) {
            throw new Error(`Briefing API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Briefing generation failed:', error);
        return {
            summary: "Intelligence briefing temporarily unavailable. Operational systems remaining in active monitoring mode.",
            risks: ["System connectivity degraded"],
            actions: ["Maintain standard surge protocols"],
            outlook: "Backend synchronization required",
            timeline: simData?.timeline || [],
            escalation: simData?.intelligence?.escalation || "Stable",
            primaryThreat: "Intelligence Sync Error"
        };
    }
};
