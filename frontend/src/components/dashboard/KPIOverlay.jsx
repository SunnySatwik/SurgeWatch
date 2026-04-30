import React from 'react';
import { motion } from 'motion/react';
import { Users, AlertTriangle, Target, Activity } from 'lucide-react';

const KPIOverlay = ({ data }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <KPICard 
        icon={Activity}
        label="Capacity Load"
        value={`${data.load}%`}
        color="text-cyan-400"
        bg="bg-cyan-500/10"
      />
      <KPICard 
        icon={AlertTriangle}
        label="Risk Level"
        value={data.risk}
        color={data.riskColor}
        bg="bg-white/5"
      />
      <KPICard 
        icon={Users}
        label="Exp. Patients"
        value={data.expectedPatients}
        color="text-white"
        bg="bg-white/5"
      />
      <KPICard 
        icon={Target}
        label="AI Confidence"
        value={`${data.confidence}%`}
        color="text-blue-400"
        bg="bg-blue-500/10"
      />
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, color, bg }) => (
  <motion.div 
    key={value}
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className={`${bg} border border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl`}
  >
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{label}</p>
      <Icon size={16} className={color} />
    </div>
    <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
  </motion.div>
);

export default KPIOverlay;
