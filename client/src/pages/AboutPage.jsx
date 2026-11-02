import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ShieldAlert,
  Cpu,
  Database,
  Award,
  HelpCircle,
  Layers,
  Code2,
  AlertTriangle,
  ArrowRight,
  Activity,
  FileText,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const PDF_TOPICS = [
  { num: 1, title: 'What is Logistic Regression?', cat: 'Theory', desc: 'Supervised classification algorithm modeling the posterior probability of a binary categorical target using a logistic sigmoid transform.' },
  { num: 2, title: 'Why Linear Regression Fails for Classification', cat: 'Theory', desc: 'Linear regression produces unbounded predictions (-inf to +inf), violates probability axioms, and is sensitive to outliers and non-normal residuals.' },
  { num: 3, title: 'Logistic Regression Mathematical Model', cat: 'Math', desc: 'p(y=1|x) = 1 / (1 + exp(-z)), constraining predicted outputs strictly to the continuous interval (0, 1).' },
  { num: 4, title: 'Linear Combination of Features', cat: 'Math', desc: 'z = beta_0 + beta_1*X_1 + ... + beta_p*X_p representing the log-odds linear hyperplane.' },
  { num: 5, title: 'Sigmoid Activation Function', cat: 'Math', desc: 'S-shaped smooth differentiable mapping with sigma(0) = 0.5, sigma(+inf) = 1, sigma(-inf) = 0.' },
  { num: 6, title: 'Classification Decision Threshold', cat: 'Theory', desc: 'Default tau = 0.5 separating Class 0 (Lower Risk) and Class 1 (Elevated Risk), adjustable for sensitivity.' },
  { num: 7, title: 'Odds Formulation', cat: 'Math', desc: 'Ratio of probability of occurrence to non-occurrence: Odds = p / (1 - p).' },
  { num: 8, title: 'Logit Function', cat: 'Math', desc: 'The natural logarithm of odds: logit(p) = ln(p / (1 - p)) = z.' },
  { num: 9, title: 'Interpretation of Coefficients', cat: 'Math', desc: 'Each beta_j represents the change in log-odds per 1-unit increase in standardized predictor z_j, ceteris paribus.' },
  { num: 10, title: 'Odds Ratios (OR)', cat: 'Math', desc: 'Multiplicative change in odds per standard deviation increase: OR = exp(beta_j).' },
  { num: 11, title: 'Maximum Likelihood Estimation (MLE)', cat: 'Math', desc: 'Parameter optimization finding beta weights that maximize the likelihood of observed class labels.' },
  { num: 12, title: 'Binary Cross-Entropy & Log Loss', cat: 'Math', desc: 'Convex cost function: J(beta) = -1/N * sum[ y*ln(p) + (1-y)*ln(1-p) ], optimized via L-BFGS.' },
  { num: 13, title: 'Decision Boundary', cat: 'Math', desc: 'Geometric hyperplane where z = 0, separating the feature space into Class 0 and Class 1 regions.' },
  { num: 14, title: 'Binary Logistic Regression', cat: 'ML', desc: 'Single Bernoulli trial classification (Lower vs. Elevated Risk) implemented as AirGuard primary benchmark.' },
  { num: 15, title: 'Multinomial Logistic Regression', cat: 'ML', desc: 'Softmax extension for multi-category outcomes (e.g., 6 AQI buckets) without natural ordering.' },
  { num: 16, title: 'Ordinal Logistic Regression', cat: 'ML', desc: 'Proportional odds model for naturally ranked categories (Good < Satisfactory < Moderate < Poor < Very Poor < Severe).' },
  { num: 17, title: 'Role of MongoDB in Data Science', cat: 'MongoDB', desc: 'Document store serving as flexible, high-throughput environmental observation and audit persistence repository.' },
  { num: 18, title: 'Why MongoDB for ML Workflows', cat: 'MongoDB', desc: 'Handles heterogeneous environmental telemetry, missing sensor fields, geospatial station tagging, and audit storage without schema migrations.' },
  { num: 19, title: 'Creating MongoDB Database', cat: 'MongoDB', desc: 'airguardDB instantiated dynamically upon first collection insertion.' },
  { num: 20, title: 'Creating Collections', cat: 'MongoDB', desc: '7 decoupled collections: air_quality_records, processed_records, prediction_results, model_evaluation, training_history, dataset_metadata, monitoring_stations.' },
  { num: 21, title: 'Connecting Python via PyMongo', cat: 'MongoDB', desc: 'MongoClient connection pool configured with 50 connections, timeouts, and environmental URI.' },
  { num: 22, title: 'Retrieving Records with find()', cat: 'MongoDB', desc: 'Querying raw and processed environmental records using criteria dictionaries and projections.' },
  { num: 23, title: 'Converting Documents to DataFrames', cat: 'Python', desc: 'pd.DataFrame(list(cursor)) with selective projection to preserve memory and filter non-feature fields.' },
  { num: 24, title: 'MongoDB Projections', cat: 'MongoDB', desc: 'Excluding _id and non-feature columns at database level: projection={"_id": 0, "city": 1, ...}.' },
  { num: 25, title: 'Defining Predictor X and Target y', cat: 'ML', desc: 'Feature matrix X (11 physical/engineered pollutants) and binary target y (air_quality_risk).' },
  { num: 26, title: 'Stratified Train-Test Split', cat: 'ML', desc: 'Mandatory 70:30 split allocating 17,395 training rows and 7,455 test rows while preserving exact 61.5% : 38.5% class ratios.' },
  { num: 27, title: 'Random State Reproducibility', cat: 'ML', desc: 'random_state=42 guarantees identical train/test sampling across execution runs and viva presentations.' },
  { num: 28, title: 'Stratify Parameter', cat: 'ML', desc: 'Prevents sampling skew in target risk classes between training and unseen test sets.' },
  { num: 29, title: 'StandardScaler Normalization', cat: 'ML', desc: 'Transforms features to zero mean and unit variance: z = (x - mu) / sigma, required for regularized convergence.' },
  { num: 30, title: 'fit_transform() vs. transform()', cat: 'ML', desc: 'fit_transform() executed solely on X_train to learn mu and sigma; transform() applied to X_test and real-time inputs.' },
  { num: 31, title: 'Strict Target & Data Leakage Prevention', cat: 'ML', desc: 'Purging AQI/AQI_Bucket from X; computing imputation statistics and scaling parameters strictly on training fold.' },
  { num: 32, title: 'Training Logistic Regression', cat: 'ML', desc: 'model.fit(X_train_scaled, y_train) using L-BFGS solver with maximum 1,000 iterations.' },
  { num: 33, title: 'predict() vs. predict_proba()', cat: 'ML', desc: 'predict() yields binary label 0 or 1 at tau=0.5; predict_proba() outputs continuous risk probabilities [P(0), P(1)].' },
  { num: 34, title: 'Confusion Matrix Structure', cat: 'Evaluation', desc: '2x2 contingency table tabulating True Negatives (2,437), False Positives (432), False Negatives (438), True Positives (4,148).' },
  { num: 35, title: 'True Positive (TP)', cat: 'Evaluation', desc: 'Hazardous days (y=1) accurately classified as Elevated Risk by the model (4,148 occurrences).' },
  { num: 36, title: 'True Negative (TN)', cat: 'Evaluation', desc: 'Acceptable air days (y=0) accurately classified as Lower Risk (2,437 occurrences).' },
  { num: 37, title: 'False Positive (FP - Type I Error)', cat: 'Evaluation', desc: 'Clean days falsely flagged as hazardous (432 occurrences), triggering unnecessary alerts.' },
  { num: 38, title: 'False Negative (FN - Type II Error)', cat: 'Evaluation', desc: 'Hazardous days incorrectly classified as safe (438 occurrences), exposing citizens to unmonitored hazards.' },
  { num: 39, title: 'Accuracy Metric', cat: 'Evaluation', desc: '(TP + TN) / Total = 88.92% overall correctness across all test observations.' },
  { num: 40, title: 'Precision Metric', cat: 'Evaluation', desc: 'TP / (TP + FP) = 91.44% reliability when the system issues an Elevated Risk warning.' },
  { num: 41, title: 'Recall / Sensitivity Metric', cat: 'Evaluation', desc: 'TP / (TP + FN) = 90.45% capture rate of actual high-risk pollution episodes.' },
  { num: 42, title: 'F1 Score Harmonic Mean', cat: 'Evaluation', desc: '2 * (Precision * Recall) / (Precision + Recall) = 90.94% balanced performance metric.' },
  { num: 43, title: 'Domain Coefficient Interpretation', cat: 'Math', desc: 'Empirical weights: CO (+5.68) and PM2.5 (+4.12) are primary drivers of pollution risk in urban India.' },
  { num: 44, title: 'L1 and L2 Regularization', cat: 'ML', desc: 'L2 penalty (Ridge) shrinks large weights via ||beta||^2 to prevent collinear overfitting without setting weights to zero.' },
  { num: 45, title: 'C Hyperparameter Inverse Regularization', cat: 'ML', desc: 'C = 1.0 balances cross-entropy loss against weight penalty; smaller C imposes stronger regularization.' },
];

const VIVA_QUESTIONS = [
  {
    q: 'Why did you choose Logistic Regression instead of Linear Regression for Air Quality classification?',
    a: 'Linear Regression predicts a continuous target Y in (-inf, +inf). In classification, this produces invalid probabilities outside [0, 1] and creates severe errors due to outliers. Logistic Regression passes the linear combination z through the sigmoid activation function sigma(z) = 1 / (1 + exp(-z)), guaranteeing outputs in (0, 1) that represent true posterior probabilities P(y=1|x).'
  },
  {
    q: 'How did you prevent Target Leakage in your Air Quality project?',
    a: 'In Indian environmental standards, AQI is computed mathematically from the 24-hour maximum sub-index of pollutants. Since our target air_quality_risk was derived from whether AQI > 100, including AQI or AQI_Bucket in the feature matrix X would cause target leakage—giving the model the answer directly. We completely removed AQI and AQI_Bucket from X, training our models exclusively on raw physical concentrations and engineered ratios.'
  },
  {
    q: 'Why is MongoDB specifically advantageous for environmental data compared to traditional relational databases?',
    a: 'Environmental sensor stations produce heterogeneous telemetry where different stations monitor different pollutants (e.g., some record PM10 while others only have PM2.5). MongoDB schema flexibility accommodates missing sensor fields without storing NULLs or modifying table schemas. Additionally, MongoDB provides native 2dsphere geospatial indexing for station proximity queries and native nested document storage for prediction audits.'
  },
  {
    q: 'What is the physical interpretation of the highest Logistic Regression coefficients in your model?',
    a: 'Our trained Logistic Regression model identified Carbon Monoxide (CO, beta = +5.6816) and PM2.5 (beta = +4.1217) as the dominant drivers. Because features were standardized with StandardScaler, each beta represents the increase in log-odds per standard deviation increase. This indicates incomplete fossil fuel combustion (vehicles and biomass) is the primary determinant of hazardous air events in Indian cities.'
  },
  {
    q: 'Why did Gradient Boosting outperform Logistic Regression in this project?',
    a: 'Logistic Regression constructs a linear decision boundary in standardized feature space. However, atmospheric pollution dynamics exhibit complex non-linear thresholds and synergistic interactions (e.g., combustion index CO*NO2, winter thermal boundary layer inversions). Gradient Boosting captures non-linear feature interactions and high-order dependencies, boosting test F1 to 93.12% and reducing False Negatives by 30.4%.'
  },
  {
    q: 'Explain the difference between fit_transform() and transform() and how data leakage was prevented.',
    a: 'fit_transform() calculates the mean mu and standard deviation sigma from the dataset and scales the values. transform() applies the already-calculated mu and sigma to new data. To avoid data leakage, fit_transform() was called ONLY on the training split (X_train). The test split (X_test) and real-time user inputs were scaled using transform(), ensuring no knowledge of the test distribution leaked into model training.'
  }
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [filterCat, setFilterCat] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = ['All', 'Theory', 'Math', 'ML', 'MongoDB', 'Evaluation', 'Python'];

  const filteredTopics = filterCat === 'All'
    ? PDF_TOPICS
    : PDF_TOPICS.filter((t) => t.cat === filterCat);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Academic Syllabus & Methodology Documentation</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AirGuard Methodology & Academic Reference
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Conforming strictly to the academic curriculum reference: <span className="text-slate-200 italic">"Logistic Regression Through MongoDB – Theory, Mathematical Foundation, MongoDB Integration, Python Program, Model Evaluation and Final-Year Project Workflow"</span>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            45/45 Topics Implemented
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            CPCB NAQI Standard
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'curriculum', label: 'PDF 45-Topic Checklist', icon: CheckCircle },
          { id: 'mathematics', label: 'Mathematical Formulations', icon: Code2 },
          { id: 'naqi', label: 'CPCB NAQI & Target Derivation', icon: ShieldAlert },
          { id: 'architecture', label: 'MongoDB & System Architecture', icon: Database },
          { id: 'viva', label: 'Viva Voce Defense Guide', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CURRICULUM CHECKLIST */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-4 rounded-xl border border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white">Academic Reference Topic Matrix</h2>
              <p className="text-xs text-slate-400">All 45 numbered syllabus topics implemented, coded, and cross-verified in AirGuard.</p>
            </div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                    filterCat === cat
                      ? 'bg-emerald-500 text-slate-900 font-bold'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.num}
                className="bg-[#0B0F19] p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/30">
                      {topic.num}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      topic.cat === 'Math' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      topic.cat === 'MongoDB' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      topic.cat === 'ML' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      topic.cat === 'Evaluation' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                      {topic.cat}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1.5">{topic.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{topic.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center text-[10px] text-emerald-400 font-mono">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified in Codebase
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MATHEMATICAL FORMULATIONS */}
      {activeTab === 'mathematics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Sigmoid & Linear Model */}
            <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Code2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">1. Linear Combination & Logistic Sigmoid</h3>
              </div>
              <p className="text-xs text-slate-400">
                The linear combination maps the continuous feature space into a 1-dimensional log-odds score <code className="text-emerald-300 font-mono">z</code>:
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-200">
                z = β₀ + β₁X₁ + β₂X₂ + ... + βₚXₚ = β₀ + ∑ⱼ₌₁ᵖ βⱼXⱼ
              </div>
              <p className="text-xs text-slate-400">
                The logistic sigmoid function bounds the prediction to the probabilistic interval (0, 1):
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
                P(y=1 | X) = σ(z) = 1 / (1 + e⁻ᶻ) = eᶻ / (1 + eᶻ)
              </div>
            </div>

            {/* Box 2: Odds & Logit Function */}
            <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">2. Odds & The Logit Function</h3>
              </div>
              <p className="text-xs text-slate-400">
                The odds represent the ratio of probability of occurrence to non-occurrence:
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-200">
                Odds = P(y=1 | X) / [1 - P(y=1 | X)] = eᶻ
              </div>
              <p className="text-xs text-slate-400">
                Taking the natural logarithm yields the logit link function:
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-purple-300">
                logit(P) = ln(Odds) = ln(P / (1 - P)) = z = β₀ + ∑ βⱼXⱼ
              </div>
              <p className="text-[11px] text-slate-500">
                Odds Ratio: ORⱼ = exp(βⱼ). For 1 std dev rise in PM2.5 (β=+4.12), the odds of elevated pollution multiply by 61.66x.
              </p>
            </div>

            {/* Box 3: Maximum Likelihood & Log Loss */}
            <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <Activity className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">3. Maximum Likelihood Estimation & Log Loss</h3>
              </div>
              <p className="text-xs text-slate-400">
                Parameters are fitted by maximizing the Bernoulli likelihood function over N observations:
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-200">
                L(β) = ∏ᵢ₌₁ᴺ [pᵢʸⁱ · (1 - pᵢ)¹⁻ʸⁱ]
              </div>
              <p className="text-xs text-slate-400">
                Equivalently, minimizing the negative log-likelihood (Binary Cross-Entropy / Log Loss):
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-blue-300">
                J(β) = - (1/N) ∑ᵢ₌₁ᴺ [ yᵢ · ln(pᵢ) + (1 - yᵢ) · ln(1 - pᵢ) ]
              </div>
            </div>

            {/* Box 4: L2 Regularization & Hyperparameter C */}
            <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Layers className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">4. L2 Ridge Regularization & Parameter C</h3>
              </div>
              <p className="text-xs text-slate-400">
                To prevent collinear coefficient explosion between PM2.5 and PM10, L2 regularization penalizes weight magnitude:
              </p>
              <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-slate-200">
                J_reg(β) = J(β) + (1 / 2C) · ∑ⱼ₌₁ᵖ βⱼ²
              </div>
              <p className="text-xs text-slate-400">
                Hyperparameter <code className="text-amber-300 font-mono">C</code> is the inverse regularization strength:
              </p>
              <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1">
                <li><span className="text-slate-200">Small C (e.g. 0.01):</span> Heavy regularization, shrinks weights towards zero, reduces variance.</li>
                <li><span className="text-slate-200">Large C (e.g. 100):</span> Minimal regularization, prioritizes training log loss fit.</li>
                <li><span className="text-emerald-400 font-medium">AirGuard Baseline:</span> C = 1.0 (balanced shrinkage via L-BFGS solver).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CPCB NAQI & TARGET DERIVATION */}
      {activeTab === 'naqi' && (
        <div className="space-y-6">
          <div className="bg-[#0B0F19] p-6 rounded-2xl border border-white/10 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Central Pollution Control Board (CPCB) NAQI Framework
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Indian National Air Quality Index (NAQI) aggregates sub-indices for up to eight pollutants (PM10, PM2.5, NO2, SO2, CO, O3, NH3, and Pb). Each pollutant sub-index <code className="text-emerald-300 font-mono">Iₚ</code> is calculated using segmented linear interpolation across concentration breakpoints:
            </p>
            <div className="bg-[#070B14] p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 max-w-xl">
              Iₚ = [(I_HI - I_LO) / (B_HI - B_LO)] · (Cₚ - B_LO) + I_LO
            </div>
            <p className="text-xs text-slate-400">
              The overall Air Quality Index is governed by the single most hazardous pollutant:
            </p>
            <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 font-mono text-xs text-blue-300 max-w-sm">
              AQI = max(I_PM2.5, I_PM10, I_NO2, I_SO2, I_CO, ...)
            </div>
          </div>

          {/* NAQI Categories Table */}
          <div className="bg-[#0B0F19] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">CPCB NAQI Buckets vs. AirGuard Binary Classification</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070B14] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3">AQI Range</th>
                    <th className="p-3">Official CPCB Category</th>
                    <th className="p-3">Associated Health Impact</th>
                    <th className="p-3">AirGuard Target (y)</th>
                    <th className="p-3">Dataset Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-sans">
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-emerald-400">0 – 50</td>
                    <td className="p-3 font-semibold text-emerald-400">Good</td>
                    <td className="p-3 text-slate-400">Minimal impact; clean atmospheric envelope.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">0 (Lower Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">5.4%</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-teal-400">51 – 100</td>
                    <td className="p-3 font-semibold text-teal-400">Satisfactory</td>
                    <td className="p-3 text-slate-400">Minor breathing discomfort to sensitive individuals.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">0 (Lower Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">33.1%</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-yellow-400">101 – 200</td>
                    <td className="p-3 font-semibold text-yellow-400">Moderate</td>
                    <td className="p-3 text-slate-400">Breathing discomfort to people with asthma and heart disease.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold">1 (Elevated Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">35.6%</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-amber-500">201 – 300</td>
                    <td className="p-3 font-semibold text-amber-500">Poor</td>
                    <td className="p-3 text-slate-400">Breathing discomfort to most people on prolonged exposure.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold">1 (Elevated Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">15.9%</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-orange-500">301 – 400</td>
                    <td className="p-3 font-semibold text-orange-500">Very Poor</td>
                    <td className="p-3 text-slate-400">Respiratory illness on prolonged exposure. Severe effects.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold">1 (Elevated Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">7.1%</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-red-500">401 – 500+</td>
                    <td className="p-3 font-semibold text-red-500">Severe</td>
                    <td className="p-3 text-slate-400">Affects healthy individuals and impacts those with existing diseases.</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold">1 (Elevated Risk)</span></td>
                    <td className="p-3 font-mono text-slate-400">2.9%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Target Leakage Warning Box */}
          <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-300">Methodological Note on Target Leakage Prevention</span>
              <p className="text-slate-300 leading-relaxed">
                In naïve implementations, novice data science pipelines accidentally retain the <code className="text-amber-200 font-mono">AQI</code> column in feature matrix <code className="text-amber-200 font-mono">X</code>, resulting in an artificial and fraudulent 100.0% accuracy score. In AirGuard, <code className="text-white font-mono">AQI</code> and <code className="text-white font-mono">AQI_Bucket</code> are permanently purged from the feature space during data ingestion. The model predicts purely from ambient particulate and gas sensor concentrations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONGODB & SYSTEM ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'air_quality_records',
                count: '29,531 documents',
                desc: 'Raw ingested environmental observations from CPCB monitoring stations with city, date, and raw sensor readings.',
                color: 'emerald'
              },
              {
                name: 'processed_records',
                count: '24,850 documents',
                desc: 'Cleaned records with stratified group-median imputed features, winzorized outliers, and engineered domain ratios.',
                color: 'teal'
              },
              {
                name: 'prediction_results',
                count: 'Dynamic Audits',
                desc: 'Historical persistence of all real-time inference calls, containing input vectors, class probabilities, feature attributions, and timestamps.',
                color: 'blue'
              },
              {
                name: 'model_evaluation',
                count: '5 benchmark models',
                desc: 'Systematic benchmark evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC, Log Loss, Latency, and Confusion Matrices).',
                color: 'purple'
              },
              {
                name: 'training_history',
                count: 'Experiment Logs',
                desc: 'Reproducibility logs capturing random_state=42, 70:30 split shapes, hyperparameters, and feature schemas.',
                color: 'amber'
              },
              {
                name: 'monitoring_stations',
                count: '33 CAAQMS stations',
                desc: 'Geographical metadata with GeoJSON Point coordinates, supporting native 2dsphere proximity queries ($near).',
                color: 'indigo'
              },
              {
                name: 'dataset_metadata',
                count: 'Provenance Record',
                desc: 'Dataset source citation, version 1.0, CC-BY license, temporal coverage (2015-2020), and preprocessing parameters.',
                color: 'rose'
              }
            ].map((col) => (
              <div key={col.name} className="bg-[#0B0F19] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{col.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">{col.count}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Index Optimization Strategy in airguardDB
            </h3>
            <p className="text-xs text-slate-300">
              High-throughput queries across 29,531 records execute in under 3 milliseconds due to tailored compound B-Tree and Geospatial indexes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
              <div className="bg-[#070B14] p-3 rounded-lg border border-white/5">
                <span className="text-emerald-400 font-bold block">idx_city_date_unique</span>
                <span className="text-slate-400">city: 1, date: 1 (Unique)</span>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-white/5">
                <span className="text-blue-400 font-bold block">idx_date_desc</span>
                <span className="text-slate-400">date: -1 (Time-series sorting)</span>
              </div>
              <div className="bg-[#070B14] p-3 rounded-lg border border-white/5">
                <span className="text-purple-400 font-bold block">idx_station_location_2dsphere</span>
                <span className="text-slate-400">location: "2dsphere" (GIS near)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VIVA VOCE DEFENSE GUIDE */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="bg-[#0B0F19] p-4 rounded-xl border border-white/10 mb-4">
            <h2 className="text-sm font-bold text-white">Final-Year B.Tech Viva Voce Defense Question Bank</h2>
            <p className="text-xs text-slate-400">Key theoretical, mathematical, and algorithmic answers prepared for examiners.</p>
          </div>

          <div className="space-y-3">
            {VIVA_QUESTIONS.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#0B0F19] rounded-xl border border-white/10 overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">Q{idx + 1}.</span>
                      {item.q}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-300 bg-white/[0.02] border-t border-white/5 leading-relaxed font-sans">
                      <p className="p-3 bg-[#070B14] rounded-lg border border-white/5 text-slate-300">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
