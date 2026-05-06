import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, FileText, Activity, AlertTriangle, ArrowRight, ShieldAlert, HeartPulse, Shield, BarChart3, Square } from 'lucide-react';
import { generateBriefingData } from '../../utils/scenarioEngine';

const MODES = [
  { id: 'executive', label: 'Executive', icon: BarChart3 },
  { id: 'clinical', label: 'Clinical Ops', icon: HeartPulse },
  { id: 'emergency', label: 'Emergency Response', icon: ShieldAlert },
  { id: 'public', label: 'Public Health', icon: Shield },
];

const PROCESSING_STEPS = [
  "Aggregating scenario parameters...",
  "Correlating environmental and viral signals...",
  "Computing ICU and ER capacity bounds...",
  "Synthesizing operational directives..."
];

const ExecutiveBriefing = ({ scenario, simulatedData, onClose }) => {
  const [activeMode, setActiveMode] = useState('executive');
  const [processing, setProcessing] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!processing) return;
    const interval = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => setProcessing(false), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [processing]);

  const briefing = React.useMemo(() => generateBriefingData(simulatedData, scenario, activeMode), [simulatedData, scenario, activeMode]);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    const textToSpeak = `
      Executive Briefing. Mode: ${MODES.find(m => m.id === activeMode)?.label}.
      Summary. ${briefing.summary}
      Key Operational Risks. ${briefing.risks.join('. ')}
      Forecast Outlook. ${briefing.outlook}
      Recommended Actions. ${briefing.actions.join('. ')}
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-white/50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200/50 flex items-center justify-between shrink-0 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-800 tracking-tight">AI Executive Briefing</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Automated Intelligence Report</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!processing && (
              <button 
                onClick={handlePlay}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm
                  ${isPlaying ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
              >
                {isPlaying ? <Square size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
                {isPlaying ? 'Stop Audio' : 'Play Briefing'}
              </button>
            )}
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50/50">
          
          <AnimatePresence mode="wait">
            {processing ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-indigo-600"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-indigo-600" />
                  </div>
                </div>
                
                <div className="h-6 overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={stepIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-sm font-bold text-slate-600 tracking-wide"
                    >
                      {PROCESSING_STEPS[stepIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col md:flex-row"
              >
                {/* Sidebar Modes */}
                <div className="w-full md:w-64 border-r border-slate-200/50 p-6 flex flex-col gap-2 shrink-0 bg-white/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">Briefing Target</p>
                  {MODES.map((mode) => {
                    const isActive = activeMode === mode.id;
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all relative
                          ${isActive ? 'text-indigo-700 bg-white shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'}`}
                      >
                        {isActive && <motion.div layoutId="modeIndicator" className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />}
                        <Icon size={16} className={isActive ? 'text-indigo-600' : ''} />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Briefing Document */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  
                  {/* Summary */}
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-600 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Executive Summary
                    </h3>
                    <p className="text-lg font-serif font-medium text-slate-800 leading-relaxed">
                      {briefing.summary}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Risks */}
                    <section>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-4">Key Operational Risks</h3>
                      <ul className="space-y-3">
                        {briefing.risks.map((risk, i) => (
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            key={i} className="flex items-start gap-2.5"
                          >
                            <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-slate-700 leading-snug">{risk}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </section>

                    {/* Actions */}
                    <section>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-4">Recommended Directives</h3>
                      <ul className="space-y-3">
                        {briefing.actions.map((action, i) => (
                          <motion.li 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
                            key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/60 shadow-sm"
                          >
                            <ArrowRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm font-bold text-slate-700 leading-snug">{action}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Outlook */}
                  <section className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-700 mb-2">Forecast Outlook</h3>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{briefing.outlook}</p>
                  </section>

                  {/* Timeline Summary */}
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-4">Critical Event Timeline</h3>
                    <div className="flex flex-wrap gap-3">
                      {briefing.timeline.filter(t => t.alert).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100">
                          <span className="text-xs font-mono font-bold text-rose-600">{t.time}</span>
                          <span className="text-xs font-semibold text-rose-900 truncate max-w-[200px]">{t.text}</span>
                        </div>
                      ))}
                      {briefing.timeline.filter(t => t.alert).length === 0 && (
                        <div className="text-xs font-medium text-slate-500 italic">No critical temporal alerts projected.</div>
                      )}
                    </div>
                  </section>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ExecutiveBriefing;
