import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ArrowLeft, 
  Bell, 
  Calendar, 
  ChevronRight, 
  Info, 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { DASHBOARD_DATA } from '../../data/data';
import ForecastChart from './ForecastChart';
import KPIOverlay from './KPIOverlay';
import SHAPPanel from './SHAPPanel';
import Recommendations from './Recommendations';
import DepartmentSection from './DepartmentSection';

const Dashboard = ({ onBack }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Default to Wednesday (Peak)
  const currentData = DASHBOARD_DATA[selectedDayIndex];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 border-r border-white/5 flex flex-col items-center md:items-start py-8 transition-all duration-300">
        <div className="px-6 mb-12 flex items-center gap-3 w-full justify-center md:justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight hidden md:block">SurgeWatch</span>
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" active />
          <NavItem icon={TrendingUp} label="Forecasting" />
          <NavItem icon={Calendar} label="Staffing" />
          <NavItem icon={ShieldCheck} label="Compliance" />
          <NavItem icon={Settings} label="System" />
        </nav>

        <div className="p-4 w-full border-t border-white/5">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth bg-slate-950">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[150px] rounded-full pointer-events-none" />

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Main Command Center</h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-[10px] uppercase font-bold tracking-wider leading-none">Live Sync: Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-3 p-1.5 pr-3 hover:bg-white/5 rounded-full transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                <User size={16} className="text-slate-300" />
              </div>
              <span className="text-sm font-medium text-slate-300 hidden md:block">Dr. Sarah Jenkins</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20">
          {/* Welcome Alert */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">System Update Required</h4>
              <p className="text-slate-400 text-xs mt-1">High surge risk identified for next Wednesday (May 3rd). Staff allocation adjustments recommended.</p>
            </div>
            <button className="ml-auto text-blue-400 text-xs font-bold hover:underline">Review Actions</button>
          </motion.div>

          {/* Hero Forecast Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Forecast Card */}
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-8">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7-Day Horizon</span>
                    <Info size={12} className="text-slate-600" />
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-1">Patient Load Forecast</h3>
                  <p className="text-slate-400 text-sm">Interactive predictive model based on SurgePredict Engine v4.2</p>
                </div>

                <div className="h-[350px] w-full">
                  <ForecastChart 
                    data={DASHBOARD_DATA} 
                    selectedIndex={selectedDayIndex} 
                    onSelect={setSelectedDayIndex} 
                  />
                </div>
              </div>

              {/* Department Grid */}
              <DepartmentSection departments={currentData.departments} />
            </div>

            {/* Sidebar Stats Area */}
            <div className="lg:col-span-4 space-y-8">
              <KPIOverlay data={currentData} />
              <SHAPPanel data={currentData} />
              <Recommendations actions={currentData.recommendations} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false }) => (
  <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all group ${active ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    <Icon size={22} className={`${active ? 'text-slate-950' : 'group-hover:text-white'}`} />
    <span className="hidden md:block">{label}</span>
  </button>
);

export default Dashboard;
