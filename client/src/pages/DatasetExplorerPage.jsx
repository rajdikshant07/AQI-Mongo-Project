import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import airguardApi from '../services/api';

const CITIES = [
  'All Cities', 'Delhi', 'Patna', 'Gurugram', 'Lucknow', 'Ahmedabad',
  'Bengaluru', 'Mumbai', 'Chennai', 'Kolkata', 'Hyderabad', 'Jaipur',
  'Amritsar', 'Thiruvananthapuram', 'Visakhapatnam', 'Bhopal', 'Chandigarh'
];

export default function DatasetExplorerPage() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await airguardApi.getDatasetRecords({
        page,
        limit,
        city: selectedCity === 'All Cities' ? '' : selectedCity,
        risk: selectedRisk,
      });
      setRecords(res.data?.records || []);
      setTotalRecords(res.data?.total_records || 0);
      setTotalPages(res.data?.total_pages || 1);
    } catch (err) {
      console.error('Failed to load dataset records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, selectedCity, selectedRisk]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Dataset Explorer
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">
              MongoDB Query Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying {totalRecords.toLocaleString()} cleaned and transformed observations with ground-truth CPCB NAQI scores.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCity}
            onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {CITIES.map((c) => (
              <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="0">Class 0: Lower Risk (AQI ≤ 100)</option>
            <option value="1">Class 1: Elevated Risk (AQI &gt; 100)</option>
          </select>

          <button
            onClick={fetchRecords}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-3">PM2.5</th>
                <th className="py-3 px-3">PM10</th>
                <th className="py-3 px-3">NO2</th>
                <th className="py-3 px-3">SO2</th>
                <th className="py-3 px-3">CO</th>
                <th className="py-3 px-3">O3</th>
                <th className="py-3 px-3">PM Ratio</th>
                <th className="py-3 px-3">Ground AQI</th>
                <th className="py-3 px-4">Risk Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400 font-sans">
                    Loading records from MongoDB...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400 font-sans">
                    No matching records found for the active filter.
                  </td>
                </tr>
              ) : (
                records.map((r, i) => {
                  const isElevated = r.ground_truth?.air_quality_risk === 1;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 px-4 font-sans text-white font-medium">{r.date}</td>
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">{r.city}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{r.features?.pm25?.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{r.features?.pm10?.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{r.features?.no2?.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{r.features?.so2?.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{r.features?.co?.toFixed(2)}</td>
                      <td className="py-2.5 px-3">{r.features?.o3?.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-slate-400">{r.features?.pm_ratio?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{r.ground_truth?.aqi?.toFixed(0)}</td>
                      <td className="py-2.5 px-4 font-sans">
                        {isElevated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            Elevated (1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            Lower (0)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-sans">
          <div>
            Page <span className="font-semibold text-white">{page}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span> ({totalRecords.toLocaleString()} total entries)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
