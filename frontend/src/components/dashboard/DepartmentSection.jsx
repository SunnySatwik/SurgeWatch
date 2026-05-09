import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { deriveUnitDisposition } from '../../utils/unitDispositionEngine';

// Simplified — status dot + bar only; no badge overload
const statusStyle = {
  Extreme:  { dot: 'bg-red-600',    bar: 'bg-gradient-to-r from-red-500 to-red-600',       text: 'text-red-600' },
  Critical: { dot: 'bg-orange-500', bar: 'bg-gradient-to-r from-orange-400 to-red-500',    text: 'text-orange-600' },
  Warning:  { dot: 'bg-amber-400',  bar: 'bg-gradient-to-r from-amber-300 to-amber-500',   text: 'text-amber-600' },
  Stable:   { dot: 'bg-emerald-500',bar: 'bg-gradient-to-r from-emerald-300 to-emerald-500', text: 'text-emerald-600' },
};

const DepartmentSection = ({ baseData }) => {
  const units = useMemo(() => deriveUnitDisposition(baseData), [baseData]);

  const criticalCount = units.filter(u => u.status === 'Critical' || u.status === 'Extreme').length;

  return (
    <div className="vision-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-display font-bold text-slate-800">Unit Pressure</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {units.length} departments monitored
            {criticalCount > 0 && (
              <span className="text-orange-500 ml-1">· {criticalCount} under pressure</span>
            )}
          </p>
        </div>
      </div>

      {/* Pressure list — scannable row-based layout */}
      <div className="space-y-3">
        {units.map((unit, i) => {
          const s = statusStyle[unit.status] ?? statusStyle.Stable;
          return (
            <motion.div
              key={unit.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-3"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />

              {/* Department name */}
              <span className="text-xs font-semibold text-slate-700 w-24 shrink-0 truncate">
                {unit.name}
              </span>

              {/* Pressure bar */}
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${unit.load}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                  className={`h-full rounded-full ${s.bar}`}
                />
              </div>

              {/* Load pct */}
              <span className={`text-[10px] font-mono font-bold w-8 text-right shrink-0 ${s.text}`}>
                {unit.load}%
              </span>
            </motion.div>
          );
        })}

        {units.length === 0 && (
          <p className="text-center text-xs text-slate-300 py-4">No unit data available.</p>
        )}
      </div>
    </div>
  );
};

export default DepartmentSection;
