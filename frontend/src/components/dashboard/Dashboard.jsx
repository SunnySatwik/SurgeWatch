import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Bell, 
  Calendar, 
  ChevronRight, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  TrendingUp,
  User,
  Zap,
  Cloud,
  Layers
} from 'lucide-react';
import { DASHBOARD_DATA } from '../../data/data';
import ForecastChart from './ForecastChart';
import KPIOverlay from './KPIOverlay';
import SHAPPanel from './SHAPPanel';
import Recommendations from './Recommendations';
import DepartmentSection from './DepartmentSection';

const Dashboard = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Default to Wednesday (Peak)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  const currentData = DASHBOARD_DATA?.[selectedDayIndex] ?? DASHBOARD_DATA?.[0] ?? {};

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen text-slate-900 selection:bg-blue-500/30 flex overflow-hidden font-sans relative perspective-[1000px] bg-vision-bg"
    >
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="ambient-glow glow-lavender w-[800px] h-[800px] top-[-200px] left-[-200px]" 
          style={{ transform: `translate(${mousePos.x * -50}px, ${mousePos.y * -50}px)` }}
        />
        <div 
          className="ambient-glow glow-blue w-[600px] h-[600px] bottom-[-100px] right-[-100px]" 
          style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }}
        />
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="floating-particle"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              '--x': `${(Math.random() - 0.5) * 100}px`,
              '--y': `${(Math.random() - 0.5) * 100}px`,
              '--duration': `${Math.random() * 10 + 10}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      {/* Floating Vertical Sidebar */}
      <aside className="w-20 md:w-72 m-6 mr-0 vision-glass rounded-[2.5rem] flex flex-col items-center md:items-start py-10 z-50 relative">
        <div className="px-8 mb-16 flex items-center gap-4 w-full justify-center md:justify-start">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-2xl flex items-center justify-center flex-shrink-0">
            <Activity className="text-blue-600 w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold text-slate-800 tracking-tight hidden md:block">SurgeWatch</span>
        </div>

        <nav className="flex-1 w-full px-4 space-y-3">
          <NavItem icon={LayoutDashboard} label="Insights" active />
          <NavItem icon={TrendingUp} label="Forecasting" />
          <NavItem icon={Layers} label="Operations" />
          <NavItem icon={Calendar} label="Resources" />
          <NavItem icon={Settings} label="Preferences" />
        </nav>

        <div className="p-6 w-full border-t border-black/5">
          <button 
            onClick={onBack}
            className="flex items-center gap-4 w-full px-5 py-4 text-slate-500 hover:text-slate-900 hover:bg-black/5 rounded-2xl transition-all"
          >
            <LogOut size={22} />
            <span className="font-semibold hidden md:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Spatial Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth flex flex-col z-10 p-6">
        {/* Top Floating Header */}
        <header className="vision-glass rounded-[2.5rem] px-8 py-5 flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Real-time Intelligence Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 vision-glass-light rounded-2xl">
              <Cloud className="text-blue-600 w-5 h-5" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">Partly Cloudy · 22°C</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Met-Signal Synced</span>
              </div>
            </div>

            <div className="w-px h-10 bg-black/5" />

            <div className="flex items-center gap-4">
              <button className="p-3 vision-glass-light rounded-2xl text-slate-500 hover:text-slate-900 transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
              </button>
              
              <div className="flex items-center gap-4 p-1.5 pr-5 vision-glass-light rounded-2xl hover:bg-black/5 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Dr. Sarah Jenkins</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chief Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Spatial Grid */}
        <div className="space-y-8 max-w-[1600px] mx-auto w-full pb-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* HERO PREDICTIVE LAYER */}
            <motion.div 
              style={{ 
                x: mousePos.x * 20, 
                y: mousePos.y * 20,
              }}
              className="lg:col-span-8 vision-card p-10 relative group glass-reflection min-w-0"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-display font-bold text-slate-800 mb-2">Predictive Patient Flow</h3>
                  <p className="text-slate-500 text-sm font-medium">7-Day Intelligent Capacity Projection</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 vision-glass-light rounded-xl text-xs font-bold text-slate-700 hover:bg-black/5 transition-all">7D View</button>
                  <button className="px-5 py-2.5 vision-glass-light rounded-xl text-xs font-bold text-slate-400 hover:text-slate-700 transition-all">30D View</button>
                </div>
              </div>

              <div className="h-[400px] w-full min-w-0">
                <ForecastChart 
                  data={DASHBOARD_DATA ?? []} 
                  selectedIndex={selectedDayIndex} 
                  onSelect={setSelectedDayIndex} 
                />
              </div>
            </motion.div>

            {/* KPI FLOATING WIDGETS */}
            <div className="lg:col-span-4 space-y-8 flex flex-col min-w-0">
              <KPIOverlay data={currentData} />
              
              <div className="flex-1 min-w-0">
                <SHAPPanel data={currentData} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* AI STRATEGY PANEL */}
            <div className="lg:col-span-4 min-w-0">
              <Recommendations actions={currentData?.recommendations ?? []} />
            </div>

            {/* UNIT DISPOSITION MAP */}
            <div className="lg:col-span-8 min-w-0">
              <DepartmentSection departments={currentData?.departments ?? []} />
            </div>
          </div>
        </div>

        {/* Today's Summary Floating Panel (Center Bottom) */}
        <AnimatePresence>
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-5 vision-glass rounded-3xl flex items-center gap-10 shadow-3xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Zap className="text-blue-600 w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surge Status</span>
                <span className="text-sm font-bold text-slate-800">Moderate Load Expected</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-black/5" />

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peak Confidence</span>
                <span className="text-sm font-bold text-slate-800">94.2%</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
              </div>
            </div>

            <button className="ml-4 px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20">
              Execute Protocols
            </button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false }) => (
  <button className={`flex items-center gap-4 w-full px-6 py-4 rounded-3xl transition-all group relative overflow-hidden ${active ? 'bg-blue-600/10 text-blue-600 shadow-[0_8px_16px_rgba(37,99,235,0.1)]' : 'text-slate-400 hover:text-slate-700 hover:bg-black/5'}`}>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="absolute left-2 top-2 bottom-2 w-1.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
      />
    )}
    <Icon size={22} className={`${active ? 'text-blue-600' : 'group-hover:text-slate-700'}`} />
    <span className="hidden md:block font-semibold tracking-tight">{label}</span>
  </button>
);

export default Dashboard;
