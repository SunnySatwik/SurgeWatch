import React from 'react';
import { motion } from 'motion/react';
import { Layout, Users, ChevronRight } from 'lucide-react';

const DepartmentSection = ({ departments = [] }) => {
  const departmentList = departments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-display font-bold text-slate-800">Unit Disposition</h3>
        <button className="text-blue-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
          View All Units <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departmentList.map((dept, i) => (
          <motion.div
            key={dept?.name ?? i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="vision-card p-6 flex flex-col group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 vision-glass-light rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Layout size={20} />
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                dept?.status === 'Critical' || dept?.status === 'Extreme' ? 'bg-rose-500/10 text-rose-600' : 
                dept?.status === 'High' ? 'bg-orange-500/10 text-orange-600' : 
                'bg-emerald-500/10 text-emerald-600'
              }`}>
                {dept?.status ?? 'Unknown'}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-display font-bold text-slate-800 mb-1">{dept?.name ?? 'Untitled Unit'}</h4>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dept?.load ?? 0}% Occupancy</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dept?.load ?? 0}%` }}
                  className={`h-full rounded-full ${
                    (dept?.load ?? 0) > 90 ? 'bg-rose-500' : 
                    (dept?.load ?? 0) > 75 ? 'bg-orange-500' : 
                    'bg-blue-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>Load Level</span>
                <span>{(dept?.load ?? 0) > 90 ? 'Critical' : 'Stable'}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {departmentList.length === 0 && (
          <div className="col-span-full vision-card p-12 text-center text-slate-400 italic">
            No active unit data available.
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSection;
