import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CloudLightning, Users, Activity, Ambulance, ShieldAlert, ThermometerSun, AlertCircle, Bot } from 'lucide-react';

const ControlGroup = ({ icon: Icon, title, options, value, onChange, colorClass }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className={colorClass} />
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
    </div>
    <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 shadow-inner relative">
      {options.map((opt, i) => {
        const isActive = value === opt.value;
        return (
          <button
            key={i}
            onClick={() => onChange(opt.value)}
            className={`flex-1 relative py-2.5 px-2 rounded-lg text-xs font-bold transition-all z-10 ${isActive ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {isActive && (
              <motion.div
                layoutId={`bg-${title}`}
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50 z-[-1]"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const ScenarioSimulator = ({ scenario, setScenario }) => {
  const summary = React.useMemo(() => {
    let conditions = [];
    if (scenario.weather === 2) conditions.push("severe storm activity");
    else if (scenario.weather === 1) conditions.push("sustained rainfall");
    
    if (scenario.viral === 2) conditions.push("a regional viral outbreak");
    else if (scenario.viral === 1) conditions.push("elevated seasonal viral spread");

    if (scenario.crowd === 2) conditions.push("high-density city events");
    else if (scenario.crowd === 1) conditions.push("moderate transit congestion");

    let conditionStr = conditions.length > 0 ? conditions.join(" and ") : "Nominal environmental conditions";
    conditionStr = conditionStr.charAt(0).toUpperCase() + conditionStr.slice(1);
    
    let impact = "maintain stable capacity";
    let metrics = "+0–3%";
    
    let riskScore = scenario.weather + scenario.viral + scenario.crowd;
    if (riskScore >= 4) {
        impact = "critically surge ER and trauma intakes";
        metrics = "+18–28%";
    } else if (riskScore >= 2) {
        impact = "elevate respiratory and acute admissions";
        metrics = "+8–15%";
    }
    
    let staffNote = "";
    if (scenario.staffing === -1) {
        staffNote = " Reduced staffing availability severely compounds operational fragility.";
    } else if (scenario.staffing === 1) {
        staffNote = " Surge capacity staffing buffers the expected impact, maintaining resilience.";
    } else if (scenario.traffic === 1) {
        staffNote = " Concurrent heavy traffic will likely disrupt ambulance ETA precision.";
    }

    return `${conditionStr} are projected to ${impact} by ${metrics} over the next 8–12 hours.${staffNote}`;
  }, [scenario]);

  return (
    <div className="vision-card glass-reflection p-6 h-fit shrink-0 w-full relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Scenario Lab <Sparkles size={18} className="text-indigo-500" />
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Real-time Surge Simulation Engine</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Live Engine</span>
        </div>
      </div>

      <div className="p-4 rounded-xl vision-glass-light border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] mb-8 relative z-10 group">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/80 shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
            <Bot size={16} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">AI Scenario Projection</span>
            <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
              {summary}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <ControlGroup 
          icon={CloudLightning} title="Weather Severity" colorClass="text-blue-500"
          value={scenario.weather} onChange={v => setScenario(s => ({ ...s, weather: v }))}
          options={[ { label: 'Clear', value: 0 }, { label: 'Rain', value: 1 }, { label: 'Severe Storm', value: 2 } ]}
        />
        <ControlGroup 
          icon={Users} title="Crowd Density" colorClass="text-purple-500"
          value={scenario.crowd} onChange={v => setScenario(s => ({ ...s, crowd: v }))}
          options={[ { label: 'Low', value: 0 }, { label: 'Moderate', value: 1 }, { label: 'High', value: 2 } ]}
        />
        <ControlGroup 
          icon={ThermometerSun} title="Viral Activity" colorClass="text-rose-500"
          value={scenario.viral} onChange={v => setScenario(s => ({ ...s, viral: v }))}
          options={[ { label: 'Minimal', value: 0 }, { label: 'Elevated', value: 1 }, { label: 'Outbreak', value: 2 } ]}
        />
        <ControlGroup 
          icon={ShieldAlert} title="Staffing Readiness" colorClass="text-emerald-500"
          value={scenario.staffing} onChange={v => setScenario(s => ({ ...s, staffing: v }))}
          options={[ { label: 'Reduced', value: -1 }, { label: 'Normal', value: 0 }, { label: 'Surge', value: 1 } ]}
        />
        <ControlGroup 
          icon={Ambulance} title="Traffic & Logistics" colorClass="text-amber-500"
          value={scenario.traffic} onChange={v => setScenario(s => ({ ...s, traffic: v }))}
          options={[ { label: 'Clear', value: 0 }, { label: 'Heavy/Blocked', value: 1 } ]}
        />
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200/60 flex justify-between items-center relative z-10">
         <span className="text-xs font-semibold text-slate-500">Variables automatically applied to dashboard.</span>
         <button 
           onClick={() => setScenario({ weather: 0, crowd: 0, viral: 0, staffing: 0, traffic: 0 })}
           className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
         >
           Reset Baseline
         </button>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
