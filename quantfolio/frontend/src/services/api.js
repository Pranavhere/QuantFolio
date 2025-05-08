import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Portfolio API
export const portfolioAPI = {
  getAll: () => api.get('/portfolio'),
  getOne: (id) => api.get(`/portfolio/${id}`),
  create: (data) => api.post('/portfolio', data),
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  delete: (id) => api.delete(`/portfolio/${id}`),
  getPerformance: (id) => api.get(`/portfolio/${id}/performance`),
  getAssets: (id) => api.get(`/portfolio/${id}/assets`),
};

// Asset API
export const assetAPI = {
  getAll: (portfolioId) => api.get(`/portfolio/${portfolioId}/assets`),
  getOne: (portfolioId, id) => api.get(`/portfolio/${portfolioId}/assets/${id}`),
  add: (portfolioId, data) => api.post(`/portfolio/${portfolioId}/assets`, data),
  update: (portfolioId, id, data) => api.put(`/portfolio/${portfolioId}/assets/${id}`, data),
  remove: (portfolioId, id) => api.delete(`/portfolio/${portfolioId}/assets/${id}`),
  updatePrices: (portfolioId, updates) => api.put(`/portfolio/${portfolioId}/assets/update-prices`, { updates }),
};

// Trade API
export const tradeAPI = {
  getAll: (portfolioId) => api.get(`/portfolio/${portfolioId}/trades`),
  getOne: (portfolioId, id) => api.get(`/portfolio/${portfolioId}/trades/${id}`),
  create: (portfolioId, data) => api.post(`/portfolio/${portfolioId}/trades`, data),
  update: (portfolioId, id, data) => api.put(`/portfolio/${portfolioId}/trades/${id}`, data),
  delete: (portfolioId, id) => api.delete(`/portfolio/${portfolioId}/trades/${id}`),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Market Data API
export const marketDataAPI = {
  getHistoricalData: (symbol, timeframe) => api.get(`/data/historical/${symbol}`, { params: { timeframe } }),
  getRealTimeData: (symbol) => api.get(`/data/realtime/${symbol}`),
  getIndicators: (symbol, indicators) => api.get(`/data/indicators/${symbol}`, { params: { indicators } }),
};

export default api; 