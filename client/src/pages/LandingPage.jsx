import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  BrainCircuit,
  Database,
  BarChart3,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Compass,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="h-20 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              AirGuard
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                CSE494 Final Year
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/about')}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 transition hidden sm:inline"
          >
            Academic Foundation
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MongoDB & Machine Learning Environmental Risk Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Intelligent Air Quality Risk Classification & Environmental Analytics
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Powered by <strong className="text-emerald-400">24,850 ground-truth environmental observations</strong> across 
          26 Indian metropolitan centers, MongoDB aggregation pipelines, and a mathematically rigorous 
          <strong> Logistic Regression & Ensemble classification engine</strong>.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <Layers className="w-4 h-4" />
            <span>Open Interactive Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/predict')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition transform hover:-translate-y-0.5"
          >
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>Run Real-Time ML Inference</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition transform hover:-translate-y-0.5"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span>Geographical GIS Explorer</span>
          </button>
        </div>

        {/* Live Empirical Metrics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: 'Observations Ingested', val: '29,531 Raw', sub: '24,850 Verified' },
            { label: 'Active CPCB Stations', val: '33 Stations', sub: 'Indexed via 2dsphere' },
            { label: 'Primary Academic Model', val: 'Logistic Regression', sub: 'F1: 90.94% | AUC: 0.955' },
            { label: 'Champion Model', val: 'Gradient Boosting', sub: 'F1: 93.12% | Accuracy: 91.5%' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-left">
              <span className="text-xs text-slate-400 font-medium block">{stat.label}</span>
              <span className="text-lg font-bold text-white mt-1 block">{stat.val}</span>
              <span className="text-[11px] text-emerald-400 font-mono block mt-0.5">{stat.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 bg-[#0B0F19]/60 border-y border-white/10 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              System Architecture & Data Flow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              End-to-End Enterprise Data Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Data Collection & MongoDB',
                icon: Database,
                desc: 'Official CPCB atmospheric streams ingested into airguardDB with BSON nested pollutant objects and 2dsphere indexing.',
              },
              {
                step: '02',
                title: 'Data Science & Cleaning',
                icon: BarChart3,
                desc: 'Stratified (City, Month) median imputation, 99.5% winzorization, and atmospheric chemical ratio engineering.',
              },
              {
                step: '03',
                title: '70:30 Machine Learning',
                icon: BrainCircuit,
                desc: 'Mandatory 70:30 stratified partition, zero-leakage StandardScaler, Logistic Regression and comparative ensembles.',
              },
              {
                step: '04',
                title: 'REST API & Intelligence',
                icon: Activity,
                desc: 'Flask microservices serving real-time risk probabilities, feature contributions, and audit logging into prediction_results.',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative group hover:border-emerald-500/40 transition">
                  <div className="text-xs font-mono text-slate-400 mb-3">{card.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CPCB National Air Quality Index Framework Section */}
      <section className="py-16 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Scientific Framework
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            CPCB National Air Quality Index (NAQI) Breakpoints
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
            Binary risk target: AQI ≤ 100 defines Class 0 (Lower Risk), and AQI &gt; 100 defines Class 1 (Elevated Risk).
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">AQI Range</th>
                <th className="py-3.5 px-4">CPCB Category</th>
                <th className="py-3.5 px-4">AirGuard Risk Class</th>
                <th className="py-3.5 px-4">Associated Health Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">0 – 50</td>
                <td className="py-3 px-4 font-semibold text-white">Good</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">Class 0 (Lower Risk)</span></td>
                <td className="py-3 px-4">Minimal health impact.</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-emerald-300">51 – 100</td>
                <td className="py-3 px-4 font-semibold text-white">Satisfactory</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">Class 0 (Lower Risk)</span></td>
                <td className="py-3 px-4">Minor breathing discomfort to sensitive people.</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-amber-400">101 – 200</td>
                <td className="py-3 px-4 font-semibold text-white">Moderate</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[11px]">Class 1 (Elevated Risk)</span></td>
                <td className="py-3 px-4">Breathing discomfort with asthma, heart disease.</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-orange-400">201 – 300</td>
                <td className="py-3 px-4 font-semibold text-white">Poor</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono text-[11px]">Class 1 (Elevated Risk)</span></td>
                <td className="py-3 px-4">Breathing discomfort on prolonged exposure.</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-rose-400">301 – 400</td>
                <td className="py-3 px-4 font-semibold text-white">Very Poor</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[11px]">Class 1 (Elevated Risk)</span></td>
                <td className="py-3 px-4">Respiratory illness on prolonged exposure.</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-mono font-bold text-red-500">401 – 500+</td>
                <td className="py-3 px-4 font-semibold text-white">Severe</td>
                <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-[11px]">Class 1 (Elevated Risk)</span></td>
                <td className="py-3 px-4">Severe impacts on healthy people; serious for patients.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-xs text-slate-400">
        <p>AirGuard: B.Tech Computer Science & Engineering Final-Year Capstone Project</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Powered by MongoDB • Python • PyMongo • Scikit-Learn • Flask • React
        </p>
      </footer>
    </div>
  );
}
