/**
 * useOperationalSync
 * 
 * Central hook that derives a live, causally coherent operational signal
 * from control panel overrides. This is the propagation backbone for
 * the entire SurgeWatch intelligence ecosystem.
 * 
 * Input:  overrides (from OperationalControlPanel)
 * Output: { scenario, operationalSignal, readinessDelta, telemetryEvents }
 * 
 * All downstream components subscribe to these derived signals rather than
 * raw override values, maintaining clean separation and avoiding prop drilling.
 */

import { useMemo } from 'react';
import { overridesToScenario } from '../components/dashboard/OperationalControlPanel';

// Threshold constants
const THRESHOLDS = {
  TRAFFIC_CRITICAL: 8,
  TRAFFIC_ELEVATED: 5,
  RESPIRATORY_OUTBREAK: 25,
  RESPIRATORY_ELEVATED: 15,
  STAFFING_DEPLETED: 65,
  STAFFING_STRAINED: 78,
  ICU_CRITICAL: 88,
  ICU_ELEVATED: 75,
  ER_OVERWHELMED: 80,
  ER_ELEVATED: 60,
  AMBULANCE_CRITICAL: 12,
  AMBULANCE_ELEVATED: 9,
};

/**
 * Derives a rich operational signal from raw override values.
 * All causal relationships are encoded here — single source of truth.
 */
function deriveOperationalSignal(overrides) {
  const {
    trafficSeverity,
    respiratoryPositivity,
    staffingAvailability,
    erIntakeVolume,
    icuCapacityPressure,
    ambulanceLoad,
    weatherSeverity,
  } = overrides;

  // --- Transport Layer ---
  const trafficCritical = trafficSeverity >= THRESHOLDS.TRAFFIC_CRITICAL;
  const trafficElevated = trafficSeverity >= THRESHOLDS.TRAFFIC_ELEVATED;
  const ambulanceCritical = ambulanceLoad >= THRESHOLDS.AMBULANCE_CRITICAL;

  const ambulanceFlow =
    (trafficCritical && ambulanceCritical) || weatherSeverity === 2
      ? 'critical intake compression'
      : trafficElevated || ambulanceCritical
      ? 'delayed'
      : 'normal';

  const intakeAcceleration =
    trafficCritical ? 'rapidly worsening' :
    trafficElevated ? 'worsening' : 'stable';

  // --- Clinical Layer ---
  const respiratoryCritical = respiratoryPositivity >= THRESHOLDS.RESPIRATORY_OUTBREAK;
  const respiratoryElevated = respiratoryPositivity >= THRESHOLDS.RESPIRATORY_ELEVATED;

  const respiratoryPressure =
    respiratoryCritical ? 'elevated' : respiratoryElevated ? 'moderate' : 'normal';

  const respiratoryEscalation =
    respiratoryCritical ? 'rapidly worsening' :
    respiratoryElevated ? 'worsening' : 'stable';

  // --- Capacity Layer (causally linked to respiratory) ---
  // Respiratory pressure amplifies ICU strain
  const effectiveIcuPressure = Math.min(
    100,
    icuCapacityPressure + (respiratoryCritical ? 12 : respiratoryElevated ? 6 : 0)
  );

  const icuPressure =
    effectiveIcuPressure >= THRESHOLDS.ICU_CRITICAL ? 'critical' :
    effectiveIcuPressure >= THRESHOLDS.ICU_ELEVATED ? 'elevated' : 'stable';

  const occupancyMomentum =
    effectiveIcuPressure >= THRESHOLDS.ICU_CRITICAL ? 'rapidly worsening' :
    effectiveIcuPressure >= THRESHOLDS.ICU_ELEVATED ? 'worsening' : 'stable';

  // --- ER Layer (linked to transport) ---
  // Traffic delays amplify ER congestion (boarding builds up)
  const effectiveErPressure = Math.min(
    100,
    erIntakeVolume + (trafficCritical ? 15 : trafficElevated ? 8 : 0)
  );

  const erCongestion =
    effectiveErPressure >= THRESHOLDS.ER_OVERWHELMED ? 'volatile' :
    effectiveErPressure >= THRESHOLDS.ER_ELEVATED ? 'elevated' : 'stable';

  const congestionTrajectory =
    effectiveErPressure >= THRESHOLDS.ER_OVERWHELMED ? 'rapidly worsening' :
    effectiveErPressure >= THRESHOLDS.ER_ELEVATED ? 'worsening' : 'stable';

  // --- Staffing Layer ---
  const staffingDepleted = staffingAvailability <= THRESHOLDS.STAFFING_DEPLETED;
  const staffingStrained = staffingAvailability <= THRESHOLDS.STAFFING_STRAINED;

  const staffingStability =
    staffingDepleted ? 'fragile' : staffingStrained ? 'strained' : 'stable';

  // Prolonged staffing fatigue amplifies readiness penalty
  const staffingRecovery =
    staffingDepleted ? 'rapidly worsening' :
    staffingStrained ? 'worsening' : 'stable';

  // --- Escalation Risk ---
  const escalationFactors = [
    icuPressure === 'critical',
    erCongestion === 'volatile',
    ambulanceFlow === 'critical intake compression',
    staffingStability === 'fragile',
    respiratoryEscalation === 'rapidly worsening',
    weatherSeverity === 2,
  ].filter(Boolean).length;

  const escalationRisk =
    escalationFactors >= 4 ? 'critical' :
    escalationFactors >= 2 ? 'elevated' : 'low';

  // --- Readiness Delta (penalty to apply on top of baseline) ---
  let readinessPenalty = 0;
  if (icuPressure === 'critical') readinessPenalty += 12;
  else if (icuPressure === 'elevated') readinessPenalty += 6;
  if (erCongestion === 'volatile') readinessPenalty += 10;
  if (ambulanceFlow === 'critical intake compression') readinessPenalty += 12;
  if (staffingStability === 'fragile') readinessPenalty += 14;
  else if (staffingStability === 'strained') readinessPenalty += 6;
  if (respiratoryCritical) readinessPenalty += 10;
  if (occupancyMomentum === 'rapidly worsening') readinessPenalty += 8;
  if (congestionTrajectory === 'rapidly worsening') readinessPenalty += 8;
  if (weatherSeverity === 2) readinessPenalty += 6;

  // Stabilization bonuses
  if (staffingAvailability >= 90) readinessPenalty -= 8;
  if (respiratoryPositivity < 10) readinessPenalty -= 4;

  // --- Telemetry Events (live reactive events for audit stream) ---
  const telemetryEvents = [];

  // Transport
  if (ambulanceFlow === 'critical intake compression')
    telemetryEvents.push({ severity: 'critical', type: 'ESCALATED', title: 'Ambulance Diversion Active', message: `Traffic severity ${trafficSeverity}/10 causing >40min ETAs. Intake compression underway.` });
  else if (ambulanceFlow === 'delayed')
    telemetryEvents.push({ severity: 'warning', type: 'WARNING', title: 'Ambulance Transit Delayed', message: `Traffic severity ${trafficSeverity}/10.` });
  else if (ambulanceFlow === 'normal')
    telemetryEvents.push({ severity: 'success', type: 'STABILIZED', title: 'Ambulance Flow Nominal', message: `Transport network operating within nominal transit times.` });

  // Capacity
  if (icuPressure === 'critical')
    telemetryEvents.push({ severity: 'critical', type: 'ESCALATED', title: 'ICU Boarding Pressure', message: `ICU capacity at ${effectiveIcuPressure.toFixed(0)}%. Isolation demand elevated due to respiratory pressure.` });
  else if (icuPressure === 'elevated')
    telemetryEvents.push({ severity: 'warning', type: 'WARNING', title: 'ICU Capacity Elevated', message: `ICU capacity at ${effectiveIcuPressure.toFixed(0)}%.` });
  else
    telemetryEvents.push({ severity: 'success', type: 'RECOVERED', title: 'ICU Capacity Stabilized', message: `ICU capacity operating safely at ${effectiveIcuPressure.toFixed(0)}%.` });

  // Clinical/Respiratory
  if (respiratoryCritical)
    telemetryEvents.push({ severity: 'critical', type: 'ACTIVATED', title: 'Respiratory Surge Protocol', message: `Positivity rate at ${respiratoryPositivity}%. Viral pressure classified as Critical. Isolations demanded.` });
  else if (respiratoryElevated)
    telemetryEvents.push({ severity: 'warning', type: 'WARNING', title: 'Respiratory Activity Elevated', message: `Positivity rate at ${respiratoryPositivity}%.` });
  else
    telemetryEvents.push({ severity: 'success', type: 'STOOD DOWN', title: 'Respiratory Isolation', message: `Viral activity returning to baseline levels.` });

  // Staffing
  if (staffingStability === 'fragile')
    telemetryEvents.push({ severity: 'critical', type: 'ACTIVATED', title: 'Staffing Escalation Protocol', message: `Availability at ${staffingAvailability}%. Nurse-patient ratios below safe operating thresholds.` });
  else if (staffingStability === 'strained')
    telemetryEvents.push({ severity: 'warning', type: 'WARNING', title: 'Staffing Ratios Strained', message: `Availability at ${staffingAvailability}%.` });
  else
    telemetryEvents.push({ severity: 'success', type: 'RECOVERED', title: 'Staffing Stability', message: `Staffing availability restored to ${staffingAvailability}%.` });

  // ER
  if (erCongestion === 'volatile')
    telemetryEvents.push({ severity: 'warning', type: 'ESCALATED', title: 'ER Congestion Volatile', message: `ER intake at ${effectiveErPressure.toFixed(0)}% with boarding build-up. Triage pressure escalating.` });
  else if (erCongestion === 'stable')
    telemetryEvents.push({ severity: 'success', type: 'STABILIZED', title: 'ER Throughput Stable', message: `ER intake operations within baseline capacity.` });

  // Environmental
  if (weatherSeverity === 2)
    telemetryEvents.push({ severity: 'warning', type: 'ACTIVATED', title: 'Severe Weather Protocol', message: 'Heavy storm conditions active. Regional trauma response capacity degraded.' });

  // ── Vocabulary Bridge ──────────────────────────────────────────────────────
  // Translates internal state into the vocabulary that unitDispositionEngine
  // and predictiveInsightsEngine consume. This is the single translation point
  // ensuring ALL downstream engines read from the same operational truth.
  const intelligenceConditions = {
    // Transport
    ambulanceFlow:
      ambulanceFlow === 'critical intake compression' ? 'critical intake compression' :
      ambulanceFlow === 'delayed' ? 'degraded' : 'stable',

    // ER
    erCongestion:
      erCongestion === 'volatile' ? 'critical boarding failure' :
      erCongestion === 'elevated' ? 'high boarding pressure' : 'nominal',

    triagePressure:
      erCongestion === 'volatile' ? 'overwhelmed' :
      erCongestion === 'elevated' ? 'sustained strain' : 'manageable',

    // Respiratory / Isolation
    respiratoryPressure:
      respiratoryCritical ? 'critical surge strain' :
      respiratoryElevated ? 'elevated syndromic pressure' : 'stable',

    isolationCapacity:
      respiratoryCritical ? 'exhausted' :
      respiratoryElevated ? 'strained' : 'available',

    // Staffing
    staffingStability:
      staffingDepleted ? 'fragile ratios' :
      staffingStrained ? 'strained' : 'adequate',

    // Bed turnover (derived from combined ER + staffing pressure)
    bedTurnover:
      (staffingDepleted && erCongestion !== 'stable') ? 'sub-optimal throughput' :
      (!staffingStrained && erCongestion === 'stable') ? 'accelerated disposition' : 'nominal',

    // Trauma velocity (derived from ambulance + ER interaction)
    traumaVelocity:
      (ambulanceCritical && erCongestion === 'volatile') ? 'high-velocity volatility' :
      (ambulanceCritical || erCongestion === 'elevated') ? 'elevated presentation rate' : 'baseline',

    // Escalation label (for executive briefing / predictive engine)
    escalation:
      escalationFactors >= 4 ? 'Critical Incident Mode' :
      escalationFactors >= 3 ? 'Regional Emergency Coordination' :
      escalationFactors >= 2 ? 'Surge Protocol' :
      escalationFactors >= 1 ? 'Elevated Monitoring' : 'Stable',
  };

  // ICU window derived from effective pressure
  const icuWindowLabel =
    effectiveIcuPressure >= 95 ? '< 4h' :
    effectiveIcuPressure >= 88 ? '< 8h' :
    effectiveIcuPressure >= 75 ? '< 12h' :
    effectiveIcuPressure >= 60 ? '< 24h' : '> 24h';

  // OSI: Operational Stress Index (0–100)
  const osi = Math.min(100, Math.round(
    (effectiveIcuPressure * 0.25) +
    (effectiveErPressure * 0.20) +
    ((100 - staffingAvailability) * 0.25) +
    (respiratoryPositivity * 1.5 * 0.15) +
    (trafficSeverity * 5 * 0.15)
  ));

  // Surge probability (0–100)
  const surgeProb = Math.min(100, escalationFactors * 22);

  const intelligenceMetrics = {
    osi,
    surgeProb,
    delayRisk: Math.round(trafficSeverity * 8 + (weatherSeverity === 2 ? 20 : weatherSeverity === 1 ? 8 : 0)),
    icuWindow: icuWindowLabel,
    readinessScore: Math.max(20, 85 - Math.min(65, readinessPenalty)),
  };

  return {
    operationalState: {
      ambulanceFlow,
      icuPressure,
      staffingStability,
      respiratoryPressure,
      erCongestion,
      escalationRisk,
      occupancyMomentum,
      congestionTrajectory,
      staffingRecovery,
      respiratoryEscalation,
      intakeAcceleration,
    },
    intelligenceConditions,
    intelligenceMetrics,
    readinessDelta: Math.min(80, readinessPenalty),
    telemetryEvents,
    metrics: {
      trafficSeverity,
      respiratoryPositivity,
      staffingAvailability,
      erIntakeVolume: effectiveErPressure,
      icuCapacityPressure: effectiveIcuPressure,
      ambulanceLoad,
      weatherSeverity,
    },
  };

}

/**
 * Primary hook — memoized to prevent rerender storms.
 */
export function useOperationalSync(overrides) {
  const scenario = useMemo(() => overridesToScenario(overrides), [overrides]);

  const operationalSignal = useMemo(
    () => deriveOperationalSignal(overrides),
    [overrides]
  );

  return { scenario, operationalSignal };
}
