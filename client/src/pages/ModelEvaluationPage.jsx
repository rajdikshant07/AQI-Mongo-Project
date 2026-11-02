import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import airguardApi from '../services/api';

export default function ModelEvaluationPage() {
  const [models, setModels] = useState([]);
  const [selectedModelName, setSelectedModelName] = useState('Logistic Regression');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await airguardApi.getModelComparison();
        setModels(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  const currentModel = models.find((m) => m.model_name === selectedModelName) || models[0];
  const cm = currentModel?.confusion_matrix || { tp: 4147, tn: 2482, fp: 388, fn: 438 };
  const total = (cm.tp + cm.tn + cm.fp + cm.fn) || 7455;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Model Evaluation & Clinical Diagnostics
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Confusion Matrix
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contingency tables, sensitivity, specificity, and Type I vs Type II public health error analysis.
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0B0F19] border border-white/10">
          {models.map((m) => (
            <button
              key={m.model_name}
              onClick={() => setSelectedModelName(m.model_name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedModelName === m.model_name
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.model_name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Confusion Matrix & Key Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Confusion Matrix */}
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Confusion Matrix: {selectedModelName}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evaluated on 7,455 held-out test records (Actual vs. Predicted).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Negative */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                <span>True Negative (TN)</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">{cm.tn?.toLocaleString()}</div>
              <p className="text-[10px] text-slate-300">
                Correctly predicted Lower Pollution Risk (Class 0).
              </p>
              <div className="text-[10px] font-mono text-emerald-400/80 pt-1">
                {((cm.tn / total) * 100).toFixed(1)}% of total test records
              </div>
            </div>

            {/* False Positive (Type I) */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                <span>False Positive (FP)</span>
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">{cm.fp?.toLocaleString()}</div>
              <p className="text-[10px] text-slate-300">
                Type I Error: Clean air falsely flagged as elevated risk.
              </p>
              <div className="text-[10px] font-mono text-amber-400/80 pt-1">
                {((cm.fp / total) * 100).toFixed(1)}% false alarm rate
              </div>
            </div>

            {/* False Negative (Type II) */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
                <span>False Negative (FN)</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">{cm.fn?.toLocaleString()}</div>
              <p className="text-[10px] text-slate-300">
                Type II Error: Dangerous pollution missed! Critical public health hazard.
              </p>
              <div className="text-[10px] font-mono text-red-400/80 pt-1">
                {((cm.fn / total) * 100).toFixed(1)}% missed hazard rate
              </div>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-400">
                <span>True Positive (TP)</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">{cm.tp?.toLocaleString()}</div>
              <p className="text-[10px] text-slate-300">
                Correctly predicted Elevated Pollution Risk (Class 1).
              </p>
              <div className="text-[10px] font-mono text-teal-400/80 pt-1">
                {((cm.tp / total) * 100).toFixed(1)}% correctly alerted
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Evaluation Metrics Summary
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Mathematical derivations for {selectedModelName}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Accuracy', val: `${((currentModel?.accuracy || 0) * 100).toFixed(2)}%`, formula: '(TP + TN) / Total' },
              { label: 'Precision', val: `${((currentModel?.precision || 0) * 100).toFixed(2)}%`, formula: 'TP / (TP + FP)' },
              { label: 'Recall (Sensitivity)', val: `${((currentModel?.recall || 0) * 100).toFixed(2)}%`, formula: 'TP / (TP + FN)' },
              { label: 'F1-Score', val: `${((currentModel?.f1_score || 0) * 100).toFixed(2)}%`, formula: '2 · (P · R) / (P + R)' },
              { label: 'ROC-AUC', val: (currentModel?.roc_auc || 0).toFixed(4), formula: 'Area under ROC curve' },
              { label: 'Log Loss', val: (currentModel?.log_loss || 0).toFixed(4), formula: 'Cross-Entropy Penalty' },
            ].map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 font-medium block">{item.label}</span>
                <span className="text-xl font-black text-white mt-1 block">{item.val}</span>
                <span className="text-[10px] font-mono text-emerald-400/80 block mt-0.5">{item.formula}</span>
              </div>
            ))}
          </div>

          {/* Academic Context Alert */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-amber-400">Clinical / Public Health Context:</strong> In environmental risk classification, 
            <strong> False Negatives (FN)</strong> are substantially more dangerous than False Positives (FP). Missing an episode 
            of elevated pollution prevents vulnerable populations (asthmatics, children, elderly) from taking protective action.
          </div>
        </div>
      </div>
    </div>
  );
}
