import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Activity,
  Sliders,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  CheckCircle2,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import airguardApi from '../services/api';

// Generate synthetic Sigmoid S-Curve coordinates
const SIGMOID_DATA = [];
for (let z = -6; z <= 6; z += 0.5) {
  const p = 1 / (1 + Math.exp(-z));
  SIGMOID_DATA.push({
    z: z.toFixed(1),
    probability: parseFloat(p.toFixed(4)),
    percentage: parseFloat((p * 100).toFixed(1)),
  });
}

export default function MachineLearningLabPage() {
  const [modelEval, setModelEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.5);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const res = await airguardApi.getModelComparison();
        if (res.data && res.data.length > 0) {
          setModelEval(res.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, []);

  // Base confusion matrix at tau = 0.5 (N = 7,455)
  const baseTN = 2482;
  const baseFP = 388;
  const baseFN = 438;
  const baseTP = 4147;
  const total = 7455;

  // Approximate shift simulation as threshold tau moves from 0.1 to 0.9
  const delta = (threshold - 0.5) * 800;
  const simFP = Math.max(80, Math.min(1200, Math.round(baseFP - delta * 0.7)));
  const simTN = total - 4585 - simFP;
  const simFN = Math.max(120, Math.min(1100, Math.round(baseFN + delta * 0.8)));
  const simTP = 4585 - simFN;

  const simAccuracy = ((simTP + simTN) / total) * 100;
  const simPrecision = (simTP / (simTP + simFP)) * 100;
  const simRecall = (simTP / (simTP + simFN)) * 100;
  const simF1 = (2 * (simPrecision * simRecall)) / (simPrecision + simRecall);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Logistic Regression Laboratory
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Interactive Mathematics & Simulation
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Simulate decision thresholds, explore the Sigmoid activation curve, and evaluate log-loss minimization under L2 regularization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            Model: Logistic Regression (L-BFGS)
          </div>
        </div>
      </div>

      {/* SECTION 1: THE CORE MATHEMATICAL ENGINE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">1. Linear Combination</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
            z = β₀ + ∑ⱼ₌₁ᵖ βⱼXⱼ
          </div>
          <p className="text-[11px] text-slate-400">
            Weighted log-odds score. Intercept <code className="text-slate-200">β₀ = +3.4551</code> across 17 standardized predictors.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">2. Sigmoid Activation</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-blue-400">
            P(y=1|X) = 1 / (1 + e⁻ᶻ)
          </div>
          <p className="text-[11px] text-slate-400">
            Continuous transformation constraining unbounded linear score <code className="text-slate-200">z</code> into probabilistic interval <code className="text-slate-200">(0, 1)</code>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">3. Logit & Odds Ratio</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-purple-400">
            ln(P / [1-P]) = z | OR = eᵝ
          </div>
          <p className="text-[11px] text-slate-400">
            Natural log of odds is linear in features. Top driver: <code className="text-slate-200">CO (OR = 293.4x)</code>.
          </p>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE CLASSIFICATION THRESHOLD SLIDER (PDF Topic 5) */}
      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Interactive Classification Threshold Tuner (τ)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Move the threshold slider to observe real-time trade-offs between Sensitivity (Recall) and False Positives (Type I Error).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-mono">Current τ:</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-mono font-bold border border-emerald-500/30">
              {threshold.toFixed(2)}
            </span>
            <button
              onClick={() => setThreshold(0.5)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Reset to default 0.50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>τ = 0.10 (High Sensitivity / Catch all pollution)</span>
            <span className="text-emerald-400 font-bold">Default: 0.50</span>
            <span>τ = 0.90 (High Specificity / Few false alarms)</span>
          </div>
        </div>

        {/* Dynamic Confusion Matrix & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2">
          {/* Simulated TN */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">True Negatives (TN)</span>
            <div className="text-xl font-bold font-mono text-white">{simTN.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Clean days correctly flagged</p>
          </div>

          {/* Simulated FP */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">False Positives (FP)</span>
            <div className="text-xl font-bold font-mono text-white">{simFP.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Type I Error (False alarms)</p>
          </div>

          {/* Simulated FN */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">False Negatives (FN)</span>
            <div className="text-xl font-bold font-mono text-white">{simFN.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Type II Error (Missed hazards)</p>
          </div>

          {/* Simulated TP */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">True Positives (TP)</span>
            <div className="text-xl font-bold font-mono text-white">{simTP.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Hazardous days caught</p>
          </div>
        </div>

        {/* Dynamic Metric Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Accuracy</span>
            <span className="text-base font-bold text-white font-mono">{simAccuracy.toFixed(2)}%</span>
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Precision</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{simPrecision.toFixed(2)}%</span>
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Recall (Sensitivity)</span>
            <span className="text-base font-bold text-blue-400 font-mono">{simRecall.toFixed(2)}%</span>
          </div>
          <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">F1 Score</span>
            <span className="text-base font-bold text-purple-400 font-mono">{simF1.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: SIGMOID S-CURVE VISUALIZATION */}
      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Sigmoid S-Curve Mapping (z Score vs. P(y=1|X))
            </h3>
            <p className="text-[11px] text-slate-400">
              The mathematical activation function mapping linear scores from -6 to +6 into calibrated probability.
            </p>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Threshold: <span className="text-emerald-400 font-bold">{threshold}</span> (Decision boundary: z = 0)
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SIGMOID_DATA} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis dataKey="z" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [`${(val * 100).toFixed(1)}%`, 'Probability']}
                labelFormatter={(label) => `Linear Score (z): ${label}`}
              />
              <ReferenceLine y={threshold} stroke="#10b981" strokeDasharray="3 3" label={{ value: `Threshold τ = ${threshold}`, fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine x="0.0" stroke="#94a3b8" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reference Coordinates Table from PDF Page 3 */}
        <div className="grid grid-cols-5 gap-2 pt-2 text-center text-xs font-mono">
          <div className="bg-[#070B14] p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block text-[10px]">z = -5</span>
            <span className="text-slate-300 font-bold">P = 0.0067</span>
          </div>
          <div className="bg-[#070B14] p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block text-[10px]">z = -2</span>
            <span className="text-slate-300 font-bold">P = 0.1192</span>
          </div>
          <div className="bg-[#070B14] p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <span className="text-emerald-400 block text-[10px]">z = 0 (Boundary)</span>
            <span className="text-white font-bold">P = 0.5000</span>
          </div>
          <div className="bg-[#070B14] p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block text-[10px]">z = +2</span>
            <span className="text-slate-300 font-bold">P = 0.8808</span>
          </div>
          <div className="bg-[#070B14] p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block text-[10px]">z = +5</span>
            <span className="text-slate-300 font-bold">P = 0.9933</span>
          </div>
        </div>
      </div>
    </div>
  );
}
