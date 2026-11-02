import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Wind,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  MapPin,
  Layers,
  ArrowUpRight,
  Sliders,
  Table,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import airguardApi from '../services/api';
import 'leaflet/dist/leaflet.css';

// All 26 Indian metropolitan centers in the CPCB dataset
const ALL_CITIES = [
  'Ahmedabad', 'Aizawl', 'Amaravati', 'Amritsar', 'Bengaluru', 'Bhopal',
  'Brajrajnagar', 'Chandigarh', 'Chennai', 'Coimbatore', 'Delhi', 'Ernakulam',
  'Gurugram', 'Guwahati', 'Hyderabad', 'Jaipur', 'Jorapokhar', 'Kochi',
  'Kolkata', 'Lucknow', 'Mumbai', 'Patna', 'Shillong', 'Talcher',
  'Thiruvananthapuram', 'Visakhapatnam'
];

// Custom glowing city marker pin
const createCityPin = (isElevated) => {
  const color = isElevated ? '#dc2626' : '#10b981';
  return L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${color}; position: relative; z-index: 2;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
      map.invalidateSize();
    }
  }, [center, zoom, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || 'Delhi';
  
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  // All cities data & overview
  const [citiesData, setCitiesData] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [citySearch, setCitySearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL', 'LOWER', 'ELEVATED'
  const [activeViewTab, setActiveViewTab] = useState('matrix'); // 'matrix' or 'map'

  const navigate = useNavigate();

  // 1. Fetch overview metrics for all 26 cities
  const fetchAllCitiesOverview = async () => {
    try {
      setLoadingCities(true);
      const res = await airguardApi.getCities();
      const list = res.data || [];
      setCitiesData(list);
    } catch (err) {
      console.error('Failed to load cities overview:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  // 2. Fetch time-series historical observations for selected city
  const fetchCityTimeSeries = async (city) => {
    try {
      setLoadingRecords(true);
      const res = await airguardApi.getDatasetRecords({ city: city, limit: 120 });
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
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchAllCitiesOverview();
  }, []);

  useEffect(() => {
    fetchCityTimeSeries(selectedCity);
  }, [selectedCity]);

  // Handle selecting a city from table or map
  const handleSelectCity = (cityName) => {
    setSelectedCity(cityName);
    setSearchParams({ city: cityName });
    // Scroll smoothly to chart
    const el = document.getElementById('city-chart-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  // Filter cities by search term and risk filter
  const filteredCities = citiesData.filter((c) => {
    const matchesSearch = c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
                          (c.state && c.state.toLowerCase().includes(citySearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (riskFilter === 'LOWER') return c.risk_class === 0;
    if (riskFilter === 'ELEVATED') return c.risk_class === 1;
    return true;
  });

  const selectedCityStats = citiesData.find((c) => c.city === selectedCity);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Urban Atmospheric Monitoring
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              All 26 Metropolitan Centers
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-pollutant environmental telemetry and risk classification directly from MongoDB <code>processed_records</code>.
          </p>
        </div>

        {/* View Switcher Tabs & Quick Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveViewTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeViewTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>All Cities Table ({citiesData.length})</span>
            </button>
            <button
              onClick={() => setActiveViewTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeViewTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geospatial Map</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchAllCitiesOverview();
              fetchCityTimeSeries(selectedCity);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCities || loadingRecords ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: ALL 26 CITIES COMPREHENSIVE MATRIX TABLE */}
      {activeViewTab === 'matrix' && (
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                All 26 Metropolitan Cities Environmental Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3), NAQI, and Logistic Regression Risk Classification.
              </p>
            </div>

            {/* Filter by search and risk */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter 26 cities..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="LOWER">Class 0: Lower Risk</option>
                <option value="ELEVATED">Class 1: Elevated Risk</option>
              </select>
            </div>
          </div>

          {/* Cities Data Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">City & State</th>
                  <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
                  <th className="py-2.5 px-3">PM10 (µg/m³)</th>
                  <th className="py-2.5 px-3">NO2 (µg/m³)</th>
                  <th className="py-2.5 px-3">SO2 (µg/m³)</th>
                  <th className="py-2.5 px-3">CO (mg/m³)</th>
                  <th className="py-2.5 px-3">Ozone (µg/m³)</th>
                  <th className="py-2.5 px-3">Mean AQI</th>
                  <th className="py-2.5 px-3">Risk Classification</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingCities ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 font-mono">
                      Loading criteria measurements across 26 cities from airguardDB...
                    </td>
                  </tr>
                ) : filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">
                      No cities match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((c) => {
                    const isSelected = c.city === selectedCity;
                    const isElevated = c.risk_class === 1;

                    return (
                      <tr
                        key={c.city}
                        onClick={() => handleSelectCity(c.city)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-500/15 text-white font-semibold'
                            : 'hover:bg-white/[0.04] text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isElevated ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                          <div>
                            <div className="font-bold text-slate-100">{c.city}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{c.state || 'India'}</div>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono font-medium">
                          <span className={c.avg_pm25 > 60 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {c.avg_pm25}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono">{c.avg_pm10 || '—'}</td>
                        <td className="py-2 px-3 font-mono">{c.avg_no2 || '—'}</td>
                        <td className="py-2 px-3 font-mono">{c.avg_so2 || '—'}</td>
                        <td className="py-2 px-3 font-mono">{c.avg_co || '—'}</td>
                        <td className="py-2 px-3 font-mono">{c.avg_o3 || '—'}</td>
                        <td className="py-2 px-3 font-mono font-bold">
                          <span className={c.avg_aqi > 100 ? 'text-red-400' : 'text-emerald-400'}>
                            {c.avg_aqi}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isElevated
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isElevated ? (
                              <>
                                <ShieldAlert className="w-3 h-3" />
                                Elevated ({c.elevated_risk_rate}%)
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                Lower Risk
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCity(c.city);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300'
                            }`}
                          >
                            {isSelected ? 'Active' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: INTERACTIVE GEOSPATIAL MAP OF ALL 26 CITIES */}
      {activeViewTab === 'map' && (
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                All-India Atmospheric Risk Geographical Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any city marker to view its environmental summary and activate its historical time-series.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Lower Risk (Class 0)
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Elevated Risk (Class 1)
              </span>
            </div>
          </div>

          <div className="h-[480px] rounded-xl overflow-hidden border border-white/10 relative">
            <MapContainer
              center={[22.5, 79.0]}
              zoom={5}
              style={{ width: '100%', height: '100%', minHeight: '480px' }}
              attributionControl={true}
            >
              <ChangeMapView center={selectedCityStats?.latitude ? [selectedCityStats.latitude, selectedCityStats.longitude] : null} zoom={8} />
              <MapResizer />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />

              {citiesData.map((c) => {
                const lat = Number(c.latitude);
                const lon = Number(c.longitude);
                if (!lat || !lon) return null;

                const isElevated = c.risk_class === 1;

                return (
                  <Marker
                    key={c.city}
                    position={[lat, lon]}
                    icon={createCityPin(isElevated)}
                    eventHandlers={{
                      click: () => handleSelectCity(c.city),
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1">
                          <strong className="text-xs text-white">{c.city}</strong>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${isElevated ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isElevated ? 'Elevated' : 'Lower'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-1 font-mono">
                          <div>PM2.5: <span className="font-bold text-white">{c.avg_pm25}</span></div>
                          <div>PM10: <span className="font-bold text-white">{c.avg_pm10 || '—'}</span></div>
                          <div>NO2: <span className="font-bold text-white">{c.avg_no2 || '—'}</span></div>
                          <div>AQI: <span className="font-bold text-white">{c.avg_aqi || '—'}</span></div>
                        </div>
                        <button
                          onClick={() => handleSelectCity(c.city)}
                          className="w-full mt-2 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold"
                        >
                          Select {c.city} for Analysis
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* TIME-SERIES TRAJECTORY CARD FOR CURRENTLY SELECTED CITY */}
      <div id="city-chart-section" className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                {selectedCity} — {pollutantLabels[selectedPollutant]}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous chronological observations retrieved directly from MongoDB <code>processed_records</code> (CPCB Safe Limit: {getSafeLimit(selectedPollutant)})
            </p>
          </div>

          {/* City & Pollutant Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => handleSelectCity(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              {ALL_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedPollutant}
              onChange={(e) => setSelectedPollutant(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="pm25">PM2.5 (Fine Particulates)</option>
              <option value="pm10">PM10 (Inhalable Dust)</option>
              <option value="no2">NO2 (Vehicular Smog)</option>
              <option value="so2">SO2 (Industrial Smoke)</option>
              <option value="co">CO (Combustion Gas)</option>
              <option value="o3">Ozone (Photochemical)</option>
              <option value="aqi">CPCB NAQI Index</option>
            </select>
          </div>
        </div>

        {/* Selected City Key Stats Bar */}
        {selectedCityStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-white/5 text-center">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Mean PM2.5</span>
              <span className="text-sm font-bold text-white">{selectedCityStats.avg_pm25} µg/m³</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Mean PM10</span>
              <span className="text-sm font-bold text-white">{selectedCityStats.avg_pm10 || '—'} µg/m³</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Mean NO2</span>
              <span className="text-sm font-bold text-white">{selectedCityStats.avg_no2 || '—'} µg/m³</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Mean SO2</span>
              <span className="text-sm font-bold text-white">{selectedCityStats.avg_so2 || '—'} µg/m³</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Mean NAQI</span>
              <span className="text-sm font-bold text-emerald-400">{selectedCityStats.avg_aqi || '—'}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-slate-400 block font-mono">Risk Status</span>
              <span className={`text-xs font-bold ${selectedCityStats.risk_class === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                {selectedCityStats.risk_label}
              </span>
            </div>
          </div>
        )}

        {/* Time-Series Chart */}
        <div className="h-80 w-full pt-4">
          {loadingRecords ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-mono">
              Retrieving historical observations for {selectedCity}...
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-mono">
              No historical records found for {selectedCity}.
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