/**
 * Centralized Operational Intelligence Engine
 * Handles scenario processing and reasoning logic.
 */

const deriveOperationalConditions = (scenario) => {
    let conditions = {
        erCongestion: "nominal",
        ambulanceFlow: "stable",
        traumaVelocity: "baseline",
        respiratoryPressure: "stable",
        staffingStability: "adequate",
        bedTurnover: "efficient",
        triagePressure: "manageable",
        isolationCapacity: "available",
        regionalContext: "nominal"
    };

    // Interaction Amplification (Nonlinear)
    if (scenario.weather === 2 && scenario.traffic === 1) {
        conditions.ambulanceFlow = "critically delayed";
        conditions.regionalContext = "Silk Board and ORR corridors fully gridlocked";
    } else if (scenario.weather >= 1 || scenario.traffic === 1) {
        conditions.ambulanceFlow = "degraded";
        if (scenario.weather >= 1) conditions.regionalContext = "Monsoon flooding corridors active near Indiranagar";
        else conditions.regionalContext = "Electronic City traffic spikes causing routing delays";
    }

    if (scenario.viral === 2 && scenario.staffing === -1) {
        conditions.isolationCapacity = "exhausted";
        conditions.respiratoryPressure = "critical";
    } else if (scenario.viral >= 1) {
        conditions.isolationCapacity = "strained";
        conditions.respiratoryPressure = "elevated";
    }

    if (scenario.crowd === 2 && scenario.weather >= 1) {
        conditions.traumaVelocity = "highly unpredictable";
        conditions.regionalContext = "Chinnaswamy event overflow complicated by storm conditions";
    } else if (scenario.crowd >= 1) {
        conditions.traumaVelocity = "elevated";
        conditions.regionalContext = "MG Road event density driving minor trauma spikes";
    }

    if (scenario.staffing === -1) {
        conditions.staffingStability = "fragile";
        conditions.bedTurnover = "slowed";
    } else if (scenario.staffing === 1) {
        conditions.staffingStability = "reinforced";
        conditions.bedTurnover = "accelerated";
    }

    if (scenario.viral === 2 || (scenario.weather === 2 && scenario.staffing === -1)) {
        conditions.triagePressure = "overwhelmed";
        conditions.erCongestion = "critical";
    } else if (scenario.viral === 1 || scenario.crowd === 2) {
        conditions.triagePressure = "strained";
        conditions.erCongestion = "high";
    }

    return conditions;
};

const determineEscalationLevel = (osi, confidence, conditions) => {
    let score = osi + (100 - confidence);
    if (conditions.isolationCapacity === "exhausted" || conditions.erCongestion === "critical" || score > 150) return "Regional Emergency Coordination";
    if (score > 120 || conditions.staffingStability === "fragile") return "Critical Incident Mode";
    if (score > 90) return "Surge Protocol";
    if (score > 60) return "Elevated Monitoring";
    return "Stable";
};

const getPriorityThreats = (conditions, scenario) => {
    let primary = "No critical threats detected";
    let secondary = [];
    let mitigating = [];

    if (conditions.isolationCapacity === "exhausted") {
        primary = "Respiratory isolation overload";
        secondary.push("Triage bottlenecking");
    } else if (conditions.ambulanceFlow === "critically delayed") {
        primary = "Ambulance intake paralysis";
        secondary.push("Golden-hour trauma risk");
    } else if (conditions.erCongestion === "critical") {
        primary = "ER boarding throughput failure";
        secondary.push("Staffing exhaustion");
    } else if (conditions.traumaVelocity === "highly unpredictable") {
        primary = "Mass casualty surge probability";
        secondary.push("Surgical bay availability");
    } else if (conditions.respiratoryPressure === "elevated") {
        primary = "Respiratory bed saturation";
    }

    if (scenario.staffing === 1) mitigating.push("Surge staffing actively stabilizing ICU throughput");
    else if (scenario.staffing === 0 && conditions.erCongestion === "nominal") mitigating.push("Nominal operations absorbing baseline load");

    if (scenario.weather === 0 && scenario.traffic === 0) mitigating.push("Favorable transit conditions facilitating swift patient transfer");

    return { primary, secondary, mitigating };
};

const getConfidenceReasoning = (confidence, scenario, conditions) => {
    if (confidence >= 85) return "Model confidence high: Environmental and operational parameters are stable and within predictable seasonal bounds.";
    if (confidence >= 70) return "Model confidence moderate: Minor operational volatility detected, but predictive bounds remain reliable.";
    
    let reasons = [];
    if (scenario.weather === 2) reasons.push("extreme weather event unpredictability");
    if (scenario.viral === 2) reasons.push("nonlinear viral transmission clustering");
    if (scenario.staffing === -1) reasons.push("fragile staffing ratios compounding measurement noise");
    if (scenario.crowd === 2) reasons.push("localized mass gathering anomalies");

    return `Forecast confidence reduced (${confidence}%) due to compounding volatility from ${reasons.join(" and ")}.`;
};

const generateCascadingTimeline = (scenario, conditions) => {
    let timeline = [];
    
    // Baseline stable timeline
    if (scenario.weather === 0 && scenario.crowd === 0 && scenario.viral === 0 && scenario.staffing >= 0 && scenario.traffic === 0) {
        return [
            { time: '+2h', text: 'Nominal operations and stable patient flow.', alert: false },
            { time: '+4h', text: 'Standard ER intake rate maintained.', alert: false },
            { time: '+6h', text: 'Shift transition nominal. Capacity adequate.', alert: false },
            { time: '+8h', text: 'End of primary operational forecast window.', alert: false }
        ];
    }

    // Weather / Traffic cascade
    if (conditions.ambulanceFlow === "critically delayed") {
        timeline.push({ time: '+2h', text: `Severe gridlock. ${conditions.regionalContext}.`, alert: true });
        timeline.push({ time: '+4h', text: 'Delayed intake processing compresses ER arrival windows.', alert: true });
        timeline.push({ time: '+6h', text: 'Clustered ambulance arrivals overwhelm trauma bay capacity.', alert: true });
    } else if (conditions.ambulanceFlow === "degraded") {
        timeline.push({ time: '+2h', text: `Transit delays detected. ${conditions.regionalContext}.`, alert: true });
        timeline.push({ time: '+4h', text: 'Ambulance ETA unpredictability forces extended ER triage holding.', alert: true });
    }

    // Viral / Staffing cascade
    if (conditions.isolationCapacity === "exhausted") {
        if (!timeline.find(t => t.time === '+2h')) timeline.push({ time: '+2h', text: 'Airborne isolation units hit 100% saturation.', alert: true });
        timeline.push({ time: '+4h', text: 'Infectious patients boarded in ER corridors, halting triage throughput.', alert: true });
        timeline.push({ time: '+6h', text: 'Staffing fatigue accelerates, degrading stabilization efficiency.', alert: true });
        timeline.push({ time: '+8h', text: 'Mandatory regional hospital diversion initiated.', alert: true });
        return timeline.slice(0, 4); // return early for severe cascade
    } else if (conditions.respiratoryPressure === "elevated") {
        if (!timeline.find(t => t.time === '+4h')) timeline.push({ time: '+4h', text: 'Respiratory presentation queue expands significantly.', alert: true });
        timeline.push({ time: '+6h', text: 'ICU respiratory bed availability drops below target thresholds.', alert: true });
    }

    // Crowd cascade
    if (conditions.traumaVelocity === "highly unpredictable") {
        timeline.push({ time: '+3h', text: `Surge in localized minor injury clusters. ${conditions.regionalContext}.`, alert: true });
        timeline.push({ time: '+5h', text: 'Surgical consult bottlenecks extend ER boarding times.', alert: true });
    }

    // Staffing failure cascade (if not caught by isolation exhausted)
    if (conditions.staffingStability === "fragile" && conditions.isolationCapacity !== "exhausted") {
        timeline.push({ time: '+6h', text: 'Inpatient boarding blocks triage due to slow bed turnover.', alert: true });
        timeline.push({ time: '+8h', text: 'Nurse-to-patient ratio hits critical threshold. High diversion risk.', alert: true });
    } else if (conditions.staffingStability === "reinforced") {
        timeline.push({ time: '+8h', text: 'Surge staffing successfully absorbs peak capacity load.', alert: false });
    }

    // Fill gaps
    if (!timeline.find(t => t.time === '+2h')) timeline.push({ time: '+2h', text: 'Initial shift load stabilizes.', alert: false });
    if (!timeline.find(t => t.time === '+4h')) timeline.push({ time: '+4h', text: 'Mid-shift operations nominal.', alert: false });
    if (!timeline.find(t => t.time === '+6h')) timeline.push({ time: '+6h', text: 'Shift handover sequence begins.', alert: false });
    if (!timeline.find(t => t.time === '+8h')) timeline.push({ time: '+8h', text: 'Forecast window concludes stably.', alert: false });

    // Sort and limit to 4 events
    timeline.sort((a, b) => parseInt(a.time.replace('+', '').replace('h', '')) - parseInt(b.time.replace('+', '').replace('h', '')));
    return timeline.slice(0, 4);
};

const processScenario = (baseData, scenario) => {
    // 1. Calculate Base Modifiers (Non-linear confidence penalties)
    let loadDelta = 0;
    let patientDelta = 0;
    let confidenceDelta = 0;

    let volatilityScore = scenario.weather + scenario.crowd + scenario.viral + scenario.traffic + (scenario.staffing === -1 ? 1 : 0);
    confidenceDelta -= (volatilityScore * volatilityScore); // Nonlinear confidence drop

    if (scenario.weather === 1) { loadDelta += 5; patientDelta += 12; }
    if (scenario.weather === 2) { loadDelta += 15; patientDelta += 35; }

    if (scenario.crowd === 1) { loadDelta += 3; patientDelta += 8; }
    if (scenario.crowd === 2) { loadDelta += 12; patientDelta += 25; }

    if (scenario.viral === 1) { loadDelta += 8; patientDelta += 20; }
    if (scenario.viral === 2) { loadDelta += 22; patientDelta += 55; }

    if (scenario.staffing === -1) { loadDelta += 12; }
    if (scenario.staffing === 1) { loadDelta -= 15; confidenceDelta += 10; } // Surge staff adds confidence

    if (scenario.traffic === 1) { loadDelta += 4; }

    // 2. Derive Operational State Layer
    const conditions = deriveOperationalConditions(scenario);

    // 3. Derive Core Dashboard Data
    let load = Math.min(100, Math.max(0, baseData.load + loadDelta));
    let expectedPatients = baseData.expectedPatients + patientDelta;
    let confidence = Math.min(99, Math.max(35, baseData.confidence + confidenceDelta));

    let risk = 'Low';
    if (load > 90) risk = 'Critical';
    else if (load > 75) risk = 'High';
    else if (load > 60) risk = 'Moderate';

    // 4. Derive Simulation Specific Metrics
    let osi = 32 + (scenario.weather * 15) + (scenario.viral * 12) + (scenario.crowd * 8) - (scenario.staffing * 10) + (scenario.traffic * 5);
    if (scenario.weather === 2 && scenario.traffic === 1) osi += 15; // compound penalty
    if (scenario.viral === 2 && scenario.staffing === -1) osi += 20; // compound penalty
    osi = Math.min(100, Math.max(0, osi));

    let surgeProb = 15 + (scenario.weather * 20) + (scenario.viral * 15) + (scenario.crowd * 10);
    surgeProb = Math.min(99, Math.max(0, surgeProb));

    let delayRisk = 10 + (scenario.weather * 25) + (scenario.traffic * 30) + (scenario.crowd * 5);
    if (scenario.weather === 2 && scenario.traffic === 1) delayRisk = 99;
    delayRisk = Math.min(99, Math.max(0, delayRisk));

    let icuWindowNum = 24 - (scenario.viral * 6) - (scenario.weather * 3) + (scenario.staffing * 4);
    if (conditions.isolationCapacity === "exhausted") icuWindowNum = 2; // Override
    let icuWindow = icuWindowNum < 4 ? '< 4h' : icuWindowNum < 8 ? '< 8h' : icuWindowNum < 12 ? '< 12h' : '> 24h';

    let readinessScore = 100 - (load * 0.4) - (osi * 0.4) + (scenario.staffing * 15);
    readinessScore = Math.min(100, Math.max(0, Math.round(readinessScore)));

    // 5. Escalation & Threats
    let escalation = determineEscalationLevel(osi, confidence, conditions);
    let threats = getPriorityThreats(conditions, scenario);
    let confidenceReasoning = getConfidenceReasoning(confidence, scenario, conditions);

    // 6. Derive Dynamic Directives based on conditions
    let recommendations = [];
    if (conditions.ambulanceFlow === "critically delayed") recommendations.push("High transit risk: Coordinate dynamic ambulance rerouting with regional dispatch immediately.");
    if (conditions.isolationCapacity === "exhausted") recommendations.push("Critical vulnerability: Activate emergency surge staffing and halt elective procedures immediately.");
    if (conditions.traumaVelocity === "highly unpredictable") recommendations.push("Prepare trauma bays for weather-related multi-casualty events and preempt surgical consults.");
    if (conditions.respiratoryPressure === "elevated") recommendations.push("Convert auxiliary wards to negative pressure isolation to absorb respiratory surge.");
    if (conditions.staffingStability === "fragile") recommendations.push("Mandatory overtime activation: call in standby nursing pool immediately to prevent boarding delays.");
    
    recommendations = [...recommendations, ...(baseData.recommendations || [])].slice(0, 4);

    // 7. Derive SHAP (Neural Attribution)
    let shap = [...(baseData.shap || [])];
    if (scenario.weather === 2) shap.unshift({ factor: 'Severe Storm', value: 18, type: 'positive' });
    else if (scenario.weather === 1) shap.unshift({ factor: 'Sustained Rain', value: 8, type: 'positive' });
    
    if (scenario.viral === 2) shap.unshift({ factor: 'Viral Outbreak', value: 25, type: 'positive' });
    else if (scenario.viral === 1) shap.splice(1, 0, { factor: 'Elevated Viral', value: 10, type: 'positive' });

    if (scenario.staffing === -1) shap.push({ factor: 'Staffing Shortage', value: 15, type: 'positive' });
    else if (scenario.staffing === 1) shap.push({ factor: 'Surge Staffing', value: -15, type: 'negative' });

    if (scenario.traffic === 1) shap.push({ factor: 'Heavy Traffic', value: 7, type: 'positive' });
    if (scenario.crowd === 2) shap.splice(1, 0, { factor: 'Mass Gathering', value: 12, type: 'positive' });

    shap = shap.slice(0, 5);

    // 8. Derive Causal Timeline
    let timeline = generateCascadingTimeline(scenario, conditions);

    return {
        ...baseData,
        load,
        expectedPatients,
        confidence,
        risk,
        shap,
        recommendations,
        metrics: {
            osi,
            surgeProb,
            delayRisk,
            icuWindow,
            readinessScore
        },
        timeline,
        intelligence: {
            conditions,
            escalation,
            threats,
            confidenceReasoning
        }
    };
};

module.exports = {
    processScenario
};
