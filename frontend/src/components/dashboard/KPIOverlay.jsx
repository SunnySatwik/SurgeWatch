import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Users, Target, Activity, Zap } from 'lucide-react';

const SPARKLINE = [55, 62, 58, 70, 65, 72, 68, 75];

const KPIOverlay = ({ data }) => {
  const load = data?.load ?? 0;
  const patients = data?.expectedPatients ?? 0;
  const confidence = data?.confidence ?? 0;
  const risk = data?.risk ?? 'Low';

  const loadColor = load > 85 ? '#ef4444' : load > 70 ? '#f97316' : '#2563eb';
  const circumference = 2 * Math.PI * 26;
  const offset = circumference * (1 - load / 100);

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* Load Gauge */}
      <motion.div whileHover={{ y: -3 }} className="vision-card p-5 col-span-2 flex items-center gap-5 glass-reflection">
        {/* SVG Ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <motion.circle
              cx="30" cy="30" r="26" fill="none"
              stroke={loadColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-mono font-bold" style={{ color: loadColor }}>{load}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity Load</p>
          <p className="text-3xl font-mono font-bold text-slate-800 tracking-tight mb-2">{load}%</p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trend</span>
            <div className="flex items-end gap-0.5 h-5">
              {SPARKLINE.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-sm sparkline-bar"
                  style={{
                    height: `${(h / Math.max(...SPARKLINE)) * 100}%`,
                    background: loadColor,
                    opacity: 0.4 + (i / SPARKLINE.length) * 0.6,
                    animationDelay: `${i * 80}ms`
                  }}
                />
              ))}
            </div>
            <span className={`text-[9px] font-bold ${load > 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {load > 75 ? '+2.4%' : '-1.2%'}
            </span>
          </div>
        </div>

        {load > 80 && (
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        )}
      </motion.div>

      {/* Patients */}
      <motion.div whileHover={{ y: -3 }} className="vision-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users size={15} className="text-indigo-600" />
          </div>
          <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">+12 est.</span>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Exp. Patients</p>
        <motion.p
          key={patients}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-mono font-bold text-slate-800"
        >{patients}</motion.p>
        <p className="text-[9px] text-slate-400 font-medium mt-1">Forecasted admissions</p>
      </motion.div>

      {/* Confidence */}
      <motion.div whileHover={{ y: -3 }} className="vision-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Target size={15} className="text-emerald-600" />
          </div>
          <TrendingUp size={14} className="text-emerald-500" />
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Confidence</p>
        <motion.p
          key={confidence}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-mono font-bold text-slate-800"
        >{confidence}%</motion.p>
        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
      </motion.div>

    </div>
  );
};

export default KPIOverlay;
