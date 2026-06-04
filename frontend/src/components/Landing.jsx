import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Activity, ArrowRight, BrainCircuit, ChevronRight, Cloud,
  Globe, Layers, Menu, ShieldCheck, TrendingUp, X, Zap,
  BarChart2, Search, Layout, Settings, Clock, Sparkles
} from 'lucide-react';

/* ─── Shared primitives ──────────────────────────────────────────── */

const Pill = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 vision-glass-light rounded-full border-white/60 w-fit mb-6">
    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-600/90">{children}</span>
  </div>
);

const PrimaryBtn = ({ children, onClick, className = '' }) => {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 350, damping: 22 });
  const sy = useSpring(my, { stiffness: 350, damping: 22 });
  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={e => {
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left - r.width / 2) * 0.22);
        my.set((e.clientY - r.top - r.height / 2) * 0.22);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ x: sx, y: sy, background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
      whileHover={{ scale: 1.05, boxShadow: '0 20px 50px -8px rgba(37,99,235,0.52), 0 6px 18px -4px rgba(79,70,229,0.32)' }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className={`relative px-8 py-4 rounded-2xl font-bold text-sm text-white overflow-hidden group cta-idle-pulse ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

const GhostBtn = ({ children, onClick }) => (
  <button onClick={onClick}
    className="px-6 py-4 rounded-2xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-black/5 transition-all duration-300 flex items-center gap-2">
    {children}
  </button>
);

/* ─── Navbar ────────────────────────────────────────────────────── */

const Navbar = ({ onLaunch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 px-6' : 'py-6 px-8'}`}>
      <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 ${scrolled ? 'vision-glass px-6 py-3 rounded-[1.5rem] shadow-xl shadow-slate-900/5' : ''}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-display font-bold text-slate-800 tracking-tight">SurgeWatch</span>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
          {['Platform', 'Intelligence', 'Enterprise', 'Research'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="hover:text-slate-900 transition-colors relative group">
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-indigo-500 transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <GhostBtn>Sign In</GhostBtn>
          <PrimaryBtn onClick={onLaunch}>Launch Portal</PrimaryBtn>
        </div>

        <button className="lg:hidden p-2.5 vision-glass rounded-xl text-slate-700" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 backdrop-blur-2xl z-[60] flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  <Activity className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-display font-bold text-slate-800">SurgeWatch</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2.5 rounded-xl bg-slate-100 text-slate-700"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-6 text-3xl font-display font-bold text-slate-800 mb-auto">
              {['Platform', 'Intelligence', 'Enterprise', 'Research'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                  className="hover:text-indigo-600 transition-colors">{item}</a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryBtn onClick={onLaunch} className="w-full justify-center text-base">Open Dashboard</PrimaryBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

/* ─── Dashboard Preview (3-D glass mockup) ─────────────────────── */

const DashboardPreview = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smx = useSpring(mouseX, { stiffness: 70, damping: 20 });
  const smy = useSpring(mouseY, { stiffness: 70, damping: 20 });
  const rotateY = useTransform(smx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(smy, [-0.5, 0.5], [5, -5]);
  const cardX  = useTransform(smx, [-0.5, 0.5], [-22, 22]);
  const cardY  = useTransform(smy, [-0.5, 0.5], [-16, 16]);
  const [bars, setBars] = useState([40, 62, 48, 88, 72, 55, 65]);
  useEffect(() => {
    const id = setInterval(() => {
      setBars(p => p.map(v => Math.max(22, Math.min(93, v + (Math.random() - 0.5) * 11))));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - r.left) / r.width - 0.5);
        mouseY.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="relative perspective-[1800px]"
    >
      <motion.div
        style={{ rotateY, rotateX }}
        className="vision-glass rounded-[2.5rem] overflow-hidden border-white/70 shadow-[0_40px_80px_rgba(15,23,42,0.12)] glass-reflection relative"
      >
        {/* Live scan sweep */}
        <motion.div
          initial={{ top: 0, opacity: 0 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 0.55, 0] }}
          transition={{ duration: 4, delay: 1.2, repeat: Infinity, repeatDelay: 7, ease: 'linear' }}
          className="absolute left-0 right-0 h-px z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.28), rgba(99,102,241,0.42), rgba(37,99,235,0.28), transparent)' }}
        />
        <div className="p-8 flex gap-6" style={{ aspectRatio: '16/10' }}>
          {/* Sidebar */}
          <div className="w-14 flex flex-col gap-5 items-center pt-2">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 280, damping: 20 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md"
            >
              <Layout size={16} className="text-white" />
            </motion.div>
            {[Search, BarChart2, Globe, Clock, Settings].map((Icon, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.07, duration: 0.38, ease: [0.22,1,0.36,1] }}
                className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-slate-400"
              >
                <Icon size={14} />
              </motion.div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.45, ease: [0.22,1,0.36,1] }}
              className="flex items-center justify-between"
            >
              <div>
                <h3 className="text-base font-display font-bold text-slate-800">Intelligence Hub</h3>
                <p className="text-slate-400 text-xs font-medium">Live · Week 19</p>
              </div>
              <div className="flex items-center gap-2 vision-glass-light px-3 py-1.5 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Model Active</span>
              </div>
            </motion.div>
            <div className="grid grid-cols-3 gap-4 flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className="col-span-2 vision-glass-light rounded-[1.5rem] p-5 flex flex-col border-white/50 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Predictive Flow</span>
                  <TrendingUp size={13} className="text-blue-600" />
                </div>
                <div className="flex-1 flex items-end gap-1.5 pb-2">
                  {bars.map((h, i) => (
                    <motion.div key={i}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ delay: 0.95 + i * 0.07, duration: 0.55, ease: [0.22,1,0.36,1] }}
                      className="flex-1 rounded-sm live-bar"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, rgba(37,99,235,0.65), rgba(79,70,229,0.22))`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <span key={i} className="text-[7px] text-slate-400 font-bold flex-1 text-center">{d}</span>
                  ))}
                </div>
              </motion.div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Load', value: '85%', color: 'text-rose-600' },
                  { label: 'Patients', value: '194', color: 'text-slate-800' },
                ].map((card, ci) => (
                  <motion.div key={card.label}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.85 + ci * 0.13, duration: 0.45, ease: [0.22,1,0.36,1] }}
                    className="flex-1 vision-glass-light rounded-[1.25rem] p-4 border-white/50"
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
                    <p className={`text-xl font-mono font-bold kpi-shimmer ${card.color}`}>{card.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating alert chip — drifts + mouse parallax */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 180, damping: 18 }}
        style={{ x: cardX, y: cardY }}
        className="absolute -top-8 -right-8 vision-glass px-5 py-4 rounded-2xl shadow-2xl shadow-slate-900/10 border-white/80 z-20"
        whileHover={{ scale: 1.04 }}
        whileInView={{}}
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="p-2 rounded-lg bg-rose-50"
          >
            <Zap size={14} className="text-rose-600" />
          </motion.div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Surge Alert</p>
            <p className="text-sm font-bold text-slate-800">Peak @ 14:00</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">ER critical. Recommend Phase II protocol.</p>
      </motion.div>
    </div>
  );
};

/* ─── Feature Card ──────────────────────────────────────────────── */

const FeatureCard = ({ icon: Icon, title, description, accent = 'indigo' }) => {
  const accents = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    blue:   'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    teal:   'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    rose:   'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    emerald:'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  };
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="group p-7 rounded-[2rem] vision-glass border-white/70 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/8 transition-all duration-500">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 shadow-sm ${accents[accent]}`}>
        <Icon size={22} />
      </div>
      <h3 className="font-display font-bold text-slate-800 text-xl mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
};

/* ─── Main Landing ──────────────────────────────────────────────── */

const Landing = ({ onLaunch }) => (
  <div className="min-h-screen bg-vision-bg text-slate-900 font-sans relative overflow-x-hidden selection:bg-indigo-200/60">

    {/* ── Cinematic Ambient Layer ── */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Faint operational grid */}
      <div className="hero-grid absolute inset-0" />
      {/* Independently drifting light orbs */}
      <div className="hero-orb-a absolute w-[920px] h-[920px] -top-72 -right-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.32), rgba(196,181,253,0.12))', filter: 'blur(90px)' }} />
      <div className="hero-orb-b absolute w-[720px] h-[720px] top-1/3 -left-52 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.26), rgba(67,56,202,0.10))', filter: 'blur(80px)' }} />
      <div className="hero-orb-c absolute w-[520px] h-[520px] bottom-0 right-1/4 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(251,207,232,0.30), rgba(253,186,116,0.10))', filter: 'blur(70px)' }} />
      {/* Intelligence heartbeat core */}
      <div className="intel-heartbeat absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.09), transparent 65%)' }} />
      {/* Operational scan lines texture */}
      <div className="scan-lines inset-0" />
      {/* Moving scan sweeps */}
      <div className="scan-sweep" />
      <div className="scan-sweep scan-sweep-2" />
      {/* Ambient drifting particles */}
      {[
        { w:6, h:6, top:'12%', left:'8%',  dur:'22s', delay:'0s',   px:'25px', py:'-35px', op:0.10 },
        { w:4, h:4, top:'30%', left:'18%', dur:'28s', delay:'-8s',  px:'-20px',py:'30px',  op:0.08 },
        { w:5, h:5, top:'55%', left:'5%',  dur:'32s', delay:'-14s', px:'30px', py:'-20px', op:0.09 },
        { w:3, h:3, top:'75%', left:'22%', dur:'24s', delay:'-4s',  px:'-15px',py:'-25px', op:0.07 },
        { w:6, h:6, top:'15%', left:'88%', dur:'26s', delay:'-10s', px:'-30px',py:'20px',  op:0.10 },
        { w:4, h:4, top:'40%', left:'92%', dur:'30s', delay:'-18s', px:'20px', py:'-30px', op:0.08 },
        { w:5, h:5, top:'68%', left:'82%', dur:'20s', delay:'-6s',  px:'-25px',py:'15px',  op:0.09 },
        { w:3, h:3, top:'85%', left:'70%', dur:'34s', delay:'-22s', px:'15px', py:'-20px', op:0.06 },
      ].map((p, i) => (
        <div key={i} className="ambient-particle" style={{
          width: p.w, height: p.h, top: p.top, left: p.left,
          '--dur': p.dur, '--delay': p.delay, '--px': p.px, '--py': p.py, '--p-opacity': p.op,
          background: i % 2 === 0 ? 'rgba(99,102,241,0.18)' : 'rgba(37,99,235,0.15)',
        }} />
      ))}
      {/* Signal mote trails — slow upward drift, fade in/out */}
      {[
        { s:3, top:'82%', left:'14%', dur:'9s',  delay:'0s',   x:'12px',  y:'-70px',  op:0.13, c:'rgba(99,102,241,0.5)' },
        { s:2, top:'70%', left:'35%', dur:'11s', delay:'-3s',  x:'-8px',  y:'-55px',  op:0.10, c:'rgba(37,99,235,0.5)'  },
        { s:3, top:'78%', left:'60%', dur:'8s',  delay:'-6s',  x:'10px',  y:'-65px',  op:0.12, c:'rgba(99,102,241,0.5)' },
        { s:2, top:'88%', left:'80%', dur:'13s', delay:'-2s',  x:'-12px', y:'-80px',  op:0.09, c:'rgba(37,99,235,0.5)'  },
        { s:2, top:'75%', left:'48%', dur:'10s', delay:'-8s',  x:'6px',   y:'-60px',  op:0.11, c:'rgba(79,70,229,0.5)'  },
      ].map((m, i) => (
        <div key={i} className="signal-mote" style={{
          width: m.s, height: m.s, top: m.top, left: m.left,
          '--mote-dur': m.dur, '--mote-delay': m.delay,
          '--mote-x': m.x, '--mote-y': m.y, '--mote-op': m.op,
          background: m.c,
          boxShadow: `0 0 4px ${m.c}`,
        }} />
      ))}
    </div>

    <Navbar onLaunch={onLaunch} />

    {/* ── HERO ── */}
    <section className="relative pt-28 pb-16 z-10">
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Pill>Series A Intelligence Platform</Pill>
          <h1 className="text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-[1.0] text-slate-900 mb-6 title-glow-breathe">
            Hospital intelligence,{' '}
            <span className="text-gradient-cobalt italic">redefined.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg font-medium">
            SurgeWatch predicts patient surges 7 days ahead with 94.8% accuracy — giving clinical leaders the time to act before capacity becomes a crisis.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <PrimaryBtn onClick={onLaunch} className="text-base px-10 py-5 shadow-2xl shadow-blue-600/20">
              Open Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </PrimaryBtn>
            <GhostBtn>
              Watch Demo <ChevronRight size={16} />
            </GhostBtn>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-slate-200/60">
            {[
              { value: '94.8%', label: 'Forecast Accuracy' },
              { value: '7-Day', label: 'Horizon' },
              { value: '45+', label: 'Health Networks' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-mono font-bold text-slate-800">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3D preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>

    {/* ── STATS BAR ── */}
    <section className="py-10 z-10 relative">
      <div className="max-w-7xl mx-auto px-8">
        <div className="vision-glass rounded-[2rem] px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 border-white/70 shadow-xl shadow-slate-900/5">
          {[
            { value: '94.8%', label: 'Forecast Precision', sub: 'vs. 71% industry avg' },
            { value: '120M+', label: 'Data Signals Processed', sub: 'per prediction cycle' },
            { value: '<2min', label: 'Alert Latency',        sub: 'real-time ingestion' },
            { value: '45+',  label: 'Health Networks',       sub: 'across 12 countries' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-4xl font-mono font-bold text-slate-800 mb-1">{s.value}</p>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400 font-medium">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── FEATURES ── */}
    <section id="intelligence" className="py-16 relative z-10 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Pill>Core Capabilities</Pill>
          <h2 className="text-5xl font-display font-bold text-slate-800 tracking-tight mb-5 leading-tight">
            Built for the modern health enterprise.
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            Every feature is designed around operational clarity, not data complexity.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard accent="blue"    icon={TrendingUp}  title="Predictive Vision"    description="7-day intelligent demand forecasting powered by our proprietary SurgePredict neural architecture trained on 120M+ clinical signals." />
          <FeatureCard accent="indigo"  icon={BrainCircuit} title="SHAP Explainability"  description="Real-time SHAP attribution reveals the 'why' behind every forecast — turning black-box AI into actionable clinical intelligence." />
          <FeatureCard accent="teal"    icon={Layers}       title="Unit Orchestration"    description="Department-level intelligence to optimize staffing, beds, and specialized resources before surge events materialize." />
          <FeatureCard accent="violet"  icon={Cloud}        title="Environmental Sync"    description="Live meteorological and disease surveillance integration from IDSP, Met Office, and regional health networks." />
          <FeatureCard accent="emerald" icon={ShieldCheck}  title="HIPAA Compliance"      description="Bank-grade encryption, audit trails, and role-based access control built into the platform's core infrastructure." />
          <FeatureCard accent="rose"    icon={Globe}        title="Global Signals"         description="Aggregate intelligence from WHO, CDC, and international health organizations for early pandemic and outbreak detection." />
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="py-16 px-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.9 }}
          className="vision-card p-16 text-center relative overflow-hidden border-white/80"
          style={{ boxShadow: '0 20px 60px rgba(37, 99, 235, 0.08), 0 4px 16px rgba(15, 23, 42, 0.06)' }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-indigo-500/8 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-blue-500/8 blur-[60px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Pill>Get Started Today</Pill>
            <h2 className="text-5xl font-display font-bold text-slate-800 mb-5 tracking-tight leading-tight">
              Ready to see SurgeWatch in action?
            </h2>
            <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
              Join the world's most advanced health systems using spatial intelligence to prevent capacity crises before they happen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PrimaryBtn onClick={onLaunch} className="px-12 py-5 text-base shadow-2xl shadow-blue-600/20">
                Launch Platform <ArrowRight size={18} />
              </PrimaryBtn>
              <GhostBtn>Contact Enterprise Team <ChevronRight size={16} /></GhostBtn>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ── FOOTER ── */}
    <footer className="py-12 border-t border-slate-200/60 relative z-10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Activity size={16} className="text-white" />
              </div>
              <span className="text-lg font-display font-bold text-slate-800">SurgeWatch</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Empowering clinical leaders with the world's most advanced spatial intelligence platform for healthcare operations.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-12">
            {[
              { title: 'Platform', links: ['Forecasting', 'Explainability', 'Integrations', 'API'] },
              { title: 'Company',  links: ['Mission', 'Security', 'Ethics', 'Careers'] },
              { title: 'Connect',  links: ['Twitter', 'LinkedIn', 'GitHub', 'Status'] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{col.title}</h5>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => (
                    <a key={l} href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200/40">
          <p className="text-xs text-slate-400 font-medium">© 2026 SurgeWatch Intelligence. All Rights Reserved.</p>
          <div className="flex gap-6 text-xs font-medium text-slate-400">
            <a href="#" className="hover:text-slate-800">Privacy Policy</a>
            <a href="#" className="hover:text-slate-800">Terms of Service</a>
            <a href="#" className="hover:text-slate-800">HIPAA Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;
