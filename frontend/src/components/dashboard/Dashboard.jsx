import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, Bell, Calendar, ChevronRight, LayoutDashboard,
  Home, Settings, TrendingUp, User, Beaker,
  AlertTriangle, ArrowUpRight, BarChart2, Sparkles
} from 'lucide-react';
import { DASHBOARD_DATA } from '../../data/data';
import ForecastChart from './ForecastChart';
import KPIOverlay from './KPIOverlay';
import SHAPPanel from './SHAPPanel';
import Recommendations from './Recommendations';
import DepartmentSection from './DepartmentSection';
import WeatherWidget from './WeatherWidget';
import ScenarioSimulator from './ScenarioSimulator';

const DAYS = DASHBOARD_DATA.map((d, i) => ({ label: d.day, index: i }));

const riskConfig = {
  Critical: { badge: 'risk-badge-critical', glow: 'risk-critical', dot: 'bg-red-500' },
  High: { badge: 'risk-badge-high', glow: '', dot: 'bg-orange-400' },
  Moderate: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Medium: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Low: { badge: 'risk-badge-low', glow: '', dot: 'bg-emerald-500' },
};

const getSimulatedData = (baseData, scenario) => {
  let d = JSON.parse(JSON.stringify(baseData));
  
  let loadDelta = 0;
  let patientDelta = 0;
  let confidenceDelta = 0;
  
  if (scenario.weather === 1) { loadDelta += 5; patientDelta += 12; }
  if (scenario.weather === 2) { loadDelta += 15; patientDelta += 35; }
  
  if (scenario.crowd === 1) { loadDelta += 3; patientDelta += 8; }
  if (scenario.crowd === 2) { loadDelta += 12; patientDelta += 25; }
  
  if (scenario.viral === 1) { loadDelta += 8; patientDelta += 20; }
  if (scenario.viral === 2) { loadDelta += 20; patientDelta += 50; }
  
  if (scenario.staffing === -1) { loadDelta += 8; confidenceDelta -= 15; } 
  if (scenario.staffing === 1) { loadDelta -= 10; confidenceDelta += 5; }
  
  if (scenario.traffic === 1) { loadDelta += 2; confidenceDelta -= 5; }
  
  d.load = Math.min(100, Math.max(0, d.load + loadDelta));
  d.expectedPatients += patientDelta;
  d.confidence = Math.min(99, Math.max(40, d.confidence + confidenceDelta));
  
  if (d.load > 90) d.risk = 'Critical';
  else if (d.load > 75) d.risk = 'High';
  else if (d.load > 60) d.risk = 'Moderate';
  else d.risk = 'Low';

  let newShap = [...(d.shap || [])];
  if (scenario.weather === 2) newShap.unshift({ factor: 'Severe Storm', value: 18, type: 'positive' });
  if (scenario.viral === 2) newShap.unshift({ factor: 'Viral Outbreak', value: 25, type: 'positive' });
  if (scenario.crowd === 2) newShap.splice(1, 0, { factor: 'Mass Gathering', value: 12, type: 'positive' });
  if (scenario.staffing === 1) newShap.push({ factor: 'Surge Staffing', value: -15, type: 'negative' });
  
  d.shap = newShap.slice(0, 5);

  let newRecs = [];
  if (scenario.weather === 2) newRecs.push("Divert non-critical ambulances to regional facilities due to storm conditions.");
  if (scenario.viral === 2) newRecs.push("Open secondary respiratory triage tent and issue N95 protocol.");
  if (scenario.staffing === -1) newRecs.push("Mandatory overtime activation: call in standby nursing pool immediately.");
  if (scenario.traffic === 1) newRecs.push("Anticipate delayed trauma arrivals. Prepare helicopter pad if ground transport is blocked.");
  
  if (newRecs.length > 0) d.recommendations = [...newRecs, ...(d.recommendations || [])].slice(0,4);

  return d;
};

const Dashboard = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('insights'); // 'insights' | 'simulator'
  const [scenario, setScenario] = useState({ weather: 0, crowd: 0, viral: 0, staffing: 0, traffic: 0 });
  const containerRef = useRef(null);

  const baseData = DASHBOARD_DATA?.[selectedDayIndex] ?? DASHBOARD_DATA?.[0] ?? {};
  
  const currentData = useMemo(() => {
    if (mode === 'simulator') {
      return getSimulatedData(baseData, scenario);
    }
    return baseData;
  }, [baseData, scenario, mode]);

  const risk = riskConfig[currentData?.risk] ?? riskConfig.Low;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen flex overflow-hidden font-sans relative bg-vision-bg"
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-glow glow-lavender w-[900px] h-[900px] -top-48 -left-48 opacity-60"
          style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px)` }} />
        <div className="ambient-glow glow-indigo w-[600px] h-[600px] bottom-0 right-0 opacity-40"
          style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }} />
        <div className="ambient-glow glow-peach w-[400px] h-[400px] top-1/2 left-1/2 opacity-20" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-[72px] md:w-64 m-4 mr-0 vision-glass rounded-[2rem] flex flex-col items-center md:items-start py-8 z-50 relative shrink-0">
        {/* Logo */}
        <button
          onClick={onBack}
          className="px-5 mb-10 flex items-center gap-3 w-full justify-center md:justify-start group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <Activity className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-display font-bold text-slate-800 tracking-tight hidden md:block">SurgeWatch</span>
        </button>

        <nav className="flex-1 w-full px-3 space-y-1.5">
          <NavItem icon={LayoutDashboard} label="Insights" active={mode === 'insights'} onClick={() => setMode('insights')} />
          <NavItem icon={Beaker} label="Scenario Lab" active={mode === 'simulator'} onClick={() => setMode('simulator')} />
          <NavItem icon={TrendingUp} label="Forecast" />
          <NavItem icon={BarChart2} label="Analytics" />
          <NavItem icon={Calendar} label="Schedule" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* AI Status pill */}
        <div className="hidden md:flex px-5 mb-4 w-full">
          <div className={`w-full px-4 py-3 rounded-2xl border flex items-center gap-3 transition-colors ${mode === 'simulator' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="relative w-2.5 h-2.5">
              <div className={`absolute inset-0 rounded-full animate-ping ${mode === 'simulator' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <div className={`w-2.5 h-2.5 rounded-full relative ${mode === 'simulator' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${mode === 'simulator' ? 'text-indigo-700' : 'text-emerald-700'}`}>
                {mode === 'simulator' ? 'Sim Engine' : 'Model Live'}
              </p>
              <p className={`text-[9px] font-medium ${mode === 'simulator' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                v2.4 · {currentData?.confidence}% acc.
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 w-full border-t border-black/5 pt-3">
          <button onClick={onBack}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-slate-800 hover:bg-black/5 rounded-2xl transition-all text-sm font-semibold group">
            <Home size={18} className="group-hover:text-blue-600 transition-colors" />
            <span className="hidden md:block">Back to Home</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 h-screen overflow-y-auto z-10 p-4 flex flex-col min-w-0">

        {/* ── Header ── */}
        <header className="vision-glass rounded-[2rem] px-6 py-4 flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">
                {mode === 'simulator' ? 'Interactive Scenario Lab' : 'Intelligence Hub'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week 19 · May 2026</span>
                <span className="text-slate-200">·</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${risk.badge} transition-colors`}>
                  {currentData?.risk ?? 'Low'} Risk Day
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WeatherWidget />

            <div className="w-px h-8 bg-slate-200/60" />

            <button className="p-2.5 vision-glass-light rounded-xl text-slate-500 hover:text-slate-800 transition-all relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
            </button>

            <div className="flex items-center gap-3 p-1.5 pr-4 vision-glass-light rounded-xl cursor-pointer hover:bg-black/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                <User size={15} className="text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-800">Dr. Sarah Jenkins</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Chief Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Day Selector ── */}
        <div className="flex items-center gap-2 mb-5 shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block mr-1">Select Baseline Day</span>
          <div className="flex gap-1.5 p-1.5 vision-glass rounded-2xl">
            {DAYS.map(({ label, index }) => {
              const dayData = DASHBOARD_DATA[index];
              const r = riskConfig[dayData?.risk] ?? riskConfig.Low;
              const isActive = selectedDayIndex === index;
              return (
                <button
                  key={label}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex flex-col items-center gap-0.5 ${isActive
                    ? 'bg-white text-slate-800 shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
                    }`}
                >
                  <span>{label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? r.dot : 'bg-slate-200'}`} />
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 vision-glass-light px-4 py-2 rounded-xl">
            <Sparkles size={14} className={mode === 'simulator' ? 'text-indigo-500' : 'text-emerald-500'} />
            <span className="text-xs font-semibold text-slate-600 hidden sm:block">
              {mode === 'simulator' ? 'Engine Conf:' : 'AI Confidence:'} <span className={`${mode === 'simulator' ? 'text-indigo-600' : 'text-emerald-600'} font-bold font-mono transition-colors`}>{currentData?.confidence ?? 0}%</span>
            </span>
          </div>
        </div>

        {/* ── Grid Content ── */}
        {mode === 'simulator' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start auto-rows-min min-w-0 pb-20">
             {/* LEFT COLUMN: Controls + Directives */}
             <div className="lg:col-span-5 flex flex-col gap-5 min-w-0 h-fit justify-start">
                <ScenarioSimulator scenario={scenario} setScenario={setScenario} />
                <div className="min-w-0 h-fit shrink-0">
                  <Recommendations actions={currentData?.recommendations ?? []} riskLevel={currentData?.risk} />
                </div>
             </div>

             {/* RIGHT COLUMN: Chart + KPIs + SHAP */}
             <div className="lg:col-span-7 flex flex-col gap-5 min-w-0 h-fit justify-start">
                <motion.div
                  style={{ x: mousePos.x * 6, y: mousePos.y * 4 }}
                  className={`vision-card p-6 glass-reflection min-w-0 h-fit shrink-0 flex flex-col transition-colors duration-500 ${risk.glow}`}
                >
                  {/* Chart header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulated Patient Flow</p>
                      <h2 className="text-2xl font-display font-bold text-slate-800">Forecast Impact</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${risk.badge}`}>
                        <AlertTriangle size={12} />
                        {currentData?.risk ?? 'Low'} Risk
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">Scenario Baseline: {currentData?.date}</p>
                    </div>
                  </div>

                  {/* Chart (We pass the array with the manipulated current day so the chart can spike for that day) */}
                  <div className="h-[280px] w-full min-w-0">
                    <ForecastChart
                      data={DASHBOARD_DATA.map((d, i) => i === selectedDayIndex ? currentData : d)}
                      selectedIndex={selectedDayIndex}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <MicroStat label="Today's Load" value={`${currentData?.load ?? 0}%`} up={currentData.load > baseData.load} neutral={currentData.load === baseData.load} />
                    <MicroStat label="Patients" value={currentData?.expectedPatients ?? 0} up={currentData.expectedPatients > baseData.expectedPatients} neutral={currentData.expectedPatients === baseData.expectedPatients} />
                    <MicroStat label="Confidence" value={`${currentData?.confidence ?? 0}%`} neutral />
                    <MicroStat label="Baseline Δ" value={`${currentData.load - baseData.load > 0 ? '+' : ''}${currentData.load - baseData.load}%`} up={currentData.load > baseData.load} neutral={currentData.load === baseData.load} />
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0 h-fit shrink-0">
                  <KPIOverlay data={currentData} />
                  <SHAPPanel data={currentData} />
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start auto-rows-min min-w-0 pb-20">
            {/* LEFT COLUMN: Forecast, Recommendations, Departments */}
            <div className="lg:col-span-7 flex flex-col gap-5 min-w-0 h-fit justify-start">
              
              {/* Forecast Chart Card */}
              <motion.div
                style={{ x: mousePos.x * 12, y: mousePos.y * 8 }}
                className={`vision-card p-6 glass-reflection min-w-0 h-fit shrink-0 flex flex-col ${risk.glow}`}
              >
                {/* Chart header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Predictive Patient Flow</p>
                    <h2 className="text-2xl font-display font-bold text-slate-800">7-Day Surge Forecast</h2>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${risk.badge}`}>
                      <AlertTriangle size={12} />
                      {currentData?.risk ?? 'Low'} Risk
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium">{currentData?.date}</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[320px] w-full min-w-0">
                  <ForecastChart
                    data={DASHBOARD_DATA ?? []}
                    selectedIndex={selectedDayIndex}
                  />
                </div>

                {/* Micro analytics strip */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <MicroStat label="Today's Load" value={`${currentData?.load ?? 0}%`} up />
                  <MicroStat label="Patients" value={currentData?.expectedPatients ?? 0} up />
                  <MicroStat label="Confidence" value={`${currentData?.confidence ?? 0}%`} neutral />
                  <MicroStat label="Baseline Δ" value="+8.3%" up />
                </div>
              </motion.div>

              {/* AI Directives */}
              <div className="min-w-0 h-fit shrink-0">
                <Recommendations actions={currentData?.recommendations ?? []} riskLevel={currentData?.risk} />
              </div>

              {/* Additional Analytics */}
              <div className="min-w-0 h-fit shrink-0">
                <DepartmentSection departments={currentData?.departments ?? []} />
              </div>
            </div>

            {/* RIGHT COLUMN: KPI Stack, SHAP */}
            <div className="lg:col-span-5 flex flex-col gap-5 min-w-0 h-fit justify-start">
              <div className="min-w-0 h-fit shrink-0">
                <KPIOverlay data={currentData} />
              </div>
              <div className="min-w-0 h-fit shrink-0">
                <SHAPPanel data={currentData} />
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ── Floating Status Bar ── */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="vision-glass px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${risk.dot} animate-pulse`} />
              <span className="text-xs font-bold text-slate-700">{currentData?.risk ?? 'Low'} Surge · {currentData?.date}</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <span className={`text-xs font-mono font-bold ${mode === 'simulator' ? 'text-indigo-600' : 'text-emerald-600'}`}>{currentData?.confidence ?? 0}% {mode === 'simulator' ? 'engine' : 'model'} confidence</span>
            <div className="w-px h-5 bg-slate-200" />
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              Run Protocols <ArrowUpRight size={12} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Sub-components ── */

const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all group relative text-sm font-semibold
    ${active
      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100/60'
      : 'text-slate-400 hover:text-slate-700 hover:bg-white/60'
    }`}>
    {active && <motion.div layoutId="activeNav" className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
    <Icon size={18} className={active ? 'text-blue-600 ml-2' : 'group-hover:text-slate-700'} />
    <span className="hidden md:block tracking-tight">{label}</span>
  </button>
);

const MicroStat = ({ label, value, up, neutral }) => (
  <div className="vision-glass-light px-3 py-2.5 rounded-xl flex flex-col gap-0.5 h-full justify-between">
    <span className="label-meta-sm">{label}</span>
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-sm font-mono font-bold text-slate-800">{value}</span>
      {!neutral && (
        <span className={`text-xs font-bold ${up ? 'text-rose-500' : 'text-emerald-500'}`}>
          {up ? '↑' : '↓'}
        </span>
      )}
    </div>
  </div>
);

export default Dashboard;
