import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl">
        <p className="text-white font-bold text-sm mb-1">{label}</p>
        <p className="text-cyan-400 font-bold text-xl">{payload[0].value}% <span className="text-slate-400 text-xs font-normal">Load</span></p>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2">Click to drill down</p>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ data, selectedIndex, onSelect }) => {
  const chartData = data.map((d, index) => ({
    name: d.day,
    load: d.load,
    index: index
  }));

  const handleClick = (state) => {
    if (state && state.activeTooltipIndex !== undefined) {
      onSelect(state.activeTooltipIndex);
    }
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onClick={handleClick}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="selectedGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            domain={[0, 100]}
            dx={-10}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
          />
          
          {/* Threshold Line */}
          <ReferenceLine 
            y={80} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            label={{ 
              position: 'right', 
              value: 'CRITICAL', 
              fill: '#ef4444', 
              fontSize: 10, 
              fontWeight: 'bold',
              letterSpacing: '0.1em'
            }} 
          />

          <Area
            type="monotone"
            dataKey="load"
            stroke="#06b6d4"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorLoad)"
            activeDot={{ 
              r: 8, 
              stroke: '#06b6d4', 
              strokeWidth: 4, 
              fill: '#fff' 
            }}
            animationDuration={1500}
          />

          {/* Highlight Selected Point */}
          {selectedIndex !== null && (
             <ReferenceLine 
                x={data[selectedIndex].day} 
                stroke="rgba(6, 182, 212, 0.4)" 
                strokeWidth={20}
                strokeOpacity={0.1}
             />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
