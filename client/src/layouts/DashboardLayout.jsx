import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Activity,
  MapPin,
  Database,
  BarChart3,
  BrainCircuit,
  FlaskConical,
  Sliders,
  Clock,
  BookOpen,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Wifi
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
  { path: '/monitoring', label: 'Pollution Monitor', icon: Activity },
  { path: '/map', label: 'Geographical Explorer', icon: MapPin, badge: 'GIS' },
  { path: '/dataset', label: 'Dataset Explorer', icon: Database, count: '24.8k' },
  { path: '/analytics', label: 'Pollution Analytics', icon: BarChart3 },
  { path: '/predict', label: 'Risk Prediction', icon: BrainCircuit, highlight: true },
  { path: '/ml-lab', label: 'ML Laboratory', icon: FlaskConical },
  { path: '/evaluation', label: 'Model Evaluation', icon: Sliders },
  { path: '/features', label: 'Feature Analysis', icon: Sparkles },
  { path: '/history', label: 'Prediction History', icon: Clock },
  { path: '/about', label: 'Methodology & About', icon: BookOpen },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 md:hidden transition"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                AirGuard
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
                  v1.0 ML
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Environmental Risk Intelligence & Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Right Status Banner & Action Buttons */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px]">airguardDB Connected</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-medium">24,850 Records</span>
          </div>

          <button
            onClick={() => navigate('/predict')}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 transition transform hover:-translate-y-0.5"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Predict Risk</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#0B0F19] border-r border-white/10 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col justify-between pt-16 md:pt-0`}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform Modules
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : item.highlight
                        ? 'text-emerald-300 hover:bg-emerald-500/10 hover:text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 transition group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Footer Info Box */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-white">MongoDB + ML</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                  CPCB NAQI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                70:30 Split • Stratified • Zero Leakage Preprocessing
              </p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#070B14]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
