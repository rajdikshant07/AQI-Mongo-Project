import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// AirGuard Application Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MonitoringPage from './pages/MonitoringPage';
import GeographicalExplorerPage from './pages/GeographicalExplorerPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PredictionPage from './pages/PredictionPage';
import MachineLearningLabPage from './pages/MachineLearningLabPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import FeatureAnalysisPage from './pages/FeatureAnalysisPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Hero Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Shell with Nested Operational & Analytical Views */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/map" element={<GeographicalExplorerPage />} />
          <Route path="/dataset" element={<DatasetExplorerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/predict" element={<PredictionPage />} />
          <Route path="/ml-lab" element={<MachineLearningLabPage />} />
          <Route path="/evaluation" element={<ModelEvaluationPage />} />
          <Route path="/features" element={<FeatureAnalysisPage />} />
          <Route path="/history" element={<PredictionHistoryPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
