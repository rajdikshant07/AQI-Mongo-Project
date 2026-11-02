import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  BarChart3,
  HelpCircle,
  Info,
  Scale,
  TrendingDown,
  TrendingUp,
  Wind
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import airguardApi from '../services/api';

export default function FeatureAnalysisPage() {
  const [data, setData] = useState({ intercept: 0, coefficients: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoefficients = async () => {
      try {
        setLoading(true);
        const res = await airguardApi.getModelCoefficients();
        setData(res.data || { intercept: 0, coefficients: [] });
      } catch (err) {
        console.error('Failed to load coefficients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoefficients();
  }, []);

  const chartData = (data.coefficients || []).map((c) => ({
    name: c.feature.toUpperCase(),
    coefficient: c.coefficient,
    odds_ratio: c.odds_ratio,
  })).sort((a, b) => b.coefficient - a.coefficient);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          Feature Analysis & Model Interpretability
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
            Logistic Regression Weights
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Mathematical attribution of feature coefficients (β) and odds ratio multipliers (exp[β]).
        </p>
      </div>

      {/* Model Parameters Header Card */}
      <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Linear Predictor Equation
          </span>
          <div className="text-sm font-mono text-white mt-1">
            z = β₀ + β₁(PM2.5) + β₂(PM10) + β₃(NO2) + ... + β₁₇(Is_Weekend)
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-right">
          <span className="text-[11px] text-slate-400 font-medium block">Model Intercept (β₀)</span>
          <span className="text-xl font-black text-emerald-400 font-mono block">
            {data.intercept > 0 ? `+${data.intercept.toFixed(4)}` : data.intercept.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Coefficients Horizontal Bar Chart */}
      <div className="p-5 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Standardized Feature Weights (β Coefficients)
          </h3>
          <p className="text-[11px] text-slate-400">
            Positive β values increase the log-odds of elevated pollution risk; negative β values decrease log-odds.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" fontSize={10} domain={[-3, 6]} />
              <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={10} width={90} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                formatter={(val, name) => [val, 'Beta Weight (β)']}
              />
              <ReferenceLine x={0} stroke="#475569" strokeWidth={1} />
              <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.coefficient >= 0 ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complete Coefficients & Odds Ratios Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Feature Attribution & Odds Ratio Multipliers
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-3 text-right">Coefficient (β)</th>
                <th className="py-3 px-3 text-right">Odds Ratio [exp(β)]</th>
                <th className="py-3 px-4">Directional Impact</th>
                <th className="py-3 px-4">Atmospheric Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
              {(data.coefficients || []).map((c, i) => {
                const isPos = c.coefficient >= 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-4 font-sans font-bold text-white uppercase">{c.feature}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isPos ? 'text-red-400' : 'text-blue-400'}`}>
                      {c.coefficient > 0 ? `+${c.coefficient.toFixed(4)}` : c.coefficient.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {c.odds_ratio.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      {isPos ? (
                        <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[10px]">
                          <TrendingUp className="w-3 h-3" />
                          Increases Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-400 font-semibold text-[10px]">
                          <TrendingDown className="w-3 h-3" />
                          Decreases Risk
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">
                      {c.feature === 'co'
                        ? 'Tracer of heavy fossil fuel combustion and vehicular traffic.'
                        : c.feature === 'pm25'
                        ? 'Dominant respirable toxic fine particles penetrating deep lung tissue.'
                        : c.feature === 'pm10'
                        ? 'Coarse dust and crustal matter causing upper respiratory distress.'
                        : c.feature === 'nox'
                        ? 'Reactive nitrogen oxides accelerating secondary photochemical smog.'
                        : c.feature === 'o3'
                        ? 'Secondary summer oxidant formed via sunlight and VOC interactions.'
                        : 'Atmospheric temporal or chemical compound indicator.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
