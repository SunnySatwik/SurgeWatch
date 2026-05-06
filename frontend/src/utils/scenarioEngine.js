// Centralized Operational Intelligence Engine

export const getBaselineMetrics = () => {
    return {
        osi: 32,
        surgeProb: 15,
        delayRisk: 10,
        icuWindow: '> 24h',
        readinessScore: 85
    };
};

export const processScenario = (baseData, scenario) => {
    // 1. Calculate Base Modifiers
    let loadDelta = 0;
    let patientDelta = 0;
    let confidenceDelta = 0;

    // Weather: 0: clear, 1: rain, 2: storm
    if (scenario.weather === 1) { loadDelta += 5; patientDelta += 12; confidenceDelta -= 5; }
    if (scenario.weather === 2) { loadDelta += 15; patientDelta += 35; confidenceDelta -= 12; }

    // Crowd: 0: low, 1: moderate, 2: high
    if (scenario.crowd === 1) { loadDelta += 3; patientDelta += 8; confidenceDelta -= 2; }
    if (scenario.crowd === 2) { loadDelta += 12; patientDelta += 25; confidenceDelta -= 6; }

    // Viral: 0: minimal, 1: elevated, 2: outbreak
    if (scenario.viral === 1) { loadDelta += 8; patientDelta += 20; confidenceDelta -= 4; }
    if (scenario.viral === 2) { loadDelta += 22; patientDelta += 55; confidenceDelta -= 10; }

    // Staffing: -1: reduced, 0: normal, 1: surge
    if (scenario.staffing === -1) { loadDelta += 12; confidenceDelta -= 15; }
    if (scenario.staffing === 1) { loadDelta -= 15; confidenceDelta += 10; }

    // Traffic: 0: low, 1: heavy
    if (scenario.traffic === 1) { loadDelta += 4; confidenceDelta -= 4; }

    // 2. Derive Core Dashboard Data
    let load = Math.min(100, Math.max(0, baseData.load + loadDelta));
    let expectedPatients = baseData.expectedPatients + patientDelta;
    let confidence = Math.min(99, Math.max(40, baseData.confidence + confidenceDelta));

    let risk = 'Low';
    if (load > 90) risk = 'Critical';
    else if (load > 75) risk = 'High';
    else if (load > 60) risk = 'Moderate';

    // 3. Derive Simulation Specific Metrics
    let osi = 32 + (scenario.weather * 15) + (scenario.viral * 12) + (scenario.crowd * 8) - (scenario.staffing * 10) + (scenario.traffic * 5);
    osi = Math.min(100, Math.max(0, osi));

    let surgeProb = 15 + (scenario.weather * 20) + (scenario.viral * 15) + (scenario.crowd * 10);
    surgeProb = Math.min(99, Math.max(0, surgeProb));

    let delayRisk = 10 + (scenario.weather * 25) + (scenario.traffic * 30) + (scenario.crowd * 5);
    delayRisk = Math.min(99, Math.max(0, delayRisk));

    let icuWindowNum = 24 - (scenario.viral * 6) - (scenario.weather * 3) + (scenario.staffing * 4);
    let icuWindow = icuWindowNum < 4 ? '< 4h' : icuWindowNum < 8 ? '< 8h' : icuWindowNum < 12 ? '< 12h' : '> 24h';

    let readinessScore = 100 - (load * 0.4) - (osi * 0.4) + (scenario.staffing * 15);
    readinessScore = Math.min(100, Math.max(0, Math.round(readinessScore)));

    // 4. Derive Dynamic Directives
    let recommendations = [];
    if (scenario.weather >= 1 && scenario.traffic === 1) recommendations.push("High transit risk: Coordinate ambulance rerouting with regional dispatch immediately.");
    if (scenario.viral === 2 && scenario.staffing === -1) recommendations.push("Critical vulnerability: Activate emergency surge staffing and open secondary respiratory triage.");
    if (scenario.weather === 2) recommendations.push("Prepare trauma bays for weather-related multi-casualty events.");
    if (scenario.viral >= 1) recommendations.push("Convert auxiliary wards to negative pressure isolation.");
    if (scenario.staffing === -1) recommendations.push("Mandatory overtime activation: call in standby nursing pool immediately.");
    if (scenario.crowd === 2) recommendations.push("Stage rapid-triage tents at secondary entrances for minor injury overflow.");
    
    // Fallbacks from baseline if few generated
    recommendations = [...recommendations, ...(baseData.recommendations || [])].slice(0, 4);

    // 5. Derive SHAP (Neural Attribution)
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

    // 6. Derive Causal Timeline
    let timeline = [];
    // +2h
    if (scenario.weather >= 1 && scenario.traffic === 1) timeline.push({ time: '+2h', text: 'Severe gridlock paralyzing ambulance routing.', alert: true });
    else if (scenario.weather >= 1) timeline.push({ time: '+2h', text: 'Weather conditions slowing transit and extending ER wait times.', alert: true });
    else if (scenario.traffic === 1) timeline.push({ time: '+2h', text: 'Traffic congestion increasing patient arrival unpredictability.', alert: true });
    else timeline.push({ time: '+2h', text: 'Nominal operations and stable patient flow.', alert: false });

    // +4h
    if (scenario.viral === 2) timeline.push({ time: '+4h', text: 'Triage queue overwhelmed by respiratory presentations.', alert: true });
    else if (scenario.crowd === 2) timeline.push({ time: '+4h', text: 'Surge in localized minor injury clusters from event crowds.', alert: true });
    else if (scenario.weather === 2) timeline.push({ time: '+4h', text: 'Trauma intake volume peaks due to storm-related incidents.', alert: true });
    else timeline.push({ time: '+4h', text: 'Standard ER intake rate maintained.', alert: false });

    // +6h
    if (scenario.viral >= 1) timeline.push({ time: '+6h', text: 'ICU respiratory bed availability drops below target thresholds.', alert: true });
    else if (load > 85) timeline.push({ time: '+6h', text: 'Inpatient boarding begins to block ER throughput.', alert: true });
    else timeline.push({ time: '+6h', text: 'Shift transition nominal. Capacity adequate.', alert: false });

    // +8h
    if (scenario.staffing === -1) timeline.push({ time: '+8h', text: 'Nurse-to-patient ratio hits critical threshold. High diversion risk.', alert: true });
    else if (scenario.staffing === 1) timeline.push({ time: '+8h', text: 'Surge staffing successfully absorbs peak capacity load.', alert: false });
    else timeline.push({ time: '+8h', text: 'End of primary operational forecast window.', alert: false });

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
        timeline
    };
};

export const generateBriefingData = (simData, scenario, mode) => {
    let isSevere = simData.risk === 'Critical' || simData.risk === 'High';
    let severity = simData.risk;

    let summary = "";
    if (mode === 'executive') {
        summary = `Hospital capacity is projected to ${isSevere ? 'experience severe strain' : 'remain stable'} over the next 12 hours. Operational Stress Index sits at ${simData.metrics.osi}, with an ambulance delay risk of ${simData.metrics.delayRisk}%. Resource allocation must prioritize ${scenario.viral >= 1 ? 'respiratory and isolation units' : 'standard trauma intake'}.`;
    } else if (mode === 'clinical') {
        summary = `Clinical demand will ${isSevere ? 'spike sharply' : 'follow standard diurnal patterns'}. Anticipated surge probability is ${simData.metrics.surgeProb}%. Adjust staffing ratios to accommodate ${scenario.weather >= 1 ? 'trauma and exposure' : 'routine'} presentations.`;
    } else if (mode === 'emergency') {
        summary = `Emergency operations are at ${severity} readiness. Delay risk for incoming transit is ${simData.metrics.delayRisk}%. Expected critical intake window requires immediate triage protocol alignment.`;
    } else {
        summary = `Public health indicators reflect a ${severity.toLowerCase()} risk profile. Community transmission and environmental factors correlate to a ${simData.metrics.surgeProb}% regional surge likelihood.`;
    }

    let risks = [];
    if (scenario.weather === 2) risks.push("Severe weather disrupting ambulance routing and increasing trauma cases.");
    if (scenario.weather === 1) risks.push("Sustained rainfall causing localized transit delays for staff.");
    if (scenario.viral === 2) risks.push("Viral outbreak accelerating airborne isolation bed exhaustion.");
    if (scenario.viral === 1) risks.push("Elevated viral transmission increasing ER waiting room congestion.");
    if (scenario.staffing === -1) risks.push("Critical nursing shortage compounding bed turnover delays.");
    if (scenario.traffic === 1) risks.push("Gridlock conditions threatening golden-hour trauma windows.");
    if (scenario.crowd === 2) risks.push("Mass gathering incidents elevating localized mass-casualty risk.");
    if (risks.length === 0) risks.push("No critical operational anomalies detected in current parameters.");

    let actions = simData.recommendations.slice(0, 3);

    let outlook = `Projections indicate ${simData.metrics.icuWindow} until ICU saturation under current parameters. Expected patient flow will necessitate ${scenario.staffing === 1 ? 'maintaining current surge staffing' : 'rapid resource reallocation'} to prevent boarding delays.`;

    return { summary, risks, actions, outlook, timeline: simData.timeline };
};
