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

  if (ambulanceFlow === 'critical intake compression') load += 22;
  else if (ambulanceFlow === 'degraded') load += 10;

  if (traumaVelocity === 'high-velocity volatility') load += 16;
  else if (traumaVelocity === 'elevated presentation rate') load += 8;

  if (erCongestion === 'critical boarding failure') load += 12;
  else if (erCongestion === 'high boarding pressure') load += 6;

  if (triagePressure === 'overwhelmed') load += 8;

  load += Math.round(osi * 0.06);
  load = clamp(load);

  // Derive a single dominant operational indicator
  let indicator;
  if (ambulanceFlow === 'critical intake compression') indicator = 'Ambulance diversion compressing intake';
  else if (triagePressure === 'overwhelmed') indicator = 'Triage queue saturated — divert risk';
  else if (erCongestion === 'critical boarding failure') indicator = 'Boarding failure — beds locked';
  else if (traumaVelocity === 'high-velocity volatility') indicator = 'High-velocity trauma surge active';
  else if (erCongestion === 'high boarding pressure') indicator = 'Boarding pressure increasing';
  else if (ambulanceFlow === 'degraded') indicator = 'Ambulance transit delayed — intake lag';
  else if (traumaVelocity === 'elevated presentation rate') indicator = 'Trauma presentation rate elevated';
  else if (delayRisk > 60) indicator = 'Near intake threshold';
  else indicator = 'Trauma throughput stable';

  return { name: 'Emergency', load, status: statusFromLoad(load), indicator };
};

/**
 * ICU — stressors: respiratory pressure, isolation capacity, viral load, staffing.
 */
const deriveICU = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { isolationCapacity, respiratoryPressure, staffingStability } = conditions;
  const { icuWindow, osi } = metrics;

  if (isolationCapacity === 'exhausted') load += 25;
  else if (isolationCapacity === 'strained') load += 12;

  if (respiratoryPressure === 'critical surge strain') load += 18;
  else if (respiratoryPressure === 'elevated syndromic pressure') load += 8;

  if (staffingStability === 'fragile ratios') load += 10;

  if (icuWindow === '< 4h') load += 14;
  else if (icuWindow === '< 8h') load += 7;

  load = clamp(load);

  let indicator;
  if (isolationCapacity === 'exhausted' && respiratoryPressure === 'critical surge strain') indicator = 'Isolation capacity exhausted — overflow risk';
  else if (icuWindow === '< 4h') indicator = 'Saturation imminent — under 4h capacity';
  else if (icuWindow === '< 8h') indicator = 'Approaching saturation — under 8h window';
  else if (isolationCapacity === 'exhausted') indicator = 'Isolation capacity exhausted';
  else if (respiratoryPressure === 'critical surge strain') indicator = 'Respiratory intake driving ICU demand';
  else if (isolationCapacity === 'strained') indicator = 'Isolation capacity constrained';
  else if (respiratoryPressure === 'elevated syndromic pressure') indicator = 'Respiratory intake elevated';
  else if (staffingStability === 'fragile ratios') indicator = 'Bed turnover slowed by staffing strain';
  else indicator = 'Capacity within safe operating range';

  return { name: 'ICU', load, status: statusFromLoad(load), indicator };
};

/**
 * General Ward — stressors: bed turnover, inpatient overflow, staffing stability.
 */
const deriveGeneralWard = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { bedTurnover, staffingStability, erCongestion } = conditions;
  const { osi } = metrics;

  if (bedTurnover === 'sub-optimal throughput') load += 12;
  else if (bedTurnover === 'accelerated disposition') load -= 8;

  if (erCongestion === 'critical boarding failure') load += 14;
  else if (erCongestion === 'high boarding pressure') load += 6;

  if (staffingStability === 'fragile ratios') load += 8;
  else if (staffingStability === 'reinforced surge posture') load -= 5;

  load += Math.round(osi * 0.04);
  load = clamp(load);

  let indicator;
  if (erCongestion === 'critical boarding failure' && bedTurnover === 'sub-optimal throughput') indicator = 'ER overflow — beds backing up';
  else if (erCongestion === 'critical boarding failure') indicator = 'ER overflow spilling into ward';
  else if (bedTurnover === 'sub-optimal throughput') indicator = 'Discharge backlog slowing bed availability';
  else if (staffingStability === 'fragile ratios') indicator = 'Staffing strain reducing throughput';
  else if (erCongestion === 'high boarding pressure') indicator = 'ER pressure elevating inpatient load';
  else if (bedTurnover === 'accelerated disposition') indicator = 'Discharge pace optimized';
  else indicator = 'Ward capacity stable';

  return { name: 'General Ward', load, status: statusFromLoad(load), indicator };
};

/**
 * Radiology — stressors: trauma surge, ER boarding, overall system load.
 */
const deriveRadiology = (baseLoad, conditions, metrics) => {
  let load = baseLoad;
  const { traumaVelocity, erCongestion } = conditions;
  const { osi } = metrics;

  if (traumaVelocity === 'high-velocity volatility') load += 18;
  else if (traumaVelocity === 'elevated presentation rate') load += 9;

  if (erCongestion === 'critical boarding failure') load += 10;
  else if (erCongestion === 'high boarding pressure') load += 5;

  load += Math.round(osi * 0.05);
  load = clamp(load);

  let indicator;
  if (traumaVelocity === 'high-velocity volatility') indicator = 'Trauma surge driving imaging backlog';
  else if (traumaVelocity === 'elevated presentation rate' && erCongestion !== 'nominal') indicator = 'Imaging demand elevated — queue building';
  else if (erCongestion === 'critical boarding failure') indicator = 'ER boarding creating imaging backlog';
  else if (traumaVelocity === 'elevated presentation rate') indicator = 'Imaging demand elevated';
  else if (erCongestion === 'high boarding pressure') indicator = 'Queue pressure rising from ER load';
  else indicator = 'Imaging throughput within normal range';

  return { name: 'Radiology', load, status: statusFromLoad(load), indicator };
};

/**
 * Pediatrics — stressors: viral outbreaks, seasonal trends, overall system load.
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

  let indicator;
  if (respiratoryPressure === 'critical surge strain' && isolationCapacity === 'exhausted') indicator = 'Viral surge — isolation at capacity limit';
  else if (respiratoryPressure === 'critical surge strain') indicator = 'Respiratory surge protocol active';
  else if (isolationCapacity === 'exhausted') indicator = 'Isolation rooms fully occupied';
  else if (respiratoryPressure === 'elevated syndromic pressure') indicator = 'Respiratory intake elevated';
  else if (isolationCapacity === 'strained') indicator = 'Isolation capacity constrained';
  else indicator = 'Pediatric intake within baseline';

  return { name: 'Pediatrics', load, status: statusFromLoad(load), indicator };
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
