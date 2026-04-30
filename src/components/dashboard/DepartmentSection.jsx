import React from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';

const DepartmentSection = ({ departments }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {departments.map((dept, index) => (
        <motion.div 
          key={dept.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-white tracking-tight">{dept.name}</h4>
            <MoreHorizontal size={16} className="text-slate-600 group-hover:text-slate-400 cursor-pointer" />
          </div>

          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-white">{dept.load}%</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${dept.status === 'Critical' || dept.status === 'Extreme' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              {dept.status}
            </span>
          </div>

          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dept.load}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${dept.color}`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DepartmentSection;
