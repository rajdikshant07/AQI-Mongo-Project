import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  Layers,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Wind
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import airguardApi from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [showAllCities, setShowAllCities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, rankingsRes] = await Promise.all([
        airguardApi.getDashboardStats(),
        airguardApi.getCityRankings(30),
      ]);
      setStats(statsRes.data);
      setRankings(rankingsRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to AirGuard backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Environmental Telemetry from airguardDB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 max-w-xl mx-auto my-12 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <h3 className="font-bold text-base">Backend Connection Error</h3>
        <p className="text-xs mt-1 text-slate-300">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const pieData = stats
    ? [
        { name: 'Lower Risk (Class 0)', value: stats.risk_breakdown.lower_risk_count, color: '#059669' },
        { name: 'Elevated Risk (Class 1)', value: stats.risk_breakdown.elevated_risk_count, color: '#dc2626' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            AirGuard Intelligence Dashboard
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Live CPCB Stream
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-world ambient air quality measurements from 26 Indian metropolitan centers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/predict')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Classify Risk</span>
          </button>
        </div>
      </div>

      {/* Headline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Observations */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Clean Records</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.total_observations_processed?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{stats?.unique_cities_count} Major Cities</span>
            <span>• 5.5 Years Span</span>
          </div>
        </div>

        {/* Active Monitoring Stations */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitoring Stations</span>
            <MapPin className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.monitoring_stations_count} CAAQMS
          </div>
          <div className="text-[11px] text-teal-400 mt-1 font-mono">
            Indexed with 2dsphere GeoJSON
          </div>
        </div>

        {/* Mean PM2.5 */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Mean PM2.5 Concentration</span>
            <Wind className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.averages?.pm25} <span className="text-xs font-normal text-slate-400">µg/m³</span>
          </div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <span>CPCB Safe Limit: 60 µg/m³</span>
          </div>
        </div>

        {/* Elevated Risk Rate */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Elevated Risk Rate</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.risk_breakdown?.elevated_risk_pct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats?.risk_breakdown?.elevated_risk_count?.toLocaleString()} Elevated vs {stats?.risk_breakdown?.lower_risk_count?.toLocaleString()} Lower
          </div>
        </div>
      </div>

      {/* Middle Grid: Risk Proportion Donut & City Pollution Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Air Quality Risk Target Ratio
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              CPCB ground-truth classification (Class 0: AQI ≤ 100 vs Class 1: AQI &gt; 100).
            </p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(val) => [`${val.toLocaleString()} records`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Class 0: Lower</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{stats?.risk_breakdown?.lower_risk_pct}%</span>
              <span className="text-[10px] text-slate-400">{stats?.risk_breakdown?.lower_risk_count?.toLocaleString()} records</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-[10px] text-red-400 font-semibold block uppercase">Class 1: Elevated</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{stats?.risk_breakdown?.elevated_risk_pct}%</span>
              <span className="text-[10px] text-slate-400">{stats?.risk_breakdown?.elevated_risk_count?.toLocaleString()} records</span>
            </div>
          </div>
        </div>

        {/* City Pollution Rankings Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                {showAllCities ? 'All 26 Metropolitan Centers by PM2.5' : 'Top 8 Cities by Mean PM2.5 Concentration'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregated via MongoDB aggregation pipeline ($group, $avg, $sort).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllCities(!showAllCities)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-semibold border border-white/10 transition"
              >
                {showAllCities ? 'Show Top 8' : 'Show All 26'}
              </button>
              <button
                onClick={() => navigate('/monitoring')}
                className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1"
              >
                <span>City Monitor</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          <div className={showAllCities ? "h-96 my-2" : "h-64 my-2"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={showAllCities ? rankings : rankings.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 45, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} unit=" µg" />
                <YAxis dataKey="city" type="category" stroke="#cbd5e1" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(val, name) => [`${val} µg/m³`, name === 'avg_pm25' ? 'Mean PM2.5' : 'Mean PM10']}
                />
                <Bar dataKey="avg_pm25" fill="#059669" radius={[0, 6, 6, 0]} barSize={showAllCities ? 10 : 16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-white/5">
            <span>Highest Polluted Metropolitan Center: <strong className="text-white">{stats?.extremes?.most_polluted_city}</strong></span>
            <span className="text-emerald-400 font-mono">CPCB Permissible: 60 µg/m³</span>
          </div>
        </div>
      </div>

      {/* All 26 Metropolitan Cities Quick Overview Grid */}
      <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              All 26 CPCB Metropolitan Centers Overview
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any city pill to inspect historical daily records or locate on GIS map.
            </p>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-lg text-xs font-medium border border-white/10 transition"
          >
            <span>Open GIS Map</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 pt-1">
          {rankings.map((c) => {
            const isElevated = c.risk_class === 1;
            return (
              <div
                key={c.city}
                onClick={() => navigate(`/monitoring?city=${encodeURIComponent(c.city)}`)}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.05] cursor-pointer transition text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white group-hover:text-emerald-400 transition truncate">
                    {c.city}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isElevated ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  PM2.5: <span className={c.avg_pm25 > 60 ? 'text-amber-400 font-bold' : 'text-slate-200'}>{c.avg_pm25}</span>
                </div>
                <div className="text-[10px] mt-0.5 flex items-center justify-between">
                  <span className={isElevated ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                    {isElevated ? 'Elevated' : 'Lower'}
                  </span>
                  <span className="text-slate-500 font-mono">{c.observation_count} recs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Criteria Pollutants Baseline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'PM2.5', val: stats?.averages?.pm25, unit: 'µg/m³', desc: 'Fine Particulates' },
          { label: 'PM10', val: stats?.averages?.pm10, unit: 'µg/m³', desc: 'Inhalable Dust' },
          { label: 'NO2', val: stats?.averages?.no2, unit: 'µg/m³', desc: 'Vehicular Smog' },
          { label: 'SO2', val: stats?.averages?.so2, unit: 'µg/m³', desc: 'Industrial Smoke' },
          { label: 'CO', val: stats?.averages?.co, unit: 'mg/m³', desc: 'Combustion Gas' },
          { label: 'Ozone', val: stats?.averages?.o3, unit: 'µg/m³', desc: 'Photochemical' },
        ].map((pol, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
            <span className="text-[11px] font-bold text-slate-300 block">{pol.label}</span>
            <span className="text-lg font-black text-white mt-1 block">{pol.val}</span>
            <span className="text-[10px] text-slate-400 font-mono block">{pol.unit}</span>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">{pol.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
