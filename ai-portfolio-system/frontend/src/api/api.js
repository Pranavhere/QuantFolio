import axios from 'axios';

// Set base URL from environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
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

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (expired token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
const authAPI = {
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/me', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.get('/auth/logout'),
};

// News API
const newsAPI = {
  getNews: (params) => api.get('/news', { params }),
  getNewsById: (id) => api.get(`/news/${id}`),
  searchNews: (query) => api.get('/news/search', { params: { q: query } }),
  getNewsByCategory: (category) => api.get(`/news/category/${category}`),
};

// Portfolio API (to be implemented with MongoDB)
const portfolioAPI = {
  getPortfolios: () => api.get('/portfolio'),
  getPortfolioById: (id) => api.get(`/portfolio/${id}`),
  createPortfolio: (portfolioData) => api.post('/portfolio', portfolioData),
  updatePortfolio: (id, portfolioData) => api.put(`/portfolio/${id}`, portfolioData),
  deletePortfolio: (id) => api.delete(`/portfolio/${id}`),
  addAsset: (portfolioId, assetData) => api.post(`/portfolio/${portfolioId}/assets`, assetData),
  removeAsset: (portfolioId, symbol) => api.delete(`/portfolio/${portfolioId}/assets/${symbol}`),
};

// Trading API (to be implemented with MongoDB)
const tradingAPI = {
  getOrders: (params) => api.get('/trading/orders', { params }),
  getOrderById: (id) => api.get(`/trading/orders/${id}`),
  createOrder: (orderData) => api.post('/trading/orders', orderData),
  cancelOrder: (id) => api.delete(`/trading/orders/${id}`),
  getTrades: (params) => api.get('/trading/trades', { params }),
  getQuote: (symbol) => api.get(`/trading/quotes/${symbol}`),
};

// Analytics API (to be implemented with MongoDB)
const analyticsAPI = {
  getMarketData: (symbol, days) => api.get(`/analytics/market/${symbol}`, { params: { days } }),
  getPortfolioPerformance: (portfolioId, days) => 
    api.get(`/analytics/portfolio/${portfolioId}/performance`, { params: { days } }),
  getPortfolioAllocation: (portfolioId) => api.get(`/analytics/portfolio/${portfolioId}/allocation`),
  getPortfolioRisk: (portfolioId) => api.get(`/analytics/portfolio/${portfolioId}/risk`),
  getAssetCorrelation: (portfolioId) => api.get(`/analytics/portfolio/${portfolioId}/correlation`),
  getPortfolioOptimization: (portfolioId, riskTolerance) => 
    api.get(`/analytics/portfolio/${portfolioId}/optimization`, { params: { risk_tolerance: riskTolerance } }),
};

// Market Data API (to be implemented with MongoDB)
const dataAPI = {
  getStocks: () => api.get('/data/stocks'),
  getStockDetails: (symbol) => api.get(`/data/stocks/${symbol}`),
  getIndices: () => api.get('/data/indices'),
  getNews: (params) => newsAPI.getNews(params), // Use the news API we created
  getEconomicIndicators: () => api.get('/data/economic-indicators'),
  getMarketSummary: () => api.get('/data/market-summary'),
};

export { authAPI, portfolioAPI, tradingAPI, analyticsAPI, dataAPI, newsAPI }; 