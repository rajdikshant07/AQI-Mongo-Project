import axios from 'axios';

// Base API configuration (proxied to http://localhost:5000 by Vite)
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor to unwrap data
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'API request failed';
    console.error('[AirGuard API Error]:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export const airguardApi = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Dashboard Telemetry
  getDashboardStats: () => apiClient.get('/dashboard/stats'),

  // Environmental Analytics
  getCityRankings: (limit = 15) => apiClient.get(`/analytics/rankings?limit=${limit}`),
  getTrends: () => apiClient.get('/analytics/trends'),
  getCorrelations: () => apiClient.get('/analytics/correlations'),

  // Stations & Geospatial
  getStations: () => apiClient.get('/stations'),
  getNearestStations: (lat, lon, maxDist = 100000) =>
    apiClient.get(`/stations/nearest?lat=${lat}&lon=${lon}&max_distance_meters=${maxDist}`),

  // Dataset Explorer
  getDatasetRecords: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.city) query.append('city', params.city);
    if (params.risk !== undefined && params.risk !== '') query.append('risk', params.risk);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return apiClient.get(`/dataset/records?${query.toString()}`);
  },

  // Machine Learning Prediction
  predictRisk: (payload) => apiClient.post('/predict', payload),

  // Prediction History
  getPredictionHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.risk !== undefined && params.risk !== '') query.append('risk', params.risk);
    if (params.model) query.append('model', params.model);
    return apiClient.get(`/predictions/history?${query.toString()}`);
  },
  deletePrediction: (id) => apiClient.delete(`/predictions/history/${id}`),

  // Model Evaluation & Comparison
  getModelComparison: () => apiClient.get('/models/comparison'),
  getModelCoefficients: () => apiClient.get('/models/coefficients'),
  getModelHistory: () => apiClient.get('/models/history'),
};

export default airguardApi;
