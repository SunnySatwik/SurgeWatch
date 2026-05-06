import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CloudLightning, Users, ThermometerSun, ShieldAlert, Ambulance, Activity, Play, CheckCircle2, ChevronRight, TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';

const PRESETS = [
  { name: 'Baseline', config: { weather: 0, crowd: 0, viral: 0, staffing: 0, traffic: 0 } },
  { name: 'Monsoon Surge', config: { weather: 2, crowd: 1, viral: 1, staffing: 0, traffic: 1 } },
  { name: 'Festival Weekend', config: { weather: 0, crowd: 2, viral: 0, staffing: -1, traffic: 1 } },
  { name: 'Viral Outbreak', config: { weather: 1, crowd: 0, viral: 2, staffing: 0, traffic: 0 } },
  { name: 'Staffing Crisis', config: { weather: 0, crowd: 0, viral: 0, staffing: -1, traffic: 0 } },
];

const getMetrics = (scenario) => {
   let osi = 32 + (scenario.weather * 15) + (scenario.viral * 12) + (scenario.crowd * 8) - (scenario.staffing * 10) + (scenario.traffic * 5);
   let surgeProb = 15 + (scenario.weather * 20) + (scenario.viral * 15) + (scenario.crowd * 10);
   let delayRisk = 10 + (scenario.weather * 25) + (scenario.traffic * 30) + (scenario.crowd * 5);
   
   let icuWindowNum = 24 - (scenario.viral * 6) - (scenario.weather * 3) + (scenario.staffing * 4);
   let icuWindow = icuWindowNum < 4 ? '< 4h' : icuWindowNum < 8 ? '< 8h' : icuWindowNum < 12 ? '< 12h' : '> 24h';

   return { 
     osi: Math.min(100, Math.max(0, osi)),
     surgeProb: Math.min(99, Math.max(0, surgeProb)),
     delayRisk: Math.min(99, Math.max(0, delayRisk)),
     icuWindow
   };
};

const getTimeline = (scenario) => {
   let t = [
     { time: '+2h', text: 'Nominal operations. Capacity stable.', alert: false },
     { time: '+4h', text: 'Standard ER intake rate.', alert: false },
     { time: '+6h', text: 'Shift change nominal.', alert: false },
     { time: '+8h', text: 'End of forecast window.', alert: false },
   ];

   if (scenario.weather >= 1) {
     t[0] = { time: '+2h', text: 'Ambulance rerouting initiated due to road flooding.', alert: true };
     t[2] = { time: '+6h', text: 'Respiratory and trauma intakes peak.', alert: true };
   }
   if (scenario.viral >= 1) {
     t[1] = { time: '+4h', text: 'Triage queue expands with suspected infectious cases.', alert: true };
   }
   if (scenario.staffing === -1) {
     t[3] = { time: '+8h', text: 'Nurse-to-patient ratio hits critical threshold.', alert: true };
   }
   if (scenario.crowd >= 1) {
     t[1] = { time: '+4h', text: 'Localized minor injury clusters arriving from transit hubs.', alert: true };
   }
   return t;
};

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

const ComparisonMetric = ({ label, baseline, simulated, unit, invertAlert }) => {
  const diff = simulated - baseline;
  const isDiff = diff !== 0;
  const isBad = invertAlert ? diff < 0 : diff > 0;
  
  return (
    <div className="vision-glass-light p-4 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden group">
      {isDiff && isBad && <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />}
      {isDiff && !isBad && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
      
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{label}</p>
      
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">
            {simulated}
          </span>
          <span className="text-sm font-bold text-slate-400">{unit}</span>
        </div>
        
        {isDiff ? (
           <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${isBad ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
             {diff > 0 ? '+' : ''}{diff}{unit}
             <TrendingUp size={12} className={diff < 0 ? 'rotate-180' : ''} />
           </div>
        ) : (
           <div className="text-xs font-bold text-slate-400 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
             No change
           </div>
        )}
      </div>
    </div>
  );
};

const ScenarioSimulator = ({ baseData }) => {
  // We keep a draft scenario (what sliders show) and an active scenario (what metrics run off)
  const [draft, setDraft] = useState(PRESETS[0].config);
  const [active, setActive] = useState(PRESETS[0].config);
  const [isSimulating, setIsSimulating] = useState(false);

  const baselineMetrics = useMemo(() => getMetrics(PRESETS[0].config, true), []);
  const activeMetrics = useMemo(() => getMetrics(active), [active]);
  const activeTimeline = useMemo(() => getTimeline(active), [active]);

  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(active);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    // Simulate AI processing delay for premium feel
    setTimeout(() => {
      setActive(draft);
      setIsSimulating(false);
    }, 1200);
  };

  const applyPreset = (preset) => {
    setDraft(preset.config);
    // Auto run for presets to make it feel responsive
    setIsSimulating(true);
    setTimeout(() => {
      setActive(preset.config);
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 pb-20 font-sans">
       
       {/* LEFT: Scenario Engine Controls */}
       <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
          <div className="vision-card glass-reflection p-6 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-400/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  Simulation Engine <Zap size={18} className="text-amber-500" />
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Configure parameters to model impact</p>
              </div>
            </div>

            {/* Presets */}
            <div className="mb-8 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => applyPreset(p)}
                    className="px-3 py-1.5 rounded-xl vision-glass-light border border-slate-200/60 text-xs font-bold text-slate-600 hover:text-slate-800 hover:border-amber-200 hover:bg-amber-50/50 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-1 relative z-10">
              <ControlGroup 
                icon={CloudLightning} title="Weather Severity" colorClass="text-blue-500"
                value={draft.weather} onChange={v => setDraft(s => ({ ...s, weather: v }))}
                options={[ { label: 'Clear', value: 0 }, { label: 'Rain', value: 1 }, { label: 'Severe Storm', value: 2 } ]}
              />
              <ControlGroup 
                icon={Users} title="Public Crowd Density" colorClass="text-purple-500"
                value={draft.crowd} onChange={v => setDraft(s => ({ ...s, crowd: v }))}
                options={[ { label: 'Low', value: 0 }, { label: 'Moderate', value: 1 }, { label: 'High', value: 2 } ]}
              />
              <ControlGroup 
                icon={ThermometerSun} title="Viral Activity" colorClass="text-rose-500"
                value={draft.viral} onChange={v => setDraft(s => ({ ...s, viral: v }))}
                options={[ { label: 'Minimal', value: 0 }, { label: 'Elevated', value: 1 }, { label: 'Outbreak', value: 2 } ]}
              />
              <ControlGroup 
                icon={ShieldAlert} title="Staffing Availability" colorClass="text-emerald-500"
                value={draft.staffing} onChange={v => setDraft(s => ({ ...s, staffing: v }))}
                options={[ { label: 'Reduced', value: -1 }, { label: 'Normal', value: 0 }, { label: 'Surge', value: 1 } ]}
              />
              <ControlGroup 
                icon={Ambulance} title="Traffic Congestion" colorClass="text-amber-500"
                value={draft.traffic} onChange={v => setDraft(s => ({ ...s, traffic: v }))}
                options={[ { label: 'Low', value: 0 }, { label: 'Heavy', value: 1 } ]}
              />
            </div>

            {/* Run Button */}
            <div className="mt-8 relative z-10">
              <button 
                onClick={handleRunSimulation}
                disabled={isSimulating || !hasDraftChanges}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg
                  ${isSimulating ? 'bg-amber-100 text-amber-500 border border-amber-200 shadow-amber-500/10' : 
                    hasDraftChanges ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-900/20 active:scale-[0.98]' : 
                    'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'}`}
              >
                {isSimulating ? (
                  <>
                    <Activity size={16} className="animate-spin" />
                    Computing Projections...
                  </>
                ) : hasDraftChanges ? (
                  <>
                    <Play size={16} className="fill-current" />
                    Run Simulation Flow
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Simulation Up to Date
                  </>
                )}
              </button>
            </div>
          </div>
       </div>

       {/* RIGHT: Simulation Outputs */}
       <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
          
          {/* Top Panel: Baseline vs Simulation Metrics */}
          <div className="vision-card glass-reflection p-6 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-6">
               <Activity size={16} className="text-amber-500" />
               <h3 className="text-sm font-display font-bold text-slate-800">Operational Stress Modeler</h3>
               <span className="ml-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-[9px] font-black text-amber-600 uppercase tracking-widest">
                 Live Deltas
               </span>
             </div>

             <div className="grid grid-cols-2 gap-4 relative">
                <AnimatePresence>
                  {isSimulating && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl"
                    >
                      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white shadow-xl shadow-slate-900/5 border border-slate-100">
                        <Activity size={18} className="text-amber-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-700">Modeling operational impact...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ComparisonMetric label="Operational Stress Index" baseline={baselineMetrics.osi} simulated={activeMetrics.osi} unit="" invertAlert={false} />
                <ComparisonMetric label="Surge Probability" baseline={baselineMetrics.surgeProb} simulated={activeMetrics.surgeProb} unit="%" invertAlert={false} />
                <ComparisonMetric label="Ambulance Delay Risk" baseline={baselineMetrics.delayRisk} simulated={activeMetrics.delayRisk} unit="%" invertAlert={false} />
                
                {/* Custom ICU Metric without numerical diff */}
                <div className="vision-glass-light p-4 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden group">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">ICU Saturation Window</p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">
                      {activeMetrics.icuWindow}
                    </span>
                    {activeMetrics.icuWindow !== baselineMetrics.icuWindow ? (
                       <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                         Accelerated
                       </div>
                    ) : (
                       <div className="text-xs font-bold text-slate-400 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                         Stable
                       </div>
                    )}
                  </div>
                </div>
             </div>
          </div>

          {/* Bottom Panel: Temporal Simulation Timeline */}
          <div className="vision-card glass-reflection p-6 flex-1">
             <div className="flex items-center gap-2 mb-8">
               <Clock size={16} className="text-indigo-500" />
               <h3 className="text-sm font-display font-bold text-slate-800">Operational Timeline</h3>
               <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 Next 8 Hours Projected
               </span>
             </div>

             <div className="relative pl-4 space-y-8">
               {/* Vertical line connecting timeline */}
               <div className="absolute left-[21px] top-2 bottom-2 w-px bg-slate-200" />

               {activeTimeline.map((item, i) => (
                 <div key={i} className="relative flex items-start gap-6">
                   {/* Node */}
                   <div className="relative z-10 flex flex-col items-center mt-0.5">
                     <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${item.alert ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-300'}`} />
                   </div>
                   
                   {/* Content */}
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.15 }}
                     className="flex-1"
                   >
                     <div className="flex items-center gap-3 mb-1.5">
                       <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                         {item.time}
                       </span>
                       {item.alert && (
                         <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                           <AlertTriangle size={10} /> Elevated Risk
                         </span>
                       )}
                     </div>
                     <p className={`text-sm font-medium leading-relaxed ${item.alert ? 'text-slate-800' : 'text-slate-500'}`}>
                       {item.text}
                     </p>
                   </motion.div>
                 </div>
               ))}
             </div>
          </div>

       </div>
    </div>
  );
};

export default ScenarioSimulator;
