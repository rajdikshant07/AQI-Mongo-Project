import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import airguardApi from '../services/api';

export default function MachineLearningLabPage() {
  const [models, setModels] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const [compRes, histRes] = await Promise.all([
          airguardApi.getModelComparison(),
          airguardApi.getModelHistory(),
        ]);
        setModels(compRes.data || []);
        setHistory(histRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const chartData = models.map((m) => ({
    name: m.model_name,
    Accuracy: parseFloat((m.accuracy * 100).toFixed(1)),
    Recall: parseFloat((m.recall * 100).toFixed(1)),
    'F1-Score': parseFloat((m.f1_score * 100).toFixed(1)),
    'ROC-AUC': parseFloat((m.roc_auc * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Machine Learning Laboratory
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
            Model Benchmarking
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Comparative performance evaluation across 5 classification algorithms trained on the mandatory 70:30 stratified partition.
        </p>
      </div>

      {/* Main Model Comparison Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Comparative Performance Matrix (30% Held-Out Test Set, N = 7,455)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Zero Data Leakage • StandardScaler
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">Recall</th>
                <th className="py-3 px-3 text-right">F1-Score</th>
                <th className="py-3 px-3 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-right">Train Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              {models.map((m, idx) => {
                const isPrimary = m.is_primary_model || m.model_name === 'Logistic Regression';
                const isChampion = idx === 0;
                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                      {isChampion && <Award className="w-3.5 h-3.5 text-amber-400" />}
                      {m.model_name}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {isChampion ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold">
                          Champion
                        </span>
                      ) : isPrimary ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-semibold">
                          Primary Academic
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px]">
                          Comparative
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {(m.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right">{(m.precision * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right font-bold text-teal-300">
                      {(m.recall * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-white font-extrabold">
                      {(m.f1_score * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-amber-300 font-bold">
                      {m.roc_auc.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-sans">
                      {m.training_time_sec < 1 ? `${(m.training_time_sec * 1000).toFixed(0)} ms` : `${m.training_time_sec.toFixed(2)} s`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Model Metrics Comparison Chart */}
      <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Performance Metric Comparison Across Algorithms (%)
          </h3>
          <p className="text-[11px] text-slate-400">
            Empirical validation on 7,455 unseen test records (Accuracy, Recall, F1-Score, and ROC-AUC).
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} domain={[80, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ROC-AUC" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Experimental Setup & Training Provenance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Cpu className="w-4 h-4 text-emerald-400" />
            70:30 Stratified Partition
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            17,395 training records and 7,455 testing records. Preserved exact 38.49% : 61.51% class distribution across both partitions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Zero Data Leakage Protocol
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            StandardScaler fit strictly on training partition; transformed testing partition without refitting.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            Computational Efficiency
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Logistic Regression converged in 104 ms, providing near-instantaneous training suitable for frequent automated model refreshes.
          </p>
        </div>
      </div>
    </div>
  );
}
