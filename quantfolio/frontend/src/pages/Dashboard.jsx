import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  IconButton,
  Alert,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Visibility as ShowIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as PortfolioIcon,
  Timeline as TimelineIcon,
  SwapHoriz as TradeIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Import API services
import { portfolioAPI, dataAPI, tradingAPI } from '../api/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data (would be replaced with real API calls)
const mockPortfolioSummary = {
  totalValue: 158634.25,
  dailyChange: 2345.67,
  dailyChangePercent: 1.5,
  portfolios: [
    {
      id: 1,
      name: 'Growth Portfolio',
      value: 98567.89,
      change: 1876.54,
      changePercent: 1.94,
    },
    {
      id: 2,
      name: 'Dividend Portfolio',
      value: 60066.36,
      change: 469.13,
      changePercent: 0.79,
    },
  ],
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'trade',
    action: 'Buy',
    symbol: 'AAPL',
    quantity: 10,
    price: 170.25,
    timestamp: new Date(Date.now() - 15 * 60000),
  },
  {
    id: 2,
    type: 'deposit',
    amount: 5000,
    status: 'completed',
    timestamp: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: 3,
    type: 'trade',
    action: 'Sell',
    symbol: 'TSLA',
    quantity: 5,
    price: 750.50,
    timestamp: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: 4,
    type: 'alert',
    message: 'MSFT price target reached ($280)',
    timestamp: new Date(Date.now() - 8 * 3600000),
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState(mockPortfolioSummary);
  const [marketSummary, setMarketSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [error, setError] = useState(null);
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch market summary
        const marketResponse = await dataAPI.getMarketSummary();
        setMarketSummary(marketResponse.data.data || marketResponse.data);
        
        // Real implementation would also fetch portfolio data
        // const portfolioResponse = await portfolioAPI.getPortfolios();
        // setPortfolioSummary(processPortfolioData(portfolioResponse.data));
        
        // and recent activity
        // const activityResponse = await activityAPI.getRecentActivity();
        // setRecentActivity(activityResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Format dollar amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  // Format percent changes
  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };
  
  // Format datetime
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };
  
  // Generate portfolio performance chart data
  const generatePortfolioChartData = () => {
    const labels = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const baseValue = 100000;
    const data = labels.map((_, index) => {
      // Generate some realistic looking data with an upward trend
      const dayValue = baseValue * (1 + 0.001 * index) + (Math.random() - 0.4) * 1000;
      return dayValue;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data,
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`, // Semi-transparent
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };
  
  // Generate market chart data
  const generateMarketChartData = () => {
    const labels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'S&P 500',
          data: [4200, 4185, 4220, 4250, 4270, 4290, 4300],
          backgroundColor: theme.palette.primary.main,
        },
        {
          label: 'NASDAQ',
          data: [14100, 14000, 14200, 14350, 14500, 14600, 14650],
          backgroundColor: theme.palette.secondary.main,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
    maintainAspectRatio: false,
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
    maintainAspectRatio: false,
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Welcome message */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome to your Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Monitor your portfolio performance, track investments, and stay updated with market trends.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/portfolios/create')}
              >
                New Portfolio
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Portfolio summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Portfolio Summary
              </Typography>
              <IconButton size="small" onClick={() => setLoading(true)}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Typography variant="h4" component="div" gutterBottom>
              {formatCurrency(portfolioSummary.totalValue)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                icon={portfolioSummary.dailyChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${formatCurrency(portfolioSummary.dailyChange)} (${formatPercent(portfolioSummary.dailyChangePercent)})`}
                color={portfolioSummary.dailyChange >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
              <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
                Today
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Your Portfolios
            </Typography>
            
            <List disablePadding>
              {portfolioSummary.portfolios.map((portfolio) => (
                <ListItem
                  key={portfolio.id}
                  disablePadding
                  sx={{ py: 1, cursor: 'pointer' }}
                  onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: portfolio.changePercent >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      <PortfolioIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={portfolio.name}
                    secondary={formatCurrency(portfolio.value)}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                  <Typography
                    variant="body2"
                    color={portfolio.changePercent >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercent(portfolio.changePercent)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/portfolios')}
            >
              View All Portfolios
            </Button>
          </Paper>
        </Grid>
        
        {/* Portfolio performance chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Portfolio Performance
              </Typography>
              <Box>
                <Button size="small">1M</Button>
                <Button size="small">3M</Button>
                <Button size="small" variant="contained" disableElevation>1Y</Button>
                <Button size="small">All</Button>
              </Box>
            </Box>
            
            <Box sx={{ height: 300 }}>
              <Line data={generatePortfolioChartData()} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Market overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Market Overview
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/market')}
              >
                View More
              </Button>
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Market indices */}
              {marketSummary && Object.entries(marketSummary.indices).map(([key, index]) => (
                <Grid item xs={12} sm={4} key={key}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {key.toUpperCase()}
                      </Typography>
                      <Typography variant="h6">
                        {index.value.toFixed(2)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {index.changePercent >= 0 ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                        <Typography
                          variant="body2"
                          color={index.changePercent >= 0 ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5 }}
                        >
                          {formatPercent(index.changePercent)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ height: 250, mt: 3 }}>
              <Bar data={generateMarketChartData()} options={barChartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Activity
            </Typography>
            
            <List>
              {recentActivity.map((activity) => (
                <ListItem
                  key={activity.id}
                  disablePadding
                  sx={{
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: 
                          activity.type === 'trade' 
                            ? activity.action === 'Buy' 
                              ? 'success.light' 
                              : 'error.light'
                            : activity.type === 'deposit'
                              ? 'primary.light'
                              : 'warning.light',
                      }}
                    >
                      {activity.type === 'trade' ? (
                        <TradeIcon />
                      ) : activity.type === 'deposit' ? (
                        <PortfolioIcon />
                      ) : (
                        <NotificationIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      activity.type === 'trade'
                        ? `${activity.action} ${activity.quantity} ${activity.symbol} @ ${formatCurrency(activity.price)}`
                        : activity.type === 'deposit'
                          ? `Deposited ${formatCurrency(activity.amount)}`
                          : activity.message
                    }
                    secondary={formatTime(activity.timestamp)}
                  />
                </ListItem>
              ))}
            </List>
            
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/activity')}
            >
              View All Activity
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

Dashboard.propTypes = {
  children: PropTypes.node
};

export default Dashboard; 