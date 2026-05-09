import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const loadEntry = payload.find(p => p.dataKey === 'load');
  const baseEntry = payload.find(p => p.dataKey === 'baseline');
  const load = loadEntry?.value ?? 0;
  const base = baseEntry?.value ?? 0;
  const delta = load - base;
  return (
    <div className="vision-glass px-5 py-4 rounded-2xl shadow-xl min-w-[160px]">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-mono font-bold text-slate-800 leading-none mb-1">{load}%</p>
      <p className="text-xs text-slate-400 font-medium mb-2">
        {delta > 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`} vs baseline
      </p>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-600" />
        <span className="text-xs font-semibold text-blue-600">Operational Forecast</span>
      </div>
    </div>
  );
};

/**
 * Derives a causally deformed forecast curve from the operational signal.
 * Each failure type produces a distinct, clinically believable curve shape.
 */
function deriveOperationalForecast(data, operationalSignal) {
  if (!data || data.length === 0) return [];
  if (!operationalSignal) {
    return data.map((d, i) => ({
      name: d?.day ?? '',
      load: d?.load ?? 0,
      baseline: Math.max(0, Math.round((d?.load ?? 0) - 12 - i * 1.5)),
    }));
  }

  const {
    operationalState: {
      ambulanceFlow,
      icuPressure,
      staffingStability,
      respiratoryPressure,
      erCongestion,
      escalationRisk,
      respiratoryEscalation,
      occupancyMomentum,
      staffingRecovery,
    } = {},
    intelligenceMetrics: {
      osi = 30,
      readinessScore = 80,
    } = {},
    metrics: {
      icuCapacityPressure = 70,
      respiratoryPositivity = 12,
      staffingAvailability = 85,
      trafficSeverity = 3,
      weatherSeverity = 0,
    } = {},
  } = operationalSignal;

  const n = data.length;

  // ── Failure mode weights ──────────────────────────────────────────────────
  // Each produces a distinct deformation pattern across the 7-day horizon.

  const isRespiratoryEscalation = respiratoryEscalation === 'rapidly worsening' || respiratoryPressure === 'elevated';
  const isTransportDisruption = ambulanceFlow === 'critical intake compression' || ambulanceFlow === 'delayed';
  const isStaffingCrisis = staffingStability === 'fragile' || staffingStability === 'strained';
  const isICUCritical = icuPressure === 'critical' || occupancyMomentum === 'rapidly worsening';
  const isWeatherEvent = weatherSeverity >= 1;
  const isCascadingFailure = escalationRisk === 'critical' || escalationRisk === 'elevated';

  return data.map((d, i) => {
    const baseLoad = d?.load ?? 0;
    const dayFraction = i / Math.max(n - 1, 1); // 0 → 1 across the week

    let momentum = 0;

    // ── Respiratory Escalation ──
    // Gradual multi-day rise, sustained plateau, delayed recovery tail.
    if (isRespiratoryEscalation) {
      const intensity = respiratoryPositivity >= 25 ? 1.0 : 0.55;
      // Rises through mid-week, plateaus days 3–5, recovers slowly at end
      const respiratoryShape =
        i <= 2 ? dayFraction * 0.6 * intensity :  // gradual rise
        i <= 4 ? 0.55 * intensity :                 // sustained plateau
        (0.55 - (i - 4) * 0.08) * intensity;        // slow tail recovery
      momentum += respiratoryShape * 18;
    }

    // ── Transport / Ambulance Disruption ──
    // Sharp near-term spike on days 0–2, normalizes by day 4–5.
    if (isTransportDisruption) {
      const intensity = ambulanceFlow === 'critical intake compression' ? 1.0 : 0.5;
      const transportShape =
        i <= 1 ? 0.9 * intensity :     // sharp near-term spike
        i <= 2 ? 0.65 * intensity :     // volatility
        i <= 3 ? 0.3 * intensity :      // partial recovery
        0.08 * intensity;               // normalized
      momentum += transportShape * 16;
    }

    // ── Staffing Crisis ──
    // Flattened throughput — no sharp spikes, but elevated AND persistent.
    // Suppresses recovery — no downward curve at end of week.
    if (isStaffingCrisis) {
      const intensity = staffingStability === 'fragile' ? 1.0 : 0.55;
      // Flat, uniform elevation (not exponential — staffing doesn't create spikes)
      const staffingShape = 0.5 + (dayFraction * 0.15 * intensity);
      momentum += staffingShape * 14;
    }

    // ── ICU Saturation Momentum ──
    // Back-loaded — pressure accumulates. Gets worse as week progresses.
    if (isICUCritical) {
      const intensity = icuCapacityPressure >= 90 ? 1.0 : 0.6;
      const icuShape = dayFraction * dayFraction * intensity; // quadratic build
      momentum += icuShape * 16;
    }

    // ── Weather Event ──
    // Short sharp spike at start (day 0–1), rapid recovery.
    if (isWeatherEvent) {
      const intensity = weatherSeverity === 2 ? 1.0 : 0.4;
      const weatherShape = Math.max(0, 1 - dayFraction * 2.5) * intensity;
      momentum += weatherShape * 12;
    }

    // ── Cascading / Mixed Failure ──
    // Compounding instability — adds non-linearity across the whole week.
    if (isCascadingFailure) {
      const intensity = escalationRisk === 'critical' ? 1.0 : 0.5;
      // Oscillating instability that doesn't resolve cleanly
      const cascadeShape = 0.4 + Math.sin(dayFraction * Math.PI * 1.5) * 0.25;
      momentum += cascadeShape * 12 * intensity;
    }

    // ── OSI Ambient Lift ──
    // Even without a specific failure, high operational stress index raises the curve.
    const ambientLift = Math.max(0, (osi - 35) / 100) * 8;
    momentum += ambientLift;

    // Apply and clamp
    const deformedLoad = Math.min(100, Math.max(0, Math.round(baseLoad + momentum)));
    const baseline = Math.max(0, Math.round(baseLoad - 12 - i * 1.5));

    return {
      name: d?.day ?? '',
      load: deformedLoad,
      baseline,
    };
  });
}

/**
 * Derives the stroke/fill color of the forecast line based on operational posture.
 */
function deriveChartColors(operationalSignal) {
  const escalation = operationalSignal?.operationalState?.escalationRisk;
  const icu = operationalSignal?.operationalState?.icuPressure;
  if (escalation === 'critical') return { stroke: '#ef4444', fill: '#ef4444' };
  if (escalation === 'elevated' || icu === 'critical') return { stroke: '#f97316', fill: '#f97316' };
  const osi = operationalSignal?.intelligenceMetrics?.osi ?? 30;
  if (osi >= 55) return { stroke: '#eab308', fill: '#eab308' };
  return { stroke: '#2563eb', fill: '#2563eb' };
}

const ForecastChart = ({ data = [], selectedIndex = 0, operationalSignal = null }) => {
  const chartData = useMemo(
    () => deriveOperationalForecast(data, operationalSignal),
    [data, operationalSignal]
  );

  const colors = useMemo(() => deriveChartColors(operationalSignal), [operationalSignal]);
  const { stroke, fill } = colors;

  return (
    <div className="w-full h-full relative min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 28 }}>
          <defs>
            <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.22} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(15,23,42,0.06)" />

          <XAxis
            dataKey="name"
            axisLine={false} tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: stroke, strokeWidth: 1.5, strokeDasharray: '4 4' }} />

          {/* Historical baseline ghost */}
          <Area type="monotone" dataKey="baseline"
            stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4"
            fill="url(#gradBaseline)" fillOpacity={1} activeDot={false} />

          {/* Primary operational forecast */}
          <Area type="monotone" dataKey="load"
            stroke={stroke} strokeWidth={3} fill="url(#gradLoad)" fillOpacity={1}
            animationDuration={1200}
            activeDot={{ r: 6, fill: '#fff', stroke: stroke, strokeWidth: 3 }} />

          {/* Critical threshold */}
          <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={1.5}
            label={{ value: '⚠ Critical', position: 'right', fill: '#f43f5e', fontSize: 11, fontWeight: 700 }} />

          {/* Selected day marker */}
          {chartData[selectedIndex] && (
            <ReferenceLine
              x={chartData[selectedIndex].name}
              stroke="#6366f1" strokeWidth={2} strokeDasharray="3 3"
              label={{ value: '▼', position: 'top', fill: '#6366f1', fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="absolute bottom-0 left-2 flex items-center gap-5 pointer-events-none pb-1">
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-slate-600 tracking-wide">Operational Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 tracking-wide">Seasonal Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="18" height="10" viewBox="0 0 18 10">
            <line x1="0" y1="5" x2="18" y2="5" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-rose-500 tracking-wide">Critical</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
