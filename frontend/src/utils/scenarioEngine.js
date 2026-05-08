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

export const generateBriefingData = (simData, scenario, mode) => {
    if (!simData) return { summary: "Loading intelligence...", risks: [], actions: [], outlook: "", timeline: [], escalation: "Stable", primaryThreat: "" };

    let intl = simData.intelligence;
    let cond = intl.conditions;
    let metrics = simData.metrics;

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
    if (intl.threats.primary !== "No critical threats detected") risks.push(`PRIMARY: ${intl.threats.primary}`);
    intl.threats.secondary.forEach(t => risks.push(`SECONDARY: ${t}`));
    
    // Add regional risk context if severe
    if (cond.regionalContext !== "nominal" && scenario.weather > 0) risks.push(`REGIONAL VULNERABILITY: ${cond.regionalContext}`);
    
    if (risks.length === 0) risks.push("No acute operational anomalies detected.");

    let actions = simData.recommendations.slice(0, 3);

    let outlook = intl.confidenceReasoning;

    return { 
        summary, 
        risks, 
        actions, 
        outlook, 
        timeline: simData.timeline,
        escalation: intl.escalation,
        primaryThreat: intl.threats.primary
    };
};
