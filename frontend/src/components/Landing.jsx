import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  BarChart3, 
  BrainCircuit, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Layers, 
  Lock, 
  Menu, 
  ShieldCheck, 
  TrendingUp, 
  X,
  Plus
} from 'lucide-react';

// --- Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 group";
  const variants = {
    white: "bg-white text-slate-950 hover:bg-cyan-50 shadow-lg active:scale-95",
    primary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 active:scale-95",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95",
    ghost: "text-slate-400 hover:text-white transition-colors"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const SectionTag = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full w-fit mb-6">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
    </span>
    <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400">{children}</span>
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            SurgeWatch
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#product" className="hover:text-white transition-colors">Platform</a>
          <a href="#features" className="hover:text-white transition-colors">Solutions</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Insights</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="px-5 py-2.5">Login</Button>
          <Button variant="primary" className="px-5 py-2.5 text-sm" onClick={onLaunch}>Launch Dashboard</Button>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-navy-950 z-[60] flex flex-col p-8"
          >
            <div className="flex justify-end mb-12">
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 p-2 hover:bg-white/5 rounded-full">
                <X size={32} />
              </button>
            </div>
            <div className="flex flex-col gap-8 text-2xl font-medium text-white mb-auto">
              <a href="#product" onClick={() => setMobileMenuOpen(false)}>Product</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Methodology</a>
            </div>
            <div className="flex flex-col gap-4">
              <Button variant="secondary" className="w-full">Log In</Button>
              <Button variant="primary" className="w-full" onClick={onLaunch}>View Dashboard</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const DashboardPreview = () => (
  <div className="relative group">
    {/* Decorative glows from theme */}
    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
    
    <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden aspect-[16/10]">
      {/* Sidebar Mock */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-20 bg-white/5 border-r border-white/5 flex flex-col items-center py-6 gap-6">
        <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
          <Activity className="w-4 h-4 text-slate-950" />
        </div>
        {[Layers, BarChart3, Clock, Lock].map((Icon, i) => (
          <div key={i} className="p-2 text-white/30 hover:text-white/70 cursor-pointer">
            <Icon size={20} />
          </div>
        ))}
      </div>

      {/* Main Content Mock */}
      <div className="ml-16 md:ml-20 p-6 md:p-8 h-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-lg">Hospital Overview</h3>
            <p className="text-white/40 text-sm">System status: Normal operation</p>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-blue-400 text-xs font-semibold">LIVE UPDATES</span>
          </div>
        </div>

        {/* Charts Mock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
          {/* Main Prediction Chart */}
          <div className="md:col-span-2 bg-white/5 rounded-xl border border-white/5 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-white/60 text-xs font-medium">PREDICTED SURGE (DAYS 1-7)</span>
              <Calendar size={14} className="text-white/20" />
            </div>
            
            <div className="flex items-end justify-between h-40 gap-1 mt-auto">
              {[40, 55, 45, 80, 95, 75, 60].map((height, i) => (
                <div key={i} className="flex-grow flex flex-col items-center gap-2 group/bar">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-700 ${i === 4 ? 'bg-gradient-to-t from-red-500/80 to-red-400 animate-pulse' : 'bg-gradient-to-t from-blue-600/40 to-blue-400/60'}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-white/20">D{i+1}</span>
                  {i === 4 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap">
                      Peak Surge Predicted
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Side Info Cards */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 rounded-xl border border-white/5 p-4">
              <p className="text-white/40 text-[10px] mb-1">CURRENT LOAD</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">74%</span>
                <span className="text-green-400 text-[10px] mb-1 flex items-center">
                  <TrendingUp size={10} /> -2%
                </span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/5 p-4">
              <p className="text-white/40 text-[10px] mb-1">WAIT TIME AVG</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">42m</span>
                <span className="text-red-400 text-[10px] mb-1 flex items-center">
                  <TrendingUp size={10} className="rotate-180" /> +5m
                </span>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex-grow flex flex-col">
              <p className="text-blue-400 text-[10px] font-bold mb-2 tracking-widest uppercase">AI Insight</p>
              <p className="text-white/80 text-xs leading-relaxed">
                "Weather pattern shifts in North Sector likely to increase flu cases by 12% in the next 72 hours."
              </p>
              <div className="mt-auto pt-4 flex justify-between items-center bg-transparent border-t border-blue-400/10">
                <span className="text-blue-400/60 text-[10px]">98% Confidence</span>
                <ArrowRight size={12} className="text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl bg-white/5 border border-white/10 group transition-all duration-300 hover:bg-white/10"
  >
    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-white mb-2 text-xl tracking-tight">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

const Step = ({ number, title, description, icon: Icon }) => (
  <div className="relative pl-12 pb-12 last:pb-0">
    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-navy-900 border-2 border-blue-500 flex items-center justify-center z-10">
      <span className="text-white text-xs font-bold">{number}</span>
    </div>
    <div className="absolute left-4 top-8 w-[2px] bottom-0 bg-gradient-to-b from-blue-500 to-transparent last:hidden" />
    <div className="flex items-start gap-4">
      <div className="hidden lg:flex w-12 h-12 rounded-xl bg-white/5 items-center justify-center flex-shrink-0">
        <Icon className="text-white/20" size={24} />
      </div>
      <div>
        <h4 className="text-white font-semibold text-xl mb-2">{title}</h4>
        <p className="text-white/50 leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
  </div>
);

// --- Main Page ---

const Landing = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans theme-bg-gradient transition-all duration-700">
      <Navbar onLaunch={onLaunch} />

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients from theme */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-10 relative z-10 text-center lg:text-left grid lg:grid-cols-12 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <SectionTag>Predictive Demand Intelligence</SectionTag>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight mb-8 leading-[1.1] text-white">
              Forecast surges <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                before they land.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              SurgeWatch connects HMIS signals, weather patterns, and regional disease alerts to predict hospital demand 7 days out with explainable AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <Button variant="white" className="px-10 py-5 text-xl shadow-2xl hover:shadow-cyan-500/20" onClick={onLaunch}>
                Launch Dashboard
                <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex -space-x-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800" />
                   ))}
                </div>
                <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
                  Trusted by 45+ health networks
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            id="product"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-7 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <DashboardPreview />
            {/* Floating Insight Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute -bottom-6 -left-10 p-5 bg-slate-900/90 border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-w-[240px] hidden lg:block"
            >
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={14} className="text-cyan-400" />
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Explainable AI</p>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium italic">
                "Wait times likely to increase by 22% due to regional viral patterns identified in HMIS signals."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { value: "94%", label: "Model Accuracy" },
            { value: "3.2h", label: "Wait Time Savings" },
            { value: "7-Day", label: "Forecast Window" },
            { value: "XGBoost", label: "Prediction Engine" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <p className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-10 grid md:grid-cols-2 gap-24 items-center font-sans">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <SectionTag>Clinical Reality</SectionTag>
            <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight text-white leading-tight">
              Reactive care is <br /> inefficient and unsafe.
            </h2>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Load Blindsiding</h4>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">Hospitals only see surges as they arrive, leading to chaotic resource reallocation and patient dissatisfaction.</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity size={20} className="text-red-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Signal Silos</h4>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">Valuable demand signals from HMIS, disease clusters, and events exist in silos, never reaching operational leads.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-12 relative shadow-3xl"
          >
            <div className="absolute -top-12 -right-12 p-10 bg-cyan-500/10 blur-3xl rounded-full" />
            <SectionTag>The Solution</SectionTag>
            <h3 className="text-3xl font-bold mb-6 tracking-tight text-white italic">Explainable AI.</h3>
            <p className="text-slate-400 mb-8 leading-relaxed text-lg">
              SurgeWatch aggregates multi-modal data streams into a single predictive dashboard. By explaining the "why" behind every surge, we empower clinical leaders to act early.
            </p>
            <ul className="space-y-4 mb-10">
               {['Automated Staffing Projections', 'Bed Capacity Early Warning', 'Resource Optimization Logic'].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-slate-200 text-sm font-medium">
                    <ShieldCheck size={18} className="text-cyan-400" />
                    {item}
                 </li>
               ))}
            </ul>
            <Button variant="primary" className="px-8" onClick={onLaunch}>Explore Solutions</Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="relative z-10 px-10 pt-10 pb-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FeatureCard 
          icon={TrendingUp}
          title="Predictive Forecasting"
          description="High-fidelity load models utilizing XGBoost to predict patient volume with 94% precision."
        />
        <FeatureCard 
          icon={BrainCircuit}
          title="Explainable AI"
          description="SHAP-based reason codes for every forecasted surge, identifying specific external drivers."
        />
        <FeatureCard 
          icon={Activity}
          title="Signal Integration"
          description="Live connectors for HMIS, IDSP disease alerts, and regional weather forecast data."
        />
        <FeatureCard 
          icon={Layers}
          title="Dept Insights"
          description="Drill-down operational intelligence for ER, ICU, and surgical departments."
        />
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-10 bg-blue-500/10 blur-3xl rounded-full" />
              <div className="relative space-y-4">
                <Step 
                  number="01"
                  title="Data Ingestion"
                  icon={ShieldCheck}
                  description="Securely ingest real-time EHR data, weather, local event calendars, and historical patterns."
                />
                <Step 
                  number="02"
                  title="Engine Analysis"
                  icon={BrainCircuit}
                  description="Our SurgePredict neural network processes billions of data points to identify emerging trends."
                />
                <Step 
                  number="03"
                  title="Decision Support"
                  icon={Layers}
                  description="Staff receive actionable alerts with recommended capacity adjustments and staffing levels."
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <SectionTag>METHODOLOGY</SectionTag>
              <h2 className="text-4xl font-display font-bold mb-8 tracking-tight">Turn data into decision-ready intelligence.</h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                We believe AI should be a teammate, not a black box. SurgeWatch provides the transparency 
                required for medical professionals to trust and act on predictive insights.
              </p>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ShieldCheck className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white/90">HIPAA Compliant</h5>
                    <p className="text-white/40 text-xs">Bank-grade encryption at rest and in transit.</p>
                  </div>
                </div>
                <div className="text-sm text-white/50">
                  SurgeWatch integrates directly with Epic, Cerner, and Meditech systems with sub-minute latency.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-[4rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-16 md:p-24 text-center relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-sans font-bold mb-10 tracking-tight text-white leading-tight">
              Ready to eliminate the <br /> element of surprise?
            </h2>
            <p className="text-slate-400 text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Equip your facility with the industry's most advanced predictive demand platform. Request a pilot today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Button variant="primary" className="px-12 py-6 text-2xl" onClick={onLaunch}>
                View Dashboard (Demo)
              </Button>
              <button className="text-white font-bold text-lg hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                Contact Technical Sales
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
               <Activity size={18} />
            </div>
            <span className="font-bold text-white tracking-tight text-xl">SurgeWatch</span>
          </div>
          <div className="flex gap-10 text-slate-500 font-medium text-sm">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Operational Integrity</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">HMIS Integration</a>
          </div>
          <p className="text-slate-600 text-xs font-semibold tracking-wide uppercase">© 2026 SurgeWatch Intelligence Lab. Built for clinical excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
