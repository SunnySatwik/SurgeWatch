import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Activity, Server, Radio, Link2, 
  CloudRain, Users, FlaskConical, Pill, Globe,
  ArrowRight, ShieldCheck, Zap, CheckCircle2, Clock, PauseCircle
} from 'lucide-react';
import { generateTelemetryEvent, generateInitialEvents } from '../../utils/telemetryEngine';
import { getLiveOperationalLabel } from '../../utils/temporalEngine';

const INITIAL_CARDS = [
  { id: 'ehr', title: "EHR Feed", icon: Database, latency: 12, state: "Active", color: "text-blue-500", bg: "bg-blue-50" },
  { id: 'bed', title: "Bed Management", icon: Server, latency: 8, state: "Active", color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: 'amb', title: "Ambulance Telemetry", icon: Radio, latency: 45, state: "Degraded", color: "text-amber-500", bg: "bg-amber-50" },
  { id: 'wea', title: "Weather Intelligence", icon: CloudRain, latency: 110, state: "Active", color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: 'stf', title: "Staffing Roster", icon: Users, latency: 15, state: "Active", color: "text-purple-500", bg: "bg-purple-50" },
  { id: 'lab', title: "Lab Positivity Feed", icon: FlaskConical, latency: 24, state: "Active", color: "text-rose-500", bg: "bg-rose-50" },
  { id: 'pha', title: "Pharmacy Inventory", icon: Pill, latency: 32, state: "Warning", color: "text-orange-500", bg: "bg-orange-50" },
  { id: 'pub', title: "Regional Public Health", icon: Globe, latency: 18, state: "Active", color: "text-cyan-500", bg: "bg-cyan-50" }
];

const INTEROPERABILITY_TAGS = [
  "FHIR Ready", "HL7 Bridge Active", "ICD-10 Mapping", 
  "Secure Sync", "Signal Redundancy", "Edge Failover"
];

// Derive regional signals from live operational conditions instead of hardcoded strings
const deriveRegionalSignals = (operationalState) => {
  const cond = operationalState?.intelligence?.conditions ?? {};
  const metrics = operationalState?.metrics ?? {};

  const trafficStatus = cond.ambulanceFlow === 'critical intake compression' ? 'warning'
    : cond.ambulanceFlow === 'degraded' ? 'warning' : 'success';
  const trafficValue = cond.ambulanceFlow === 'critical intake compression'
    ? 'Critical / ORR + Silk Board gridlock'
    : cond.ambulanceFlow === 'degraded'
    ? 'Elevated / ORR congestion'
    : 'Normal / All corridors clear';

  const rainfallStatus = cond.ambulanceFlow?.includes('flooding') || cond.regionalContext?.includes('Monsoon') ? 'warning' : 'info';
  const rainfallValue = operationalState ? `${metrics.delayRisk ?? 0}% delay risk index` : 'No active alerts';

  const viralStatus = cond.isolationCapacity === 'exhausted' || cond.respiratoryPressure === 'critical surge strain'
    ? 'warning' : cond.respiratoryPressure === 'elevated syndromic pressure' ? 'warning' : 'success';
  const viralValue = cond.isolationCapacity === 'exhausted'
    ? 'Critical Respiratory Surge'
    : cond.respiratoryPressure === 'elevated syndromic pressure'
    ? 'Elevated Respiratory'
    : 'Within Baseline';

  const eventStatus = cond.traumaVelocity === 'high-velocity volatility' ? 'warning'
    : cond.traumaVelocity === 'elevated presentation rate' ? 'warning' : 'success';
  const eventValue = cond.traumaVelocity === 'high-velocity volatility'
    ? 'Mass Gathering / High Trauma Risk'
    : cond.traumaVelocity === 'elevated presentation rate'
    ? 'Event Active / Moderate Risk'
    : 'Nominal';

  return [
    { label: 'Traffic Density',       value: trafficValue, status: trafficStatus },
    { label: 'Transit Delay Index',   value: rainfallValue, status: rainfallStatus },
    { label: 'District Viral Trends', value: viralValue,   status: viralStatus },
    { label: 'Event / Crowd Density', value: eventValue,   status: eventStatus },
  ];
};

const ConnectivityCard = ({ data, index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="vision-card glass-reflection p-4 flex flex-col justify-between relative overflow-hidden"
  >
    {/* Sync Shimmer Effect on Active State */}
    {data.state === 'Active' && (
      <motion.div 
        animate={{ x: ['-100%', '200%'] }} 
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none opacity-30 z-0"
      />
    )}

    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={`p-2 rounded-xl ${data.bg} relative`}>
        <data.icon size={16} className={data.color} />
        {/* Pulse Indicator */}
        {data.state === 'Active' && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>
      <motion.div 
        layout
        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors duration-500
        ${data.state === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          data.state === 'Degraded' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
          data.state === 'Recovering' ? 'bg-blue-50 text-blue-600 border-blue-100' :
          'bg-orange-50 text-orange-600 border-orange-100'}`}>
        {data.state}
      </motion.div>
    </div>
    
    <div className="relative z-10">
      <h4 className="text-sm font-bold text-slate-800 tracking-tight">{data.title}</h4>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Activity size={12} className={data.state === 'Active' ? "text-emerald-500" : data.state === 'Recovering' ? "text-blue-500" : "text-amber-500"} />
          Latency: 
          <motion.span 
            key={data.latency}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-slate-700 w-8"
          >
            {data.latency}ms
          </motion.span>
        </div>
        <span className="text-[10px] text-slate-400 truncate ml-2">Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  </motion.div>
);

const PipelineNode = ({ icon: Icon, title, subtitle, colorClass, borderClass, bgClass, glowClass }) => (
  <div className={`flex-1 ${bgClass} border ${borderClass} rounded-2xl p-4 text-center relative overflow-hidden group`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${glowClass} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
    <Icon size={20} className={`${colorClass} mx-auto mb-2 relative z-10`} />
    <p className="text-xs font-bold text-slate-700 relative z-10">{title}</p>
    <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 relative z-10">{subtitle}</p>
  </div>
);

const AnimatedArrow = ({ delay }) => (
  <div className="relative text-indigo-300 w-8 flex justify-center items-center">
    <div className="h-0.5 w-full bg-indigo-100 rounded-full absolute" />
    <motion.div 
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 10, opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: delay, ease: "linear" }}
      className="absolute w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
    />
    <ArrowRight size={20} className="relative z-10 text-indigo-300" />
  </div>
);

const IntegrationHub = ({ operationalState, testMode = false }) => {
  // Seed events from the engine so initial load is already context-aware
  const [events, setEvents] = useState(() => generateInitialEvents(operationalState));
  const [cards, setCards] = useState(INITIAL_CARDS);
  // Stable ref to the last event — avoids the interval closure capturing stale state
  const lastEventRef = useRef(null);
  // Live label (updates once per mount — no interval needed for the label itself)
  const liveLabel = getLiveOperationalLabel();
  // Dynamic regional signals derived from the operational state
  const regionalSignals = deriveRegionalSignals(operationalState);

  // Re-seed event stream whenever operational state meaningfully changes
  useEffect(() => {
    setEvents(generateInitialEvents(operationalState));
  }, [
    operationalState?.intelligence?.escalation,
    operationalState?.intelligence?.conditions?.ambulanceFlow,
    operationalState?.intelligence?.conditions?.isolationCapacity,
  ]);

  // Context-aware live telemetry generator — paused in test mode
  useEffect(() => {
    if (testMode) return; // freeze when test mode is active
    let timeout;
    const schedule = () => {
      // Variable interval: 4–9 seconds, longer when stable
      const baseMs = 4000;
      const jitterMs = 5000;
      timeout = setTimeout(() => {
        const template = generateTelemetryEvent(operationalState, lastEventRef.current);
        lastEventRef.current = template;
        const newEvent = {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text: template.text,
          type: template.type
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 8));
        schedule(); // reschedule after each emission
      }, baseMs + Math.random() * jitterMs);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [testMode]); // re-bind only when testMode toggles

  // Connectivity Cards Dynamics — paused in test mode
  useEffect(() => {
    if (testMode) return; // freeze when test mode is active
    const cardsInterval = setInterval(() => {
      setCards(prevCards => prevCards.map(card => {
        // Fluctuate latency slightly (-5 to +5 ms)
        let newLatency = card.latency + Math.floor(Math.random() * 11) - 5;
        newLatency = Math.max(5, newLatency); // Minimum 5ms latency

        // State transitions
        let newState = card.state;
        const rand = Math.random();
        
        if (card.state === 'Active' && rand > 0.95) newState = 'Warning';
        else if (card.state === 'Warning' && rand > 0.8) newState = 'Degraded';
        else if (card.state === 'Warning' && rand > 0.6) newState = 'Recovering';
        else if (card.state === 'Degraded' && rand > 0.7) newState = 'Recovering';
        else if (card.state === 'Recovering' && rand > 0.5) newState = 'Active';

        return { ...card, latency: newLatency, state: newState };
      }));
    }, 3000); // Every 3 seconds

    return () => clearInterval(cardsInterval);
  }, [testMode]); // re-bind only when testMode toggles

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 pb-20 font-sans">
      
      {/* ── LEFT COLUMN: Connectivity & Interoperability ── */}
      <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">
        
        {/* Data Pipeline Visualization */}
        <div className="vision-card glass-reflection p-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Link2 size={16} className="text-indigo-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Intelligence Data Pipeline</h3>
            <span className="ml-2 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest hidden sm:inline-block">
              Real-Time Flow
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
            <PipelineNode 
              icon={Database} title="Hospital Systems" subtitle="EHR / HIS / ERP"
              bgClass="bg-slate-50" borderClass="border-slate-200" colorClass="text-slate-400" glowClass="from-slate-200 to-transparent"
            />
            
            <AnimatedArrow delay={0} />

            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] relative overflow-hidden">
              {/* Internal glowing pulse for Integration layer */}
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }} 
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-400/10" 
              />
              <Server size={20} className="text-indigo-500 mx-auto mb-2 relative z-10" />
              <p className="text-xs font-bold text-indigo-900 relative z-10">Integration Layer</p>
              <p className="text-[9px] text-indigo-500 uppercase tracking-wider mt-1 relative z-10">FHIR / Telemetry</p>
            </div>

            <AnimatedArrow delay={0.75} />

            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center shadow-lg shadow-slate-900/10 relative overflow-hidden">
              <Zap size={20} className="text-amber-400 mx-auto mb-2 relative z-10" />
              <p className="text-xs font-bold text-white relative z-10">Intelligence Engine</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1 relative z-10">Predictive Models</p>
            </div>
          </div>
        </div>

        {/* Connectivity Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">System Connectivity Grid</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <ConnectivityCard key={card.id} data={card} index={i} />
            ))}
          </div>
        </div>

        {/* Interoperability Panel */}
        <div className="vision-card glass-reflection p-6 shrink-0 mt-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interoperability Standards</h3>
          <div className="flex flex-wrap gap-2.5">
            {INTEROPERABILITY_TAGS.map((tag, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Live Streams & Regional Signals ── */}
      <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">
        
        {/* Regional Signals */}
        <div className="vision-card glass-reflection p-6 shrink-0 relative overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-400/5 rounded-full blur-[60px] pointer-events-none" 
          />
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <Globe size={16} className="text-blue-500" />
            <h3 className="text-sm font-display font-bold text-slate-800">Regional Signals</h3>
            <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">{liveLabel}</span>
          </div>
          
          <div className="space-y-3 relative z-10">
            {regionalSignals.map((sig, i) => (
              <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sig.label}</span>
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={sig.status === 'warning' ? { opacity: [1, 0.4, 1] } : {}} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-1.5 h-1.5 rounded-full ${
                      sig.status === 'warning' ? 'bg-amber-500' : 
                      sig.status === 'info' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} 
                  />
                  <span className="text-xs font-semibold text-slate-800">{sig.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Event Stream */}
        <div className="vision-card glass-reflection p-6 flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-5 shrink-0">
            <Radio size={16} className="text-rose-500 animate-pulse" />
            <h3 className="text-sm font-display font-bold text-slate-800">Live Telemetry Stream</h3>
            <div className="ml-auto flex items-center gap-2">
              {testMode && (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <PauseCircle size={9} /> Frozen
                </span>
              )}
               <div className="flex gap-1">
               {/* Small animated equalizer bars */}
               {[1, 2, 3].map((bar) => (
                 <motion.div 
                   key={bar}
                   animate={{ height: ['4px', '12px', '4px'] }}
                   transition={{ duration: 1 + Math.random(), repeat: Infinity, delay: bar * 0.2 }}
                   className="w-1 bg-rose-400/50 rounded-full"
                 />
               ))}
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 overflow-x-hidden">
            <div className="space-y-4 relative">
              <AnimatePresence initial={false}>
                {events.map((evt, i) => (
                  <motion.div 
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                    className="flex items-start gap-3 relative"
                  >
                    {/* Timeline line */}
                    {i !== events.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-[-16px] w-px bg-slate-200" />
                    )}
                    
                    <div className="relative z-10 mt-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                        ${evt.type === 'success' ? 'bg-emerald-500' : 
                          evt.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                      />
                      {/* Pulse on newest event */}
                      {i === 0 && (
                        <span className="absolute -top-1 -left-1 flex h-5 w-5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40
                            ${evt.type === 'success' ? 'bg-emerald-400' : 
                              evt.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} 
                          />
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-mono">{evt.time}</p>
                      <p className="text-xs font-semibold text-slate-700 leading-snug">{evt.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default IntegrationHub;
