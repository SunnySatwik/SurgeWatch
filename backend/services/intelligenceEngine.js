/**
 * Centralized Operational Intelligence Engine
 * Handles scenario processing and reasoning logic.
 * Refined for enterprise-grade hospital operational forecasting.
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

    // Regional Transit Intelligence (Bengaluru Specific)
    if (scenario.weather === 2 && scenario.traffic === 1) {
        conditions.ambulanceFlow = "critical intake compression";
        conditions.regionalContext = "Silk Board and Outer Ring Road corridors immobilized; alternate routing required";
    } else if (scenario.weather >= 1 || scenario.traffic === 1) {
        conditions.ambulanceFlow = "degraded";
        if (scenario.weather >= 1) conditions.regionalContext = "Monsoon flooding at Indiranagar and Hebbal underpasses impacting trauma response";
        else conditions.regionalContext = "Electronic City flyover congestion causing 25+ min inbound delays";
    }

    // Clinical Pressure Intelligence
    if (scenario.viral === 2 && scenario.staffing === -1) {
        conditions.isolationCapacity = "exhausted";
        conditions.respiratoryPressure = "critical surge strain";
    } else if (scenario.viral >= 1) {
        conditions.isolationCapacity = "strained";
        conditions.respiratoryPressure = "elevated syndromic pressure";
    }

    // Trauma & Event Intelligence
    if (scenario.crowd === 2 && scenario.weather >= 1) {
        conditions.traumaVelocity = "high-velocity volatility";
        conditions.regionalContext = "Chinnaswamy event overflow complicated by monsoon flash flooding; multiple trauma clusters projected";
    } else if (scenario.crowd >= 1) {
        conditions.traumaVelocity = "elevated presentation rate";
        conditions.regionalContext = "MG Road/Brigade Road event density driving minor trauma presentation spikes";
    }

    // Staffing & Resource Intelligence
    if (scenario.staffing === -1) {
        conditions.staffingStability = "fragile ratios";
        conditions.bedTurnover = "sub-optimal throughput";
    } else if (scenario.staffing === 1) {
        conditions.staffingStability = "reinforced surge posture";
        conditions.bedTurnover = "accelerated disposition";
    }

    // System-Wide Congestion Logic
    if (scenario.viral === 2 || (scenario.weather === 2 && scenario.staffing === -1)) {
        conditions.triagePressure = "overwhelmed";
        conditions.erCongestion = "critical boarding failure";
    } else if (scenario.viral === 1 || scenario.crowd === 2) {
        conditions.triagePressure = "sustained strain";
        conditions.erCongestion = "high boarding pressure";
    }

    return conditions;
};

const determineEscalationLevel = (osi, confidence, conditions) => {
    // Escalation must feel "earned" based on compounding metrics
    if (conditions.isolationCapacity === "exhausted" || conditions.erCongestion === "critical boarding failure" || osi > 85) {
        return "Regional Emergency Coordination";
    }
    if (osi > 70 || conditions.staffingStability === "fragile ratios" || conditions.ambulanceFlow === "critical intake compression") {
        return "Critical Incident Mode";
    }
    if (osi > 50 || conditions.respiratoryPressure === "elevated syndromic pressure") {
        return "Surge Protocol";
    }
    if (osi > 35 || confidence < 60) {
        return "Elevated Monitoring";
    }
    return "Stable";
};

const getPriorityThreats = (conditions, scenario) => {
    let primary = "No critical threats detected";
    let secondary = [];
    let mitigating = [];

    if (conditions.isolationCapacity === "exhausted") {
        primary = "Respiratory isolation saturation";
        secondary.push("Critical triage bottlenecking");
    } else if (conditions.ambulanceFlow === "critical intake compression") {
        primary = "Ambulance diversion risk";
        secondary.push("Golden-hour trauma risk escalation");
    } else if (conditions.erCongestion === "critical boarding failure") {
        primary = "ER boarding throughput failure";
        secondary.push("Clinical staffing exhaustion");
    } else if (conditions.traumaVelocity === "high-velocity volatility") {
        primary = "Mass casualty surge probability";
        secondary.push("Surgical bay availability strain");
    } else if (conditions.respiratoryPressure === "elevated syndromic pressure") {
        primary = "Respiratory bed capacity strain";
    }

    if (scenario.staffing === 1) mitigating.push("Surge staffing actively stabilizing clinical throughput");
    else if (scenario.staffing === 0 && conditions.erCongestion === "nominal") mitigating.push("Nominal staffing levels absorbing baseline load");

    if (scenario.weather === 0 && scenario.traffic === 0) mitigating.push("Clear regional transit conditions facilitating efficient patient transfer");

    return { primary, secondary, mitigating };
};

const getConfidenceReasoning = (confidence, scenario, conditions) => {
    if (confidence >= 85) return "Forecast confidence high: Environmental and operational parameters are stable and within predictable seasonal bounds.";

    let volatilityFactors = [];
    if (scenario.weather === 2) volatilityFactors.push("extreme meteorological volatility");
    if (scenario.viral === 2) volatilityFactors.push("non-linear viral transmission clusters");
    if (scenario.staffing === -1) volatilityFactors.push("unstable nurse-to-patient ratios");
    if (scenario.traffic === 1) volatilityFactors.push("unpredictable transit-time variance");

    if (volatilityFactors.length > 0) {
        return `Forecast confidence reduced (${confidence}%) due to compounding operational noise from ${volatilityFactors.join(", ")} affecting predictive bounds.`;
    }

    return "Model confidence moderate: Minor operational volatility detected, but predictive bounds remain reliable.";
};

const generateCascadingTimeline = (scenario, conditions) => {
    let timeline = [];

    // Baseline stable timeline
    if (scenario.weather === 0 && scenario.crowd === 0 && scenario.viral === 0 && scenario.staffing >= 0 && scenario.traffic === 0) {
        return [
            { time: '+2h', text: 'Nominal operations and stable patient flow.', alert: false },
            { time: '+4h', text: 'Standard clinical throughput maintained.', alert: false },
            { time: '+6h', text: 'Shift transition nominal; capacity adequate.', alert: false },
            { time: '+8h', text: 'Operational forecast window concludes within baseline.', alert: false }
        ];
    }

    // Strict progression: +2h -> +4h -> +6h -> +8h

    // Step 1: +2h - External / Initial Impact
    if (conditions.ambulanceFlow === "critical intake compression") {
        timeline.push({ time: '+2h', text: `Severe gridlock: ${conditions.regionalContext}. Inbound ambulance delays exceeding 30m.`, alert: true });
    } else if (conditions.traumaVelocity === "high-velocity volatility") {
        timeline.push({ time: '+2h', text: "Spike in trauma presentations from localized event clusters.", alert: true });
    } else {
        timeline.push({ time: '+2h', text: "Shift load stabilizes; monitoring environmental signals.", alert: false });
    }

    // Step 2: +4h - Secondary / Triage Impact
    if (conditions.erCongestion === "critical boarding failure") {
        timeline.push({ time: '+4h', text: "Delayed intake processing compresses ER arrival waves; triage queue exceeds safety limits.", alert: true });
    } else if (conditions.respiratoryPressure === "critical surge strain") {
        timeline.push({ time: '+4h', text: "Respiratory isolation units hit 90% saturation; triage priority shifted to infectious disease.", alert: true });
    } else {
        timeline.push({ time: '+4h', text: "Mid-shift clinical operations remain within manageable bounds.", alert: false });
    }

    // Step 3: +6h - Tertiary / Capacity Impact
    if (conditions.isolationCapacity === "exhausted") {
        timeline.push({ time: '+6h', text: "Infectious patients boarded in non-traditional care areas; trauma throughput degradation detected.", alert: true });
    } else if (conditions.staffingStability === "fragile ratios") {
        timeline.push({ time: '+6h', text: "Nurse-to-patient ratios hit critical threshold; staff fatigue begins affecting disposition times.", alert: true });
    } else {
        timeline.push({ time: '+6h', text: "Bed turnover remains efficient; no acute boarding detected.", alert: false });
    }

    // Step 4: +8h - Terminal / Protocol Impact
    if (conditions.erCongestion === "critical boarding failure" || conditions.isolationCapacity === "exhausted") {
        timeline.push({ time: '+8h', text: "Regional hospital diversion protocols activated; system entering emergency posture.", alert: true });
    } else if (scenario.staffing === 1) {
        timeline.push({ time: '+8h', text: "Surge staffing successfully absorbs peak load; readiness posture restored.", alert: false });
    } else {
        timeline.push({ time: '+8h', text: "Operational window concludes with nominal resource utilization.", alert: false });
    }

    return timeline;
};

const processScenario = (baseData, scenario) => {
    // 1. Calculate Base Modifiers
    let loadDelta = 0;
    let patientDelta = 0;
    let confidenceDelta = 0;

    let volatilityScore = scenario.weather + scenario.crowd + scenario.viral + scenario.traffic + (scenario.staffing === -1 ? 1 : 0);
    confidenceDelta -= (volatilityScore * 4); // Smoother confidence drop

    if (scenario.weather === 1) { loadDelta += 5; patientDelta += 12; }
    if (scenario.weather === 2) { loadDelta += 18; patientDelta += 38; }

    if (scenario.crowd === 1) { loadDelta += 4; patientDelta += 10; }
    if (scenario.crowd === 2) { loadDelta += 14; patientDelta += 28; }

    if (scenario.viral === 1) { loadDelta += 10; patientDelta += 22; }
    if (scenario.viral === 2) { loadDelta += 25; patientDelta += 58; }

    if (scenario.staffing === -1) { loadDelta += 15; }
    if (scenario.staffing === 1) { loadDelta -= 12; confidenceDelta += 8; }

    if (scenario.traffic === 1) { loadDelta += 6; }

    // 2. Derive Operational State Layer
    const conditions = deriveOperationalConditions(scenario);

    // 3. Interconnected Metric Reasoning

    // OSI (Operational Stress Index)
    let osi = 32 + (scenario.weather * 18) + (scenario.viral * 15) + (scenario.crowd * 10) - (scenario.staffing * 12) + (scenario.traffic * 8);
    // Compound Penalties
    if (scenario.weather === 2 && scenario.traffic === 1) osi += 12;
    if (scenario.viral === 2 && scenario.staffing === -1) osi += 18;
    osi = Math.min(100, Math.max(0, Math.round(osi)));

    // Ambulance Delay Risk
    let delayRisk = 10 + (scenario.weather * 28) + (scenario.traffic * 35) + (scenario.crowd * 6);
    if (scenario.weather === 2 && scenario.traffic === 1) delayRisk = 99;
    delayRisk = Math.min(99, Math.max(0, Math.round(delayRisk)));

    // ICU Saturation Window (Influenced by OSI, Ambulance Flow, and Clinical Pressure)
    let baseIcuWindow = 24 - (scenario.viral * 10) - (scenario.weather * 4) + (scenario.staffing * 6);

    // Interdependency: High transit delay risk compresses the ICU window due to non-linear arrival waves
    if (delayRisk > 60) baseIcuWindow -= 4;
    if (delayRisk > 85) baseIcuWindow -= 6;

    // Interdependency: High overall stress (OSI) reduces bed turnover velocity
    if (osi > 65) baseIcuWindow -= 4;
    if (osi > 85) baseIcuWindow -= 6;

    // Interdependency: Viral outbreaks aggressively reduce window due to specialized isolation needs
    if (scenario.viral === 2) baseIcuWindow = Math.min(baseIcuWindow, 4);

    if (conditions.isolationCapacity === "exhausted") baseIcuWindow = 2;

    let icuWindow = baseIcuWindow < 4 ? '< 4h' : baseIcuWindow < 8 ? '< 8h' : baseIcuWindow < 12 ? '< 12h' : '> 24h';

    // Core Dashboard Data
    let load = Math.min(100, Math.max(0, baseData.load + loadDelta));
    let expectedPatients = baseData.expectedPatients + patientDelta;
    let confidence = Math.min(99, Math.max(35, baseData.confidence + confidenceDelta));

    // Readiness Score
    let readinessModifier = scenario.staffing === 1 ? 15 : (scenario.staffing === -1 ? -15 : 0);
    let readinessScore = 100 - (load * 0.4) - (osi * 0.4) + readinessModifier;
    readinessScore = Math.min(100, Math.max(5, Math.round(readinessScore)));

    let risk = 'Low';
    if (load > 92) risk = 'Critical';
    else if (load > 78) risk = 'High';
    else if (load > 62) risk = 'Moderate';

    // 4. Final Aggregation
    let escalation = determineEscalationLevel(osi, confidence, conditions);
    let threats = getPriorityThreats(conditions, scenario);
    let confidenceReasoning = getConfidenceReasoning(confidence, scenario, conditions);
    let timeline = generateCascadingTimeline(scenario, conditions);

    // Recommendations
    let recommendations = [];
    if (conditions.ambulanceFlow === "critical intake compression") recommendations.push("Activate emergency ambulance routing: bypass Outer Ring Road corridors via arterial backup routes.");
    if (conditions.isolationCapacity === "exhausted") recommendations.push("Critical incident posture: halt all elective surgical admissions and convert Level 2 wards to negative pressure.");
    if (conditions.traumaVelocity === "high-velocity volatility") recommendations.push("Pre-stage trauma teams and expand surgical consult capacity to manage projected mass gathering overflow.");
    if (conditions.erCongestion === "critical boarding failure") recommendations.push("Initialize inpatient discharge acceleration protocol to resolve ER boarding bottlenecks immediately.");

    recommendations = [...recommendations, ...(baseData.recommendations || [])].slice(0, 4);

    // SHAP
    let shap = [...(baseData.shap || [])];
    if (scenario.weather === 2) shap.unshift({ factor: 'Severe Storm Impact', value: 22, type: 'positive' });
    if (scenario.viral === 2) shap.unshift({ factor: 'Viral Surge Cluster', value: 28, type: 'positive' });
    if (scenario.staffing === -1) shap.push({ factor: 'Clinical Staff Shortage', value: 18, type: 'positive' });
    shap = shap.slice(0, 5);

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
            surgeProb: Math.min(99, Math.max(0, 15 + (scenario.viral * 25) + (scenario.weather * 15))),
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

const generateBriefingData = (simData, scenario, mode) => {
    if (!simData) return { summary: "Loading intelligence...", risks: [], actions: [], outlook: "", timeline: [], escalation: "Stable", primaryThreat: "" };

    const intl = simData?.intelligence || {};

    const cond = intl?.conditions || {
        staffingStability: "stable",
        ambulanceFlow: "stable",
        bedTurnover: "nominal",
        erCongestion: "nominal",
        triagePressure: "manageable",
        respiratoryPressure: "stable",
        traumaVelocity: "baseline",
        regionalContext: "nominal"
    };

    const metrics = simData?.metrics || {
        osi: 0,
        delayRisk: 0,
        icuWindow: "> 24h",
        surgeProb: 0
    };

    let summary = "";
    if (mode === 'executive') {
        summary = `Escalation Posture: ${intl.escalation}. The primary threat vector is ${intl.threats.primary.toLowerCase()}. Operational Stress Index is ${metrics.osi}, driven by ${cond.staffingStability} staffing and ${cond.ambulanceFlow} transit. ${intl.threats.mitigating.length > 0 ? intl.threats.mitigating[0] + '.' : 'Immediate resource reallocation required.'}`;
    } else if (mode === 'clinical') {
        summary = `Clinical throughput is severely impacted by ${cond.bedTurnover} bed turnover and ${cond.erCongestion} ER congestion. Triage is currently ${cond.triagePressure}. Anticipate an ICU saturation window of ${metrics.icuWindow} due to ${cond.respiratoryPressure} respiratory presentation pressure.`;
    } else if (mode === 'emergency') {
        summary = `Emergency Response: ${intl.escalation}. Ambulance routing is ${cond.ambulanceFlow} with a ${metrics.delayRisk}% delay risk. Trauma velocity is ${cond.traumaVelocity}. Implement immediate regional diversion protocols if boarding exceeds capacity.`;
    } else {
        summary = `Public Health Alert: Syndromic patterns indicate ${cond.respiratoryPressure} regional pressure. ${cond.regionalContext}. Projected community spread risk correlates to a ${metrics.surgeProb}% localized surge probability.`;
    }

    let risks = [];
    if (intl?.threats?.primary && intl.threats.primary !== "No critical threats detected") risks.push(`PRIMARY: ${intl.threats.primary}`);
    (intl?.threats?.secondary || []).forEach(t =>
        risks.push(`SECONDARY: ${t}`)
    );

    // Add regional risk context if severe
    if (cond.regionalContext !== "nominal" && scenario.weather > 0) risks.push(`REGIONAL VULNERABILITY: ${cond.regionalContext}`);

    if (risks.length === 0) risks.push("No acute operational anomalies detected.");

    let actions = Array.isArray(simData?.recommendations)
        ? simData.recommendations.slice(0, 3)
        : ["Maintain standard operational posture"];
    let outlook = intl.confidenceReasoning;

    return {
        summary: summary || "Operational intelligence unavailable.",

        risks: Array.isArray(risks)
            ? risks
            : ["Operational anomaly detection unavailable"],

        actions: Array.isArray(actions)
            ? actions
            : ["Maintain standard operational posture"],

        outlook:
            outlook ||
            "Forecast confidence temporarily degraded.",

        timeline: Array.isArray(simData?.timeline)
            ? simData.timeline
            : [],

        escalation:
            intl?.escalation ||
            "Stable",

        primaryThreat:
            intl?.threats?.primary ||
            "No critical threats detected"
    };
};

module.exports = {
    processScenario,
    generateBriefingData
};
