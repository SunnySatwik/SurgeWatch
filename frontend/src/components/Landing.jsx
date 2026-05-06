import React, { useState, useEffect, useRef } from 'react';
import { Settings } from "lucide-react"
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Clock,
  Layers,
  Menu,
  ShieldCheck,
  TrendingUp,
  X,
  Plus,
  Zap,
  Search,
  Globe,
  Layout,
  Cloud
} from 'lucide-react';

// --- Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-8 py-4 rounded-2xl font-bold transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden";
  const variants = {
    white: "bg-white text-slate-900 shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.3)]",
    primary: "bg-blue-600 text-white shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:bg-blue-700",
    glass: "vision-glass-light text-slate-700 hover:bg-white/20",
    ghost: "text-slate-500 hover:text-slate-900 transition-colors"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </button>
  );
};

const SectionTag = ({ children }) => (
  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 vision-glass-light border-white/40 rounded-full w-fit mb-8 shadow-sm">
    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-600/80">{children}</span>
  </div>
);

const Navbar = ({ onLaunch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-4 px-6' : 'py-8 px-10'}`}>
      <div className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-700 ${isScrolled ? 'vision-glass px-8 py-4 rounded-[2rem] shadow-2xl' : ''}`}>
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-white shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Activity className="text-blue-600 w-5 h-5" />
          </div>
          <span className="text-2xl font-display font-bold text-slate-800 tracking-tight">
            SurgeWatch
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-sm font-bold text-slate-500">
          {['Intelligence', 'Operations', 'Global', 'Insights'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-blue-600 transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Button variant="ghost" className="px-6">Sign In</Button>
          <Button variant="primary" className="text-sm shadow-xl" onClick={onLaunch}>Launch Portal</Button>
        </div>

        <button className="lg:hidden p-3 vision-glass rounded-2xl text-slate-700" onClick={() => setMobileMenuOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 bg-white/40 z-[60] flex flex-col p-10"
          >
            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-3">
                <Activity className="text-blue-600" />
                <span className="text-2xl font-display font-bold text-slate-800">SurgeWatch</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-4 vision-glass rounded-[2rem] text-slate-700">
                <X size={28} />
              </button>
            </div>
            <div className="flex flex-col gap-10 text-4xl font-display font-bold text-slate-800 mb-auto">
              {['Intelligence', 'Operations', 'Global', 'Insights'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">{item}</a>
              ))}
            </div>
            <div className="flex flex-col gap-6">
              <Button variant="glass" className="w-full text-lg">Member Login</Button>
              <Button variant="primary" className="w-full text-lg" onClick={onLaunch}>Open Dashboard</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const DashboardPreview = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      className="relative group perspective-[2000px] cursor-default"
    >
      <motion.div
        animate={{
          rotateY: mousePos.x * 10,
          rotateX: mousePos.y * -10,
          z: 50
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="relative vision-glass rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] overflow-hidden border-white/50 aspect-[16/10] glass-reflection"
      >
        {/* Mock Interface Content */}
        <div className="absolute inset-0 p-12 flex gap-10">
          {/* Sidebar */}
          <div className="w-20 flex flex-col gap-8 items-center py-4 vision-glass-light rounded-[2rem] border-white/20">
            <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-lg flex items-center justify-center text-white"><Layout size={20} /></div>
            {[Search, Activity, Globe, Clock, Settings].map((Icon, i) => (
              <div key={i} className="text-slate-400 hover:text-blue-600 transition-colors"><Icon size={20} /></div>
            ))}
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-800">Health Command</h3>
                <p className="text-slate-400 text-sm font-medium">Real-time Surge Intelligence</p>
              </div>
              <div className="flex gap-4">
                <div className="vision-glass-light px-5 py-2 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Active</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 flex-1">
              <div className="col-span-2 vision-glass-light rounded-[2.5rem] p-8 border-white/20 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Predictive Flow</span>
                  <TrendingUp size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 flex items-end gap-3 pb-4">
                  {[40, 60, 45, 90, 70, 55, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/10 to-blue-600/30 rounded-full" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="flex-1 vision-glass-light rounded-[2rem] p-6 border-white/20">
                    <div className="w-2 h-10 bg-blue-600/20 rounded-full mb-4" />
                    <div className="w-20 h-2 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Elements */}
      <motion.div
        animate={{
          x: mousePos.x * 50,
          y: mousePos.y * 50,
          z: 100
        }}
        className="absolute -top-12 -right-12 w-64 p-8 vision-glass rounded-[2rem] shadow-3xl z-20 border-white/60"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600"><Zap size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surge Alert</p>
            <p className="text-sm font-bold text-slate-800">Peak @ 14:00</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Predicted capacity breach in ER Unit. Recommend staffing shift.</p>
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className="p-10 rounded-[2.5rem] vision-glass border-white/40 group transition-all duration-700 shadow-xl hover:shadow-2xl"
  >
    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="font-display font-bold text-slate-800 mb-4 text-2xl tracking-tight">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
  </motion.div>
);

// --- Main Page ---

const Landing = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-vision-bg text-slate-900 selection:bg-blue-500/30 font-sans relative overflow-x-hidden">

      {/* Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-glow glow-lavender w-[1200px] h-[1200px] top-[-300px] right-[-300px] opacity-40" />
        <div className="ambient-glow glow-blue w-[1000px] h-[1000px] bottom-[-200px] left-[-200px] opacity-30" />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              '--x': `${(Math.random() - 0.5) * 200}px`,
              '--y': `${(Math.random() - 0.5) * 200}px`,
              '--duration': `${Math.random() * 15 + 15}s`,
              opacity: Math.random() * 0.4 + 0.1
            }}
          />
        ))}
      </div>

      <Navbar onLaunch={onLaunch} />

      {/* Hero Section */}
      <header className="relative pt-48 pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-10 grid lg:grid-cols-12 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <SectionTag>Future of Spatial Healthcare</SectionTag>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-10 leading-[1] text-slate-800">
              Healthcare in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                high definition.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-12 leading-relaxed max-w-xl font-medium">
              A spatial intelligence platform designed to predict surges and optimize hospital flow with unprecedented clarity and precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Button variant="primary" className="px-12 py-6 text-xl shadow-3xl" onClick={onLaunch}>
                Enter Portal
                <ArrowRight size={24} className="group-hover:translate-x-1.5 transition-transform duration-500" />
              </Button>
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="w-14 h-14 vision-glass rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                  <Plus size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Explore Intelligence</p>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">Watch the Film</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </header>

      {/* Trust Section */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-10">
          <div className="vision-glass rounded-[3rem] p-16 grid grid-cols-2 md:grid-cols-4 gap-16 text-center border-white/50 shadow-2xl">
            {[
              { value: "94.8%", label: "Precision Rate" },
              { value: "120M+", label: "Data Signals" },
              { value: "7-Day", label: "Forecast Horizon" },
              { value: "45+", label: "Health Networks" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <p className="text-5xl font-display font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-500 tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="intelligence" className="py-40 relative z-10 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <SectionTag>Core Capabilities</SectionTag>
            <h2 className="text-5xl md:text-6xl font-display font-bold text-slate-800 tracking-tight mb-8 leading-tight">
              A command center for the modern enterprise.
            </h2>
            <p className="text-xl text-slate-500 font-medium">
              Designed with spatial computing principles, SurgeWatch brings depth and clarity to complex healthcare data streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={TrendingUp}
              title="Predictive Vision"
              description="7-day intelligent demand forecasting powered by our proprietary SurgePredict neural architecture."
            />
            <FeatureCard
              icon={BrainCircuit}
              title="Spatial Reasoning"
              description="Explainable AI attribution layers that reveal the 'why' behind every predicted surge event."
            />
            <FeatureCard
              icon={Layers}
              title="Unit Orchestration"
              description="Real-time unit-level intelligence to optimize staffing, beds, and specialized resources."
            />
            <FeatureCard
              icon={Cloud}
              title="Environmental Sync"
              description="Live integration with meteorological data and regional disease surveillance networks."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Governance"
              description="Bank-grade encryption and full HIPAA compliance built into the platform's DNA."
            />
            <FeatureCard
              icon={Globe}
              title="Global Signals"
              description="Aggregate intelligence from international health organizations for early pandemic detection."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="max-w-6xl mx-auto vision-card p-24 text-center relative overflow-hidden border-white/60 shadow-[0_50px_100px_rgba(0,0,0,0.1)]"
        >
          <div className="absolute top-0 right-0 p-20 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-20 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <SectionTag>Next Generation</SectionTag>
            <h2 className="text-6xl md:text-7xl font-display font-bold mb-10 tracking-tight text-slate-800 leading-[1.1]">
              Ready to redefine <br /> clinical intelligence?
            </h2>
            <p className="text-xl text-slate-500 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
              Experience the clarity of spatial demand forecasting. Join the world's most advanced health systems.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
              <Button variant="primary" className="px-16 py-7 text-2xl shadow-3xl" onClick={onLaunch}>
                Get Started
              </Button>
              <button className="text-slate-800 font-bold text-xl hover:text-blue-600 transition-colors flex items-center gap-3 group">
                Contact Strategy Team
                <ChevronRight className="group-hover:translate-x-1.5 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/40 vision-glass relative z-10">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-20">
            <div className="flex flex-col gap-6 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-blue-600">
                  <Activity size={20} />
                </div>
                <span className="font-display font-bold text-slate-800 tracking-tight text-2xl">SurgeWatch</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Empowering healthcare leaders with the industry's most advanced spatial intelligence platform.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
              <div className="flex flex-col gap-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</h5>
                <div className="flex flex-col gap-4 text-sm font-bold text-slate-600">
                  <a href="#" className="hover:text-blue-600">Forecasting</a>
                  <a href="#" className="hover:text-blue-600">Explainability</a>
                  <a href="#" className="hover:text-blue-600">Integrations</a>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company</h5>
                <div className="flex flex-col gap-4 text-sm font-bold text-slate-600">
                  <a href="#" className="hover:text-blue-600">Our Mission</a>
                  <a href="#" className="hover:text-blue-600">Security</a>
                  <a href="#" className="hover:text-blue-600">Ethics</a>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect</h5>
                <div className="flex flex-col gap-4 text-sm font-bold text-slate-600">
                  <a href="#" className="hover:text-blue-600">Twitter</a>
                  <a href="#" className="hover:text-blue-600">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-12 border-t border-black/5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 SurgeWatch Intelligence. All Rights Reserved.</p>
            <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-slate-800">Privacy</a>
              <a href="#" className="hover:text-slate-800">Operational Ethics</a>
              <a href="#" className="hover:text-slate-800">HIPAA Compliant</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
