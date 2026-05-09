/**
 * SurgeWatch Predictive Insights Engine
 *
 * Derives forward-looking, strategic forecast signals for the Insights view.
 * These are PREDICTIVE observations — what the system anticipates — NOT execution actions.
 *
 * Responsibility boundary:
 *   predictiveInsightsEngine  → forecast implications, anticipated pressure, trend monitoring
 *   directivesEngine          → active interventions, execution-level operational response
 *
 * Signal shape:
 * { id, title, observation, horizon, domain, trend }
 * trend: 'deteriorating' | 'stable' | 'improving' | 'watch'
 */

const INSIGHTS = {

  // ── Transport Forecast ────────────────────────────────────────────────────
  TRANSPORT_PRESSURE_AHEAD: {
    id: 'TRANSPORT_PRESSURE_AHEAD',
    title: 'Ambulance Transit Pressure Forecast',
    observation: 'Traffic density patterns suggest elevated ambulance ETA variance within the next 2–4 hours. Intake compression probability above threshold.',
    horizon: 'Next 4h',
    domain: 'Transport',
    trend: 'deteriorating',
  },
  TRANSPORT_STABILIZING: {
    id: 'TRANSPORT_STABILIZING',
    title: 'Transit Conditions Normalizing',
    observation: 'Ambulance routing telemetry indicates clearing congestion. ETA variance expected to return toward baseline.',
    horizon: 'Next 2h',
    domain: 'Transport',
    trend: 'improving',
  },
  TRANSPORT_WATCH: {
    id: 'TRANSPORT_WATCH',
    title: 'Ambulance Load Within Parameters',
    observation: 'Current transport utilization is within forecast norms. No immediate pressure anticipated.',
    horizon: 'Ongoing',
    domain: 'Transport',
    trend: 'stable',
  },

  // ── Respiratory Forecast ──────────────────────────────────────────────────
  RESPIRATORY_SURGE_LIKELY: {
    id: 'RESPIRATORY_SURGE_LIKELY',
    title: 'Respiratory Surge Trajectory Detected',
    observation: 'Syndromic surveillance indicates rising viral positivity trend. Isolation demand is forecast to exceed current capacity within 24–48 hours if trajectory continues.',
    horizon: '24–48h',
    domain: 'Respiratory',
    trend: 'deteriorating',
  },
  RESPIRATORY_ELEVATED: {
    id: 'RESPIRATORY_ELEVATED',
    title: 'Elevated Respiratory Activity Anticipated',
    observation: 'Lab positivity trending above seasonal baseline. Anticipate increased respiratory presentations requiring isolation precaution over the next operational window.',
    horizon: 'Next 12h',
    domain: 'Respiratory',
    trend: 'watch',
  },

  // ── ICU Capacity Forecast ─────────────────────────────────────────────────
  ICU_SATURATION_FORECAST: {
    id: 'ICU_SATURATION_FORECAST',
    title: 'ICU Saturation Window Compressing',
    observation: 'Current patient acuity and admission velocity project ICU saturation within a compressed timeframe. Downstream capacity is the critical constraint.',
    horizon: 'Next 6–8h',
    domain: 'ICU',
    trend: 'deteriorating',
  },
  ICU_WATCH: {
    id: 'ICU_WATCH',
    title: 'ICU Capacity Under Monitoring',
    observation: 'ICU occupancy is elevated but stable. Continued monitoring warranted; current trajectory does not indicate imminent saturation.',
    horizon: 'Next 12h',
    domain: 'ICU',
    trend: 'watch',
  },

  // ── Staffing Forecast ─────────────────────────────────────────────────────
  STAFFING_DEFICIT_RISK: {
    id: 'STAFFING_DEFICIT_RISK',
    title: 'Nurse Ratio Degradation Risk',
    observation: 'Staffing availability forecasts indicate nurse-to-patient ratios may breach safe thresholds during peak admission window. Contingency planning advisable.',
    horizon: 'Next 6–12h',
    domain: 'Staffing',
    trend: 'deteriorating',
  },
  STAFFING_ADEQUATE: {
    id: 'STAFFING_ADEQUATE',
    title: 'Staffing Forecast Adequate',
    observation: 'Staffing projections meet demand across monitored departments for the current shift window.',
    horizon: 'Current shift',
    domain: 'Staffing',
    trend: 'stable',
  },

  // ── Surge Probability ─────────────────────────────────────────────────────
  SURGE_IMMINENT: {
    id: 'SURGE_IMMINENT',
    title: 'High Surge Probability Window',
    observation: 'Multiple converging pressure signals — traffic, occupancy, and syndromic — indicate elevated surge probability in the upcoming operational window.',
    horizon: 'Next 4–8h',
    domain: 'Surge',
    trend: 'deteriorating',
  },
  SURGE_POSSIBLE: {
    id: 'SURGE_POSSIBLE',
    title: 'Moderate Surge Probability',
    observation: 'Forecast model indicates moderate surge probability based on current occupancy trajectory and intake patterns. Situational awareness recommended.',
    horizon: 'Next 12h',
    domain: 'Surge',
    trend: 'watch',
  },

  // ── ER Throughput Forecast ────────────────────────────────────────────────
  ER_CONGESTION_FORECAST: {
    id: 'ER_CONGESTION_FORECAST',
    title: 'ER Throughput Degradation Anticipated',
    observation: 'Admission velocity and boarding indicators suggest ER throughput will deteriorate during the peak window. Discharge velocity is the primary constraint.',
    horizon: 'Next 4h',
    domain: 'Throughput',
    trend: 'deteriorating',
  },

  // ── Nominal / Strategic ───────────────────────────────────────────────────
  OPERATIONAL_NOMINAL: {
    id: 'OPERATIONAL_NOMINAL',
    title: 'Operational Conditions Within Forecast Range',
    observation: 'All monitored indicators are within predictive norms. Forecast horizon indicates no significant surge risk for the current operational window.',
    horizon: 'Next 24h',
    domain: 'Operational',
    trend: 'stable',
  },
  OSI_WATCH: {
    id: 'OSI_WATCH',
    title: 'Operational Stress Index Trending Up',
    observation: 'OSI is rising above seasonal baseline. While not yet critical, the trajectory warrants increased monitoring frequency.',
    horizon: 'Next 8h',
    domain: 'Operational',
    trend: 'watch',
  },
};

// ─── Derivation Logic ─────────────────────────────────────────────────────────

const TREND_ORDER = { deteriorating: 0, watch: 1, improving: 2, stable: 3 };

/**
 * Derives a prioritized set of predictive intelligence signals for the Insights view.
 *
 * @param {object} baseData - Full intelligence engine output
 * @returns {Array} - Ordered predictive insight objects (max 5)
 */
export function derivePredictiveInsights(baseData) {
  if (!baseData) return [INSIGHTS.OPERATIONAL_NOMINAL];

  const conditions = baseData?.intelligence?.conditions ?? {};
  const escalation = baseData?.intelligence?.escalation ?? 'Stable';
  const metrics = baseData?.metrics ?? {};

  const {
    ambulanceFlow,
    erCongestion,
    isolationCapacity,
    respiratoryPressure,
    staffingStability,
  } = conditions;

  const { osi = 32, surgeProb = 0, delayRisk = 10, icuWindow = '> 24h' } = metrics;

  const candidates = [];
  const add = (insight, weight) => candidates.push({ insight, weight });

  // Transport
  if (ambulanceFlow === 'critical intake compression') {
    add(INSIGHTS.TRANSPORT_PRESSURE_AHEAD, 90);
  } else if (ambulanceFlow === 'degraded') {
    add(INSIGHTS.TRANSPORT_PRESSURE_AHEAD, 70);
  } else if (delayRisk < 20) {
    add(INSIGHTS.TRANSPORT_WATCH, 15);
  }

  // Surge probability
  if (surgeProb >= 70 || escalation === 'Critical Incident Mode') {
    add(INSIGHTS.SURGE_IMMINENT, 95);
  } else if (surgeProb >= 45) {
    add(INSIGHTS.SURGE_POSSIBLE, 70);
  }

  // Respiratory
  if (isolationCapacity === 'exhausted' || respiratoryPressure === 'critical outbreak') {
    add(INSIGHTS.RESPIRATORY_SURGE_LIKELY, 85);
  } else if (respiratoryPressure === 'elevated syndromic pressure' || isolationCapacity === 'strained') {
    add(INSIGHTS.RESPIRATORY_ELEVATED, 65);
  }

  // ICU
  if (icuWindow === '< 4h' || icuWindow === '< 8h') {
    add(INSIGHTS.ICU_SATURATION_FORECAST, 88);
  } else if (icuWindow === '< 12h') {
    add(INSIGHTS.ICU_WATCH, 60);
  }

  // Staffing
  if (staffingStability === 'fragile ratios') {
    add(INSIGHTS.STAFFING_DEFICIT_RISK, 80);
  } else {
    add(INSIGHTS.STAFFING_ADEQUATE, 20);
  }

  // ER throughput
  if (erCongestion === 'critical boarding failure' || erCongestion === 'high boarding pressure') {
    add(INSIGHTS.ER_CONGESTION_FORECAST, 75);
  }

  // OSI watch
  if (osi > 50 && osi <= 70) {
    add(INSIGHTS.OSI_WATCH, 55);
  }

  // Stable fallback
  if (candidates.filter(c => c.weight > 20).length === 0) {
    add(INSIGHTS.OPERATIONAL_NOMINAL, 10);
  }

  const seen = new Set();
  return candidates
    .sort((a, b) => b.weight - a.weight)
    .filter(({ insight }) => {
      if (seen.has(insight.id)) return false;
      seen.add(insight.id);
      return true;
    })
    .map(({ insight }) => insight)
    .sort((a, b) => (TREND_ORDER[a.trend] ?? 3) - (TREND_ORDER[b.trend] ?? 3))
    .slice(0, 5);
}
