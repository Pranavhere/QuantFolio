import React from 'react';
import { Navigate } from 'react-router-dom';

// Layout
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth pages
import Login from './components/User/Login';
import Register from './components/User/Register';

// Main app pages
import Dashboard from './components/Dashboard/Dashboard';
import PortfolioList from './components/Portfolio/PortfolioList';
import PortfolioDetail from './components/Portfolio/PortfolioDetail';
import TradingInterface from './components/Trading/TradingInterface';
import OrderHistory from './components/Trading/OrderHistory';
import TradeHistory from './components/Trading/TradeHistory';
import MarketOverview from './components/Visualizations/MarketOverview';
import StockDetail from './components/Visualizations/StockDetail';
import PortfolioAnalytics from './components/Visualizations/PortfolioAnalytics';
import UserProfile from './components/User/Profile';
import NotFound from './components/NotFound';

// Private route wrapper
import PrivateRoute from './components/PrivateRoute';

const routes = [
  {
    path: 'auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '', element: <Navigate to="/auth/login" /> },
    ],
  },
  {
    path: '',
    element: <PrivateRoute component={MainLayout} />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'portfolios', element: <PrivateRoute><PortfolioList /></PrivateRoute> },
      { path: 'portfolios/:id', element: <PrivateRoute><PortfolioDetail /></PrivateRoute> },
      { path: 'trading', element: <TradingInterface /> },
      { path: 'orders', element: <OrderHistory /> },
      { path: 'trades', element: <TradeHistory /> },
      { path: 'market', element: <MarketOverview /> },
      { path: 'market/:symbol', element: <StockDetail /> },
      { path: 'analytics/:id', element: <PortfolioAnalytics /> },
      { path: 'profile', element: <UserProfile /> },
      { path: '404', element: <NotFound /> },
      { path: '', element: <Navigate to="/dashboard" /> },
      { path: '*', element: <Navigate to="/404" /> },
    ],
  },
];

export default routes; 