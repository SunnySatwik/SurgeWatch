import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Activity, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { deriveUnitDisposition } from '../../utils/unitDispositionEngine';

const statusConfig = {
  Extreme:  { dot: 'bg-red-600',    bar: 'bg-gradient-to-r from-red-400 to-red-600',    badge: 'bg-red-50 text-red-700 border-red-100',    icon: AlertTriangle,    iconColor: 'text-red-500' },
  Critical: { dot: 'bg-red-500',    bar: 'bg-gradient-to-r from-orange-400 to-red-500', badge: 'bg-orange-50 text-orange-700 border-orange-100', icon: AlertTriangle, iconColor: 'text-orange-500' },
  Warning:  { dot: 'bg-amber-400',  bar: 'bg-gradient-to-r from-amber-300 to-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-100',  icon: TrendingUp,  iconColor: 'text-amber-500' },
  Stable:   { dot: 'bg-emerald-500',bar: 'bg-gradient-to-r from-emerald-300 to-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2, iconColor: 'text-emerald-500' },
};

const DepartmentSection = ({ baseData }) => {
  // Memoized derivation: only recomputes when intelligence state changes
  const units = useMemo(() => deriveUnitDisposition(baseData), [
    baseData?.intelligence?.escalation,
    baseData?.intelligence?.conditions?.ambulanceFlow,
    baseData?.intelligence?.conditions?.isolationCapacity,
    baseData?.intelligence?.conditions?.erCongestion,
    baseData?.intelligence?.conditions?.respiratoryPressure,
    baseData?.intelligence?.conditions?.staffingStability,
    baseData?.metrics?.osi,
  ]);

  const criticalCount = units.filter(u => u.status === 'Critical' || u.status === 'Extreme').length;

  return (
    <div className="vision-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-display font-bold text-slate-800">Unit Disposition</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{units.length} Active Units</p>
            {criticalCount > 0 && (
              <>
                <span className="text-slate-200">·</span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-500">
                  {criticalCount} Under Pressure
                </p>
              </>
            )}
          </div>
        </div>
        <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all">
          All Units <ChevronRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {units.map((unit, i) => {
          const cfg = statusConfig[unit.status] ?? statusConfig.Stable;
          const StatusIcon = cfg.icon;
          return (
            <motion.div
              key={unit.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="group p-4 rounded-2xl bg-white/70 border border-white/80 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/8 transition-all cursor-default"
            >
              {/* Top: icon + badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <StatusIcon size={13} className={cfg.iconColor} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${cfg.badge}`}>
                  <div className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                  {unit.status}
                </div>
              </div>

              {/* Unit name */}
              <h4 className="text-sm font-display font-bold text-slate-800 mb-0.5 leading-tight">{unit.name}</h4>
              <p className="text-[9px] font-mono font-bold text-slate-400 mb-3">{unit.load}% occupancy</p>

              {/* Load bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${unit.load}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${cfg.bar}`}
                />
              </div>
              <div className="flex justify-between mt-1.5 mb-3">
                <span className="text-[8px] text-slate-300 font-bold">0%</span>
                <span className="text-[8px] text-slate-300 font-bold">100%</span>
              </div>

              {/* Operational subtitles */}
              {unit.subtitles && (
                <div className="space-y-1">
                  {unit.subtitles.map((line, j) => (
                    <p key={j} className="text-[8px] text-slate-400 font-medium leading-tight">{line}</p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {units.length === 0 && (
          <div className="col-span-5 py-10 text-center text-slate-300 text-sm italic">
            No unit data available.
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSection;
