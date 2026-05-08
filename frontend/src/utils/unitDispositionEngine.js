/**
 * SurgeWatch Unit Disposition Engine
 * Derives live operational metrics for each hospital unit from the
 * centralized intelligence state. Produces a coherent, causally-connected
 * decomposition of the same conditions driving the telemetry engine,
 * executive briefing, and scenario simulation.
 */

// ─── Status Thresholds ────────────────────────────────────────────────────────
const statusFromLoad = (load) => {
  if (load >= 94) return 'Extreme';
  if (load >= 80) return 'Critical';
  if (load >= 65) return 'Warning';
  return 'Stable';
};

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Math.round(value)));

// ─── Unit-Specific Metric Derivation ─────────────────────────────────────────

/**
 * Emergency Department
 * Primary stressors: ambulance flow, trauma velocity, ER congestion, crowd events.
 */
const deriveEmergency = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { ambulanceFlow, traumaVelocity, erCongestion, triagePressure } = conditions;
  const { osi, delayRisk } = metrics;

  // Ambulance compression directly compresses ER intake
  if (ambulanceFlow === 'critical intake compression') load += 22;
  else if (ambulanceFlow === 'degraded') load += 10;

  // Trauma events drive direct ER surge
  if (traumaVelocity === 'high-velocity volatility') load += 16;
  else if (traumaVelocity === 'elevated presentation rate') load += 8;

  // ER congestion boarding failure locks beds
  if (erCongestion === 'critical boarding failure') load += 12;
  else if (erCongestion === 'high boarding pressure') load += 6;

  // Triage overwhelm adds late-cycle pressure
  if (triagePressure === 'overwhelmed') load += 8;

  // Ambient OSI friction
  load += Math.round(osi * 0.06);

  load = clamp(load);
  return {
    name: 'Emergency',
    load,
    status: statusFromLoad(load),
    subtitles: [
      `Intake pressure: ${delayRisk > 60 ? 'Elevated' : 'Nominal'}`,
      `Triage queue: ${triagePressure === 'overwhelmed' ? 'Saturated' : triagePressure === 'sustained strain' ? 'Strained' : 'Manageable'}`,
    ],
  };
};

/**
 * ICU
 * Primary stressors: respiratory pressure, isolation capacity, viral load, staffing.
 */
const deriveICU = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { isolationCapacity, respiratoryPressure, staffingStability } = conditions;
  const { icuWindow, osi } = metrics;

  // Isolation exhaustion forces ICU overflow accommodation
  if (isolationCapacity === 'exhausted') load += 25;
  else if (isolationCapacity === 'strained') load += 12;

  // Respiratory surge directly occupies ICU beds
  if (respiratoryPressure === 'critical surge strain') load += 18;
  else if (respiratoryPressure === 'elevated syndromic pressure') load += 8;

  // Staffing fragility prevents bed turnover
  if (staffingStability === 'fragile ratios') load += 10;

  // ICU saturation window feeds back into occupancy
  if (icuWindow === '< 4h') load += 14;
  else if (icuWindow === '< 8h') load += 7;

  load = clamp(load);
  return {
    name: 'ICU',
    load,
    status: statusFromLoad(load),
    subtitles: [
      `Saturation window: ${icuWindow}`,
      `Isolation load: ${isolationCapacity === 'exhausted' ? 'Critical' : isolationCapacity === 'strained' ? 'Elevated' : 'Normal'}`,
    ],
  };
};

/**
 * General Ward
 * Primary stressors: bed turnover, inpatient overflow, staffing stability.
 */
const deriveGeneralWard = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { bedTurnover, staffingStability, erCongestion } = conditions;
  const { osi } = metrics;

  // Sub-optimal turnover backs up beds
  if (bedTurnover === 'sub-optimal throughput') load += 12;
  else if (bedTurnover === 'accelerated disposition') load -= 8;

  // ER overflow spills into ward
  if (erCongestion === 'critical boarding failure') load += 14;
  else if (erCongestion === 'high boarding pressure') load += 6;

  // Staffing strain reduces throughput
  if (staffingStability === 'fragile ratios') load += 8;
  else if (staffingStability === 'reinforced surge posture') load -= 5;

  // Ambient OSI
  load += Math.round(osi * 0.04);

  load = clamp(load);
  return {
    name: 'General Ward',
    load,
    status: statusFromLoad(load),
    subtitles: [
      `Bed turnover: ${bedTurnover === 'accelerated disposition' ? 'Optimized' : bedTurnover === 'sub-optimal throughput' ? 'Degraded' : 'Nominal'}`,
      `Overflow risk: ${erCongestion === 'critical boarding failure' ? 'High' : 'Low'}`,
    ],
  };
};

/**
 * Radiology
 * Primary stressors: trauma surge, ER boarding, overall system load.
 */
const deriveRadiology = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { traumaVelocity, erCongestion } = conditions;
  const { osi } = metrics;

  // Trauma surges drive immediate imaging demand
  if (traumaVelocity === 'high-velocity volatility') load += 18;
  else if (traumaVelocity === 'elevated presentation rate') load += 9;

  // ER boarding pressure chains into imaging backlog
  if (erCongestion === 'critical boarding failure') load += 10;
  else if (erCongestion === 'high boarding pressure') load += 5;

  // System-wide stress correlates with imaging demand
  load += Math.round(osi * 0.05);

  load = clamp(load);
  return {
    name: 'Radiology',
    load,
    status: statusFromLoad(load),
    subtitles: [
      `Imaging demand: ${traumaVelocity !== 'baseline' ? 'Elevated' : 'Nominal'}`,
      `Queue pressure: ${erCongestion !== 'nominal' ? 'Rising' : 'Stable'}`,
    ],
  };
};

/**
 * Pediatrics
 * Stressors: viral outbreaks, seasonal trends, overall system load.
 */
const derivePediatrics = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { respiratoryPressure, isolationCapacity } = conditions;
  const { osi } = metrics;

  if (respiratoryPressure === 'critical surge strain') load += 15;
  else if (respiratoryPressure === 'elevated syndromic pressure') load += 8;

  if (isolationCapacity === 'exhausted') load += 10;
  else if (isolationCapacity === 'strained') load += 5;

  load += Math.round(osi * 0.03);
  load = clamp(load);

  return {
    name: 'Pediatrics',
    load,
    status: statusFromLoad(load),
    subtitles: [
      `Respiratory load: ${respiratoryPressure !== 'stable' ? 'Elevated' : 'Normal'}`,
      `Isolation demand: ${isolationCapacity === 'exhausted' ? 'Critical' : isolationCapacity === 'strained' ? 'High' : 'Low'}`,
    ],
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Derives a full unit disposition array from the centralized intelligence state.
 *
 * @param {object} baseData   - Full intelligence engine output (from POST /api/intelligence/simulate)
 * @returns {Array}           - Array of unit objects ready for DepartmentSection
 */
export function deriveUnitDisposition(baseData) {
  if (!baseData) return [];

  const conditions = baseData?.intelligence?.conditions ?? {
    erCongestion: 'nominal',
    ambulanceFlow: 'stable',
    traumaVelocity: 'baseline',
    respiratoryPressure: 'stable',
    staffingStability: 'adequate',
    bedTurnover: 'efficient',
    triagePressure: 'manageable',
    isolationCapacity: 'available',
  };

  const metrics = baseData?.metrics ?? {
    osi: 32,
    delayRisk: 10,
    icuWindow: '> 24h',
    readinessScore: 80,
  };

  // Use the raw data `departments` array as base load anchors so the numbers
  // always start from the day's HMIS-derived baseline before intelligence pressure is applied.
  const rawDepts = baseData?.departments ?? [];
  const getBaseLoad = (name) => rawDepts.find(d => d.name === name)?.load ?? 55;

  return [
    deriveEmergency(getBaseLoad('Emergency'), conditions, metrics),
    deriveICU(getBaseLoad('ICU'), conditions, metrics),
    deriveGeneralWard(getBaseLoad('General Ward') || getBaseLoad('Pediatrics'), conditions, metrics),
    deriveRadiology(getBaseLoad('Radiology'), conditions, metrics),
    derivePediatrics(getBaseLoad('Pediatrics'), conditions, metrics),
  ];
}
