import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, Activity } from 'lucide-react';

const KPIOverlay = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <KPICard 
        icon={Activity} 
        label="Capacity Load" 
        value={`${data?.load ?? 0}%`} 
        trend="-2.4%" 
        status={(data?.load ?? 0) > 80 ? 'critical' : 'normal'}
        progress={data?.load ?? 0}
      />
      <div className="grid grid-cols-2 gap-6">
        <KPICard 
          icon={Users} 
          label="Exp. Patients" 
          value={data?.expectedPatients ?? 0} 
          trend="+12" 
          compact
        />
        <KPICard 
          icon={Target} 
          label="AI Confidence" 
          value={`${data?.confidence ?? 0}%`} 
          compact
        />
      </div>
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, trend, status, progress, compact = false }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -5 }}
      className={`vision-card p-6 relative overflow-hidden flex flex-col ${compact ? 'justify-between h-40' : 'h-48'}`}
    >
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Icon size={20} className="text-blue-600" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-display font-bold text-slate-800 tracking-tight">{value}</p>
      </div>

      {progress !== undefined && (
        <div className="absolute right-6 bottom-6 w-16 h-16 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
              className={`${status === 'critical' ? 'text-rose-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className={`w-2 h-2 rounded-full ${status === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
          </div>
        </div>
      )}

      {/* Ambient background glow for critical status */}
      {status === 'critical' && (
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />
      )}
    </motion.div>
  );
};

export default KPIOverlay;
