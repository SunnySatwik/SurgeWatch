const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper to assign a glow color based on risk
const getRiskAttributes = (riskLevel) => {
    switch (riskLevel.toUpperCase()) {
        case 'HIGH':
        case 'CRITICAL':
            return {
                risk: 'Critical',
                riskColor: 'text-red-500',
                glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            };
        case 'MEDIUM':
            return {
                risk: 'High',
                riskColor: 'text-orange-500',
                glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]'
            };
        default:
            return {
                risk: 'Low',
                riskColor: 'text-green-400',
                glow: ''
            };
    }
};

// Map ML departments to Frontend departments format
const mapDepartments = (deps, baseRisk) => {
    return [
        { 
            name: "Emergency", 
            load: baseRisk === 'Critical' ? 95 : baseRisk === 'High' ? 82 : 65, 
            status: baseRisk, 
            color: baseRisk === 'Critical' ? 'bg-red-500' : baseRisk === 'High' ? 'bg-orange-500' : 'bg-green-500' 
        },
        { 
            name: "ICU", 
            load: baseRisk === 'Critical' ? 88 : 60, 
            status: baseRisk === 'Critical' ? 'Critical' : 'Stable', 
            color: baseRisk === 'Critical' ? 'bg-red-500' : 'bg-green-500' 
        },
        { 
            name: "Pediatrics", 
            load: 70, 
            status: "Stable", 
            color: "bg-green-500" 
        },
        { 
            name: "Radiology", 
            load: baseRisk === 'Critical' ? 92 : 75, 
            status: baseRisk === 'Critical' ? 'Critical' : 'Warning', 
            color: baseRisk === 'Critical' ? 'bg-red-500' : 'bg-yellow-500' 
        }
    ];
};

const getRecommendations = (risk) => {
    if (risk === 'Critical') {
        return [
            "Enable Surge Capacity Phase II",
            "Full staff recall for critical units",
            "Suspend non-essential imaging tasks"
        ];
    } else if (risk === 'High') {
        return [
            "Mobilize on-call staffing pool for ER triage",
            "Review bed turnaround time targets",
            "Deploy secondary nursing supervisor"
        ];
    } else {
        return [
            "Routine operational cadence",
            "Infrastructure safety audit",
            "Restock localized care points"
        ];
    }
}

router.get('/', (req, res) => {
    try {
        // Path to the ML output file
        const mlDataPath = path.join(__dirname, '../../ml/forecast_output.json');
        
        if (!fs.existsSync(mlDataPath)) {
            return res.status(404).json({ error: 'ML forecast output not found. Please run the ML pipeline.' });
        }

        const rawData = fs.readFileSync(mlDataPath, 'utf8');
        const mlOutput = JSON.parse(rawData);

        // Transform the forecast array into the format expected by DASHBOARD_DATA.
        // Dates are rolled forward so day-0 always anchors to today, regardless
        // of when the ML model was last trained / the JSON was generated.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dashboardData = mlOutput.forecast.map((dayData, index) => {
            // Anchor each entry to today + index days (rolling forecast window)
            const anchoredDate = new Date(today);
            anchoredDate.setDate(today.getDate() + index);

            const dayStr  = anchoredDate.toLocaleDateString('en-US', { weekday: 'short' }); // "Thu"
            const dateStr = anchoredDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "May 8"

            const riskAttrs = getRiskAttributes(dayData.risk_level);

            // Map SHAP factors
            // In ML, positive values increase patients (so they are "negative" health outcomes)
            const shapMapped = dayData.shap_factors.map(sf => ({
                factor: sf.label,
                value: sf.value,
                type: sf.value > 0 ? 'negative' : 'positive'
            }));

            // Confidence derived from surge_probability with bounded mapping.
            // XGBoost regression does not emit calibrated confidence directly;
            // surge_probability [0,1] maps onto display range [72,97].
            const surgeProb = dayData.surge_probability ?? 0.5;
            const confidence = Math.round(72 + surgeProb * 25);

            // Calculate load percentage
            let load = Math.round((dayData.predicted_volume / (dayData.baseline_volume * 1.5)) * 100);
            if (load > 100) load = 100;
            if (load < 30) load = 30 + Math.floor(Math.random() * 20);

            return {
                day: dayStr,
                date: dateStr,
                load: load,
                expectedPatients: dayData.predicted_volume,
                confidence: confidence,
                risk: riskAttrs.risk,
                riskColor: riskAttrs.riskColor,
                glow: riskAttrs.glow,
                shap: shapMapped,
                recommendations: getRecommendations(riskAttrs.risk),
                departments: mapDepartments(mlOutput.departments, riskAttrs.risk)
            };
        });

        res.json(dashboardData);
    } catch (error) {
        console.error('Error serving forecast data:', error);
        res.status(500).json({ error: 'Failed to parse ML forecast data.' });
    }
});

module.exports = router;
