import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SlidersHorizontal, Wind, Thermometer, Users, Ambulance,
  FlaskConical, BedDouble, ChevronDown, RotateCcw, Zap,
  ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react';

// Default neutral override state
export const DEFAULT_OVERRIDES = {
  trafficSeverity: 3,       // 1–10
  respiratoryPositivity: 12, // % 0–50
  staffingAvailability: 85,  // % 50–100
  erIntakeVolume: 40,        // % 0–100
  icuCapacityPressure: 70,   // % 0–100
  ambulanceLoad: 5,          // 1–15 active units
  weatherSeverity: 0,        // 0 = clear, 1 = rain, 2 = heavy storm
};

const WEATHER_LABELS = { 0: 'Clear', 1: 'Rain', 2: 'Heavy Storm' };
const WEATHER_COLORS = {
  0: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  1: 'text-amber-600 bg-amber-50 border-amber-200',
  2: 'text-red-600 bg-red-50 border-red-200',
};

// Maps overrides → scenario-compatible modifiers for intelligenceEngine
export function overridesToScenario(overrides) {
  return {
    traffic: overrides.trafficSeverity >= 8 ? 1 : 0,
    weather: overrides.weatherSeverity,
    viral: overrides.respiratoryPositivity >= 25 ? 2 : overrides.respiratoryPositivity >= 15 ? 1 : 0,
    staffing: overrides.staffingAvailability >= 90 ? 1 : overrides.staffingAvailability <= 65 ? -1 : 0,
    crowd: overrides.erIntakeVolume >= 80 ? 2 : overrides.erIntakeVolume >= 60 ? 1 : 0,
  };
}

const ControlSlider = ({ label, icon: Icon, value, min, max, step = 1, unit, color, onChange, formatValue }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const displayVal = formatValue ? formatValue(value) : `${value}${unit || ''}`;

  const severity = pct > 80 ? 'critical' : pct > 60 ? 'high' : pct > 35 ? 'moderate' : 'low';
  const trackColor =
    severity === 'critical' ? 'from-rose-500 to-red-600' :
    severity === 'high' ? 'from-orange-400 to-orange-500' :
    severity === 'moderate' ? 'from-amber-400 to-amber-500' :
    'from-emerald-400 to-emerald-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${color}`}>
            <Icon size={11} />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md border
          ${severity === 'critical' ? 'text-red-700 bg-red-50 border-red-200' :
            severity === 'high' ? 'text-orange-700 bg-orange-50 border-orange-200' :
            severity === 'moderate' ? 'text-amber-700 bg-amber-50 border-amber-200' :
            'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
          {displayVal}
        </span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${trackColor}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 opacity-0 absolute cursor-pointer"
        style={{ marginTop: '-20px', position: 'relative' }}
      />
    </div>
  );
};

const WeatherToggle = ({ value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="p-1 rounded-md bg-sky-50 text-sky-500">
        <Wind size={11} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Weather Severity</span>
    </div>
    <div className="flex gap-2">
      {[0, 1, 2].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all
            ${value === v
              ? WEATHER_COLORS[v]
              : 'text-slate-400 bg-slate-50 border-slate-100 hover:border-slate-200'
            }`}
        >
          {WEATHER_LABELS[v]}
        </button>
      ))}
    </div>
  </div>
);

const OperationalControlPanel = ({ overrides, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const set = useCallback((key, val) => {
    onChange({ ...overrides, [key]: val });
  }, [overrides, onChange]);

  const reset = () => onChange(DEFAULT_OVERRIDES);

  // Derive current posture label
  const scenario = overridesToScenario(overrides);
  const stressLevel = Object.values(scenario).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  const postureLabel = stressLevel >= 6 ? 'CRITICAL' : stressLevel >= 3 ? 'ELEVATED' : stressLevel >= 1 ? 'MONITORED' : 'BASELINE';
  const postureColor =
    stressLevel >= 6 ? 'text-red-700 bg-red-50 border-red-200 animate-pulse' :
    stressLevel >= 3 ? 'text-orange-700 bg-orange-50 border-orange-200' :
    stressLevel >= 1 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className="vision-card glass-reflection relative overflow-hidden">
      {/* Ambient glow on high stress */}
      {stressLevel >= 4 && (
        <motion.div
          animate={{ opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-red-400/10 pointer-events-none"
        />
      )}

      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50">
            <SlidersHorizontal size={15} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-display font-bold text-slate-800">Operational Control Console</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
              Live Simulation Override Layer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${postureColor}`}>
            {postureLabel}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Controls */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="controls"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 relative z-10 border-t border-slate-100">
              {/* Quick posture descriptor */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {stressLevel >= 3
                    ? <AlertTriangle size={12} className="text-orange-500" />
                    : <CheckCircle2 size={12} className="text-emerald-500" />}
                  <span className="text-[10px] text-slate-500 font-medium">
                    {stressLevel >= 6 ? 'Extreme operational stress applied — surge cascade expected.' :
                     stressLevel >= 3 ? 'Moderate overrides active — monitoring for escalation triggers.' :
                     stressLevel >= 1 ? 'Minor overrides applied — operational baseline intact.' :
                     'No overrides active — system running on raw telemetry.'}
                  </span>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 border border-slate-200 hover:text-slate-700 hover:border-slate-300 transition-all"
                >
                  <RotateCcw size={9} /> Reset
                </button>
              </div>

              {/* Controls Grid: 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <ControlSlider
                  label="Traffic Severity"
                  icon={Ambulance}
                  value={overrides.trafficSeverity}
                  min={1} max={10}
                  unit="/10"
                  color="bg-amber-50 text-amber-600"
                  onChange={v => set('trafficSeverity', v)}
                />
                <ControlSlider
                  label="Respiratory Positivity"
                  icon={FlaskConical}
                  value={overrides.respiratoryPositivity}
                  min={0} max={50}
                  unit="%"
                  color="bg-rose-50 text-rose-600"
                  onChange={v => set('respiratoryPositivity', v)}
                />
                <ControlSlider
                  label="Staffing Availability"
                  icon={Users}
                  value={overrides.staffingAvailability}
                  min={50} max={100}
                  unit="%"
                  color="bg-blue-50 text-blue-600"
                  onChange={v => set('staffingAvailability', v)}
                />
                <ControlSlider
                  label="ER Intake Volume"
                  icon={Zap}
                  value={overrides.erIntakeVolume}
                  min={0} max={100}
                  unit="%"
                  color="bg-orange-50 text-orange-600"
                  onChange={v => set('erIntakeVolume', v)}
                />
                <ControlSlider
                  label="ICU Capacity Pressure"
                  icon={BedDouble}
                  value={overrides.icuCapacityPressure}
                  min={0} max={100}
                  unit="%"
                  color="bg-purple-50 text-purple-600"
                  onChange={v => set('icuCapacityPressure', v)}
                />
                <ControlSlider
                  label="Ambulance Load"
                  icon={ShieldAlert}
                  value={overrides.ambulanceLoad}
                  min={1} max={15}
                  unit=" units"
                  color="bg-indigo-50 text-indigo-600"
                  onChange={v => set('ambulanceLoad', v)}
                />
              </div>

              {/* Weather toggle — full width */}
              <WeatherToggle
                value={overrides.weatherSeverity}
                onChange={v => set('weatherSeverity', v)}
              />

              {/* Derived scenario signal strip */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Derived Scenario Signals
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(scenario).map(([key, val]) => {
                    const isActive = val > 0;
                    const isNeg = val < 0;
                    return (
                      <span key={key} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                        ${isNeg ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          isActive ? 'text-orange-700 bg-orange-50 border-orange-200' :
                          'text-slate-400 bg-slate-50 border-slate-100'}`}>
                        {key}:{val > 0 ? `+${val}` : val}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OperationalControlPanel;
