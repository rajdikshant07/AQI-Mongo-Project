import React, { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  Filter,
  RefreshCw,
  Database,
  ShieldCheck,
  ShieldAlert,
  BrainCircuit
} from 'lucide-react';
import airguardApi from '../services/api';

export default function PredictionHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await airguardApi.getPredictionHistory({
        limit: 50,
        risk: filterRisk,
        model: filterModel,
      });
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterRisk, filterModel]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this historical prediction audit record from MongoDB?')) return;
    try {
      await airguardApi.deletePrediction(id);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete prediction record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Historical Prediction Audits
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              airguardDB.prediction_results
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable prediction audit logs persisted in MongoDB with confidence probabilities and timestamps.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="0">Lower Risk Only</option>
            <option value="1">Elevated Risk Only</option>
          </select>

          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Models</option>
            <option value="Logistic Regression">Logistic Regression</option>
            <option value="Gradient Boosting">Gradient Boosting</option>
            <option value="Random Forest">Random Forest</option>
            <option value="Decision Tree">Decision Tree</option>
            <option value="Support Vector Machine">SVM</option>
          </select>

          <button
            onClick={fetchHistory}
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
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Predicted Risk</th>
                <th className="py-3 px-3 text-right">Probability</th>
                <th className="py-3 px-3 text-right">PM2.5</th>
                <th className="py-3 px-3 text-right">PM10</th>
                <th className="py-3 px-3 text-right">CO</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-sans">
                    Loading prediction history from MongoDB...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-sans">
                    No prediction audit logs found in MongoDB.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const isElevated = item.predicted_risk === 1;
                  const timeFormatted = item.prediction_timestamp ? item.prediction_timestamp.replace('T', ' ').slice(0, 19) : 'N/A';
                  return (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 text-slate-400 text-[10px]">{timeFormatted}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {item.station_or_city || 'Custom Input'}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300">{item.model_name}</td>
                      <td className="py-3 px-3 font-sans">
                        {isElevated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold">
                            <ShieldAlert className="w-3 h-3" />
                            Elevated (1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Lower (0)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {((item.probability || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400">
                        {item.input_features?.pm25 || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {item.input_features?.pm10 || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {item.input_features?.co || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition"
                          title="Delete Audit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
