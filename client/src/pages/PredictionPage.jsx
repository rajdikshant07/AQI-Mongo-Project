import React, { useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  RefreshCw,
  Database,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import airguardApi from '../services/api';

const PRESETS = {
  clean: {
    name: 'Clean Coastal Air',
    city: 'Thiruvananthapuram',
    pm25: 18.0,
    pm10: 35.0,
    no: 4.0,
    no2: 12.0,
    nox: 16.0,
    nh3: 8.0,
    co: 0.35,
    so2: 6.5,
    o3: 20.0,
    benzene: 0.5,
    toluene: 1.5,
    month: 7,
    is_weekend: 0,
  },
  moderate: {
    name: 'Average Urban Air',
    city: 'Bengaluru',
    pm25: 55.0,
    pm10: 95.0,
    no: 15.0,
    no2: 28.0,
    nox: 38.0,
    nh3: 18.0,
    co: 0.95,
    so2: 11.0,
    o3: 32.0,
    benzene: 2.1,
    toluene: 4.8,
    month: 3,
    is_weekend: 0,
  },
  severe: {
    name: 'Severe Winter Smog',
    city: 'Delhi',
    pm25: 310.0,
    pm10: 450.0,
    no: 75.0,
    no2: 85.0,
    nox: 160.0,
    nh3: 55.0,
    co: 3.8,
    so2: 24.0,
    o3: 42.0,
    benzene: 6.5,
    toluene: 16.0,
    month: 12,
    is_weekend: 1,
  },
};

export default function PredictionPage() {
  const [formData, setFormData] = useState(PRESETS.moderate);
  const [selectedModel, setSelectedModel] = useState('Logistic Regression');
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);

  const applyPreset = (presetKey) => {
    const p = PRESETS[presetKey];
    setFormData({ ...p });
    setPredictionResult(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setPredicting(true);
      setError(null);
      const payload = {
        ...formData,
        model_name: selectedModel,
        station_or_city: formData.city || 'Custom User Input',
      };
      const res = await airguardApi.predictRisk(payload);
      setPredictionResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Real-Time Risk Classification Laboratory
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Live Inference
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Input chemical sensory readings to generate posterior probabilities and log audit records in MongoDB.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Presets:</span>
          <button
            onClick={() => applyPreset('clean')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30 transition"
          >
            Clean Air
          </button>
          <button
            onClick={() => applyPreset('moderate')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30 transition"
          >
            Urban Moderate
          </button>
          <button
            onClick={() => applyPreset('severe')}
            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition"
          >
            Severe Smog
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (Left 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Environmental Input Parameters
              </h3>
              <p className="text-[11px] text-slate-400">
                Measurements will be standardized via <code>StandardScaler (Zero Leakage)</code>.
              </p>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Logistic Regression">Logistic Regression (Primary)</option>
                <option value="Gradient Boosting">Gradient Boosting (Champion)</option>
                <option value="Random Forest">Random Forest</option>
                <option value="Decision Tree">Decision Tree</option>
                <option value="Support Vector Machine">Support Vector Machine</option>
              </select>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-6">
            {/* Location & Month */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Monitoring Location
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  placeholder="e.g. Anand Vihar, Delhi"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Month of Year (1–12)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.month || 1}
                  onChange={(e) => handleInputChange('month', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Day Classification
                </label>
                <select
                  value={formData.is_weekend || 0}
                  onChange={(e) => handleInputChange('is_weekend', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                >
                  <option value={0}>Weekday (Monday–Friday)</option>
                  <option value={1}>Weekend (Saturday–Sunday)</option>
                </select>
              </div>
            </div>

            {/* Criteria Pollutants Sliders */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Atmospheric Criteria Pollutants
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'pm25', label: 'PM2.5 (Fine Particles)', max: 500, unit: 'µg/m³', step: 1 },
                  { key: 'pm10', label: 'PM10 (Inhalable Dust)', max: 600, unit: 'µg/m³', step: 1 },
                  { key: 'no2', label: 'NO2 (Nitrogen Dioxide)', max: 200, unit: 'µg/m³', step: 0.5 },
                  { key: 'so2', label: 'SO2 (Sulfur Dioxide)', max: 150, unit: 'µg/m³', step: 0.5 },
                  { key: 'co', label: 'CO (Carbon Monoxide)', max: 25, unit: 'mg/m³', step: 0.1 },
                  { key: 'o3', label: 'Ozone (O3)', max: 200, unit: 'µg/m³', step: 1 },
                ].map((item) => (
                  <div key={item.key} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.label}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formData[item.key]} {item.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      step={item.step}
                      value={formData[item.key] || 0}
                      onChange={(e) => handleInputChange(item.key, e.target.value)}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {predicting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Posterior Probabilities...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Classify Air Quality Risk & Persist Audit</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Card (Right Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col justify-between h-full min-h-[460px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Classification Output
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono">
                  {selectedModel}
                </span>
              </div>

              {!predictionResult ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Adjust pollutant parameters and click <strong>Classify Air Quality Risk</strong> to generate real-time probability estimates.
                  </p>
                </div>
              ) : (
                <div className="pt-4 space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      predictionResult.predicted_risk === 1
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {predictionResult.predicted_risk === 1 ? (
                      <ShieldAlert className="w-8 h-8 flex-shrink-0" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-mono uppercase font-bold block">
                        {predictionResult.predicted_risk === 1 ? 'High Risk Alert' : 'Normal Conditions'}
                      </span>
                      <h4 className="text-base font-black text-white">
                        {predictionResult.risk_category}
                      </h4>
                    </div>
                  </div>

                  {/* Probability Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Elevated Risk Probability:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {(predictionResult.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          predictionResult.predicted_risk === 1
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, predictionResult.probability * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>0% (Clean)</span>
                      <span>50% Threshold</span>
                      <span>100% (Severe)</span>
                    </div>
                  </div>

                  {/* Feature Contributions for Logistic Regression */}
                  {predictionResult.feature_contributions?.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Top Risk Drivers (β × z):
                      </span>
                      <div className="space-y-1.5">
                        {predictionResult.feature_contributions.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/[0.02]">
                            <span className="font-medium text-slate-300 uppercase">{c.feature}</span>
                            <span className={`font-mono text-[11px] font-bold ${c.contribution > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {c.contribution > 0 ? `+${c.contribution.toFixed(2)}` : c.contribution.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MongoDB Audit Confirmation Badge */}
                  {predictionResult._id && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                        <Database className="w-3.5 h-3.5" />
                        <span>MongoDB Audit ID:</span>
                      </div>
                      <span className="font-mono text-slate-300 text-[10px] truncate max-w-[120px]">
                        {predictionResult._id}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scientific Disclaimer Note */}
            <div className="pt-4 border-t border-white/10 text-[10px] text-slate-400 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                Model predictions reflect mathematical probabilities based on historical CPCB measurements. 
                Atmospheric probabilities are risk classifications, not guaranteed outcomes.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
