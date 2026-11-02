import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  CloudRain,
  Flame,
  Info,
  RefreshCw,
  Sun,
  ThermometerSnowflake,
  Wind
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import airguardApi from '../services/api';

export default function AnalyticsPage() {
  const [trends, setTrends] = useState({ monthly: [], seasonal: [] });
  const [correlations, setCorrelations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [trendsRes, corrRes] = await Promise.all([
          airguardApi.getTrends(),
          airguardApi.getCorrelations(),
        ]);
        setTrends(trendsRes.data || { monthly: [], seasonal: [] });
        setCorrelations(corrRes.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const corrData = Object.entries(correlations).map(([key, val]) => ({
    feature: key.toUpperCase(),
    correlation: val,
  })).sort((a, b) => b.correlation - a.correlation);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Environmental Pollution Analytics
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
            Temporal & Chemical
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          In-depth seasonal dynamics, atmospheric thermal inversions, and chemical pollutant associations.
        </p>
      </div>

      {/* Top Grid: Monthly Trends & Seasonal Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trajectory Line Chart */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Monthly Pollutant Progression (µg/m³)
              </h3>
              <p className="text-[11px] text-slate-400">
                Reveals severe winter smog spikes (Dec–Jan) and monsoon wash-out (Jul–Aug).
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.monthly} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="avg_pm25" stroke="#ef4444" strokeWidth={2.5} name="PM2.5 (µg/m³)" />
                <Line type="monotone" dataKey="avg_pm10" stroke="#3b82f6" strokeWidth={2} name="PM10 (µg/m³)" />
                <Line type="monotone" dataKey="avg_no2" stroke="#f59e0b" strokeWidth={1.5} name="NO2 (µg/m³)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Risk Breakdown Bar Chart */}
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
              Elevated Risk Proportion by IMD Season (%)
            </h3>
            <p className="text-[11px] text-slate-400">
              India Meteorological Department (IMD) seasonal classification framework.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.seasonal} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="season_name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(val) => [`${val}%`, 'Elevated Risk Rate']}
                />
                <Bar dataKey="elevated_risk_pct" radius={[6, 6, 0, 0]}>
                  {trends.seasonal.map((entry, index) => {
                    const colors = ['#dc2626', '#f59e0b', '#059669', '#b91c1c'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Correlation Matrix Horizontal Bar Chart */}
      <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Empirical Feature Correlations with Risk Target (r)
          </h3>
          <p className="text-[11px] text-slate-400">
            Pearson correlation coefficient against binary risk target (air_quality_risk).
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={corrData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" fontSize={10} domain={[-0.1, 0.6]} />
              <YAxis dataKey="feature" type="category" stroke="#cbd5e1" fontSize={10} width={90} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                formatter={(val) => [`r = ${val.toFixed(4)}`, 'Correlation']}
              />
              <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                {corrData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.correlation > 0.4 ? '#dc2626' : entry.correlation > 0.2 ? '#f59e0b' : '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meteorological Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <ThermometerSnowflake className="w-4 h-4" />
            Winter Atmospheric Inversion (81.6% Elevated Risk)
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            During Northern Indian winters (December to February), cold air settles near the ground beneath a layer of warm air. 
            This temperature inversion compresses the planetary boundary layer, trapping vehicular exhaust, industrial soot, 
            and agricultural residue in dense hazardous smog.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CloudRain className="w-4 h-4" />
            Monsoon Wet Scavenging (39.8% Elevated Risk)
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            From June through September, the South Asian monsoon generates heavy sustained rainfall. Falling raindrops 
            collide with suspended particulate matter (PM2.5 and PM10) through atmospheric wet deposition, scavenging 
            particulates out of the troposphere and restoring healthy air quality.
          </p>
        </div>
      </div>
    </div>
  );
}
