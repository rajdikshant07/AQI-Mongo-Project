import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Wind,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import airguardApi from '../services/api';

const CITIES = [
  'Delhi', 'Patna', 'Gurugram', 'Lucknow', 'Ahmedabad', 'Bengaluru',
  'Mumbai', 'Chennai', 'Kolkata', 'Hyderabad', 'Jaipur', 'Amritsar',
  'Thiruvananthapuram', 'Visakhapatnam', 'Bhopal', 'Chandigarh'
];

export default function MonitoringPage() {
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCityData = async () => {
    try {
      setLoading(true);
      const res = await airguardApi.getDatasetRecords({ city: selectedCity, limit: 100 });
      // Reverse records so they appear chronologically in the time-series chart
      const chartData = (res.data?.records || []).slice().reverse().map((r) => ({
        date: r.date,
        pm25: r.features?.pm25,
        pm10: r.features?.pm10,
        no2: r.features?.no2,
        so2: r.features?.so2,
        co: r.features?.co,
        o3: r.features?.o3,
        aqi: r.ground_truth?.aqi,
        risk: r.ground_truth?.air_quality_risk,
      }));
      setRecords(chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityData();
  }, [selectedCity]);

  const pollutantLabels = {
    pm25: 'PM2.5 (Fine Particles, µg/m³)',
    pm10: 'PM10 (Inhalable Dust, µg/m³)',
    no2: 'NO2 (Nitrogen Dioxide, µg/m³)',
    so2: 'SO2 (Sulfur Dioxide, µg/m³)',
    co: 'CO (Carbon Monoxide, mg/m³)',
    o3: 'Ozone (O3, µg/m³)',
  };

  const getSafeLimit = (pol) => {
    switch (pol) {
      case 'pm25': return 60;
      case 'pm10': return 100;
      case 'no2': return 80;
      case 'so2': return 80;
      case 'co': return 2.0;
      case 'o3': return 100;
      default: return 50;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Urban Atmospheric Monitoring
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono border border-teal-500/30">
              City Time-Series
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical daily observations retrieved directly from MongoDB collection <code>processed_records</code>.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedPollutant}
            onChange={(e) => setSelectedPollutant(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="pm25">PM2.5 (Fine PM)</option>
            <option value="pm10">PM10 (Coarse PM)</option>
            <option value="no2">NO2 (Vehicular)</option>
            <option value="so2">SO2 (Industrial)</option>
            <option value="co">CO (Combustion)</option>
            <option value="o3">O3 (Photochemical)</option>
          </select>

          <button
            onClick={fetchCityData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-400" />
              {selectedCity} — {pollutantLabels[selectedPollutant]}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous chronological observation trajectory (CPCB Safe Limit: {getSafeLimit(selectedPollutant)})
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Observed Value
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-mono">
              Streaming observations for {selectedCity}...
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-mono">
              No historical records found for this selection.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={records} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  formatter={(val) => [`${val}`, selectedPollutant.toUpperCase()]}
                />
                <Line
                  type="monotone"
                  dataKey={selectedPollutant}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Observation Guidelines & Health Impact Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            Lower Risk (AQI ≤ 100)
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            Good or Satisfactory atmospheric purity. Ideal for outdoor recreation, athletic training, and normal ventilation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            Moderate Risk (AQI 101–200)
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            Can trigger minor breathing discomfort to asthmatic and elderly citizens. Sensitive individuals should limit heavy exertion.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
            <AlertOctagon className="w-4 h-4" />
            Elevated Risk (AQI &gt; 200)
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
            Poor to Severe hazard. High concentration of respirable fine particulate matter causes adverse health outcomes across healthy populations.
          </p>
        </div>
      </div>
    </div>
  );
}
