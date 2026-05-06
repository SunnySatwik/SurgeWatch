import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, Bell, Calendar, ChevronRight, LayoutDashboard,
  Home, Settings, TrendingUp, User, Layers,
  AlertTriangle, ArrowUpRight, BarChart2, Sparkles
} from 'lucide-react';
import { DASHBOARD_DATA } from '../../data/data';
import ForecastChart from './ForecastChart';
import KPIOverlay from './KPIOverlay';
import SHAPPanel from './SHAPPanel';
import Recommendations from './Recommendations';
import DepartmentSection from './DepartmentSection';
import WeatherWidget from './WeatherWidget';

const DAYS = DASHBOARD_DATA.map((d, i) => ({ label: d.day, index: i }));

const riskConfig = {
  Critical: { badge: 'risk-badge-critical', glow: 'risk-critical', dot: 'bg-red-500' },
  High: { badge: 'risk-badge-high', glow: '', dot: 'bg-orange-400' },
  Moderate: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Medium: { badge: 'risk-badge-moderate', glow: '', dot: 'bg-amber-400' },
  Low: { badge: 'risk-badge-low', glow: '', dot: 'bg-emerald-500' },
};

const Dashboard = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const currentData = DASHBOARD_DATA?.[selectedDayIndex] ?? DASHBOARD_DATA?.[0] ?? {};
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
          <NavItem icon={LayoutDashboard} label="Insights" active />
          <NavItem icon={TrendingUp} label="Forecast" />
          <NavItem icon={BarChart2} label="Analytics" />
          <NavItem icon={Layers} label="Operations" />
          <NavItem icon={Calendar} label="Schedule" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* AI Status pill */}
        <div className="hidden md:flex px-5 mb-4 w-full">
          <div className="w-full px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 rounded-full bg-emerald-500 ping-slow" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Model Live</p>
              <p className="text-[9px] text-emerald-600 font-medium">v2.4 · 94.8% acc.</p>
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
              <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">Intelligence Hub</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Week 19 · May 2026</span>
                <span className="text-slate-200">·</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${risk.badge}`}>
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block mr-1">Select Day</span>
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
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-semibold text-slate-600 hidden sm:block">
              AI Confidence: <span className="text-indigo-600 font-bold font-mono">{currentData?.confidence ?? 0}%</span>
            </span>
          </div>
        </div>

        {/* ── Grid Content ── */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* Row 1: Chart + KPI + SHAP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0">

            {/* Forecast Chart Card */}
            <motion.div
              style={{ x: mousePos.x * 12, y: mousePos.y * 8 }}
              className={`lg:col-span-7 vision-card p-6 glass-reflection min-w-0 h-fit ${risk.glow}`}
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
              <div className="grid grid-cols-4 gap-3 mt-auto">
                <MicroStat label="Today's Load" value={`${currentData?.load ?? 0}%`} up />
                <MicroStat label="Patients" value={currentData?.expectedPatients ?? 0} up />
                <MicroStat label="Confidence" value={`${currentData?.confidence ?? 0}%`} neutral />
                <MicroStat label="Baseline Δ" value="+8.3%" up />
              </div>
            </motion.div>

            {/* KPI Column */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-5 min-w-0">
              <KPIOverlay data={currentData} />
              <SHAPPanel data={currentData} />
            </div>
          </div>

          {/* Row 2: Recommendations + Departments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
            <div className="lg:col-span-4 min-w-0">
              <Recommendations actions={currentData?.recommendations ?? []} riskLevel={currentData?.risk} />
            </div>
            <div className="lg:col-span-8 min-w-0">
              <DepartmentSection departments={currentData?.departments ?? []} />
            </div>
          </div>

        </div>
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
            <span className="text-xs font-mono font-bold text-indigo-600">{currentData?.confidence ?? 0}% model confidence</span>
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

const NavItem = ({ icon: Icon, label, active = false }) => (
  <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all group relative text-sm font-semibold
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
  <div className="vision-glass-light px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
    <span className="label-meta-sm">{label}</span>
    <div className="flex items-center gap-1.5">
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
