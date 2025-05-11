import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip,
  IconButton,
  Button,
  Alert,
  useTheme,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Article as NewsIcon,
  SignalCellularAlt as SignalIcon,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const API_BASE_URL = 'http://localhost:5000/';

const MarketOverview = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [technicalSignals, setTechnicalSignals] = useState(null);
  
  // Fetch market data
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fetch technical signals when a symbol is selected
  useEffect(() => {
    if (selectedSymbol) {
      fetchTechnicalSignals(selectedSymbol);
    }
  }, [selectedSymbol]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [marketSummary, symbols] = await Promise.all([
        axios.get(`${API_BASE_URL}/market-summary`),
        axios.get(`${API_BASE_URL}/symbols`)
      ]);
      
      setMarketData({
        market_summary: marketSummary.data,
        symbols: symbols.data,
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data. Please try again.');
      setLoading(false);
    }
  };
  
  const fetchTechnicalSignals = async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/signals/${symbol}`);
      setTechnicalSignals(response.data);
    } catch (err) {
      console.error('Error fetching technical signals:', err);
    }
  };
  
  // Format utilities
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Generate chart data
  const getMarketChartData = () => {
    if (!marketData || !marketData.market_summary) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    return {
      labels: marketData.market_summary.map(stock => stock.symbol),
      datasets: [
        {
          label: 'Price Range',
          data: marketData.market_summary.map(stock => stock.price_range),
          backgroundColor: theme.palette.primary.main,
        },
      ],
    };
  };
  
  const getTechnicalChartData = () => {
    if (!technicalSignals) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    return {
      labels: ['RSI', 'MACD', 'MA', 'Bollinger', 'ADX', 'Stochastic'],
      datasets: [
        {
          label: 'Signal Strength',
          data: [
            technicalSignals.rsi_signal === 'overbought' ? 1 : technicalSignals.rsi_signal === 'oversold' ? -1 : 0,
            technicalSignals.macd_signal === 'bullish' ? 1 : technicalSignals.macd_signal === 'bearish' ? -1 : 0,
            technicalSignals.ma_signal === 'golden_cross' ? 1 : technicalSignals.ma_signal === 'death_cross' ? -1 : 0,
            technicalSignals.bollinger_signal === 'upper_break' ? 1 : technicalSignals.bollinger_signal === 'lower_break' ? -1 : 0,
            technicalSignals.trend_direction === 'bullish' ? 1 : technicalSignals.trend_direction === 'bearish' ? -1 : 0,
            technicalSignals.stoch_signal === 'overbought' ? 1 : technicalSignals.stoch_signal === 'oversold' ? -1 : 0,
          ],
          backgroundColor: theme.palette.secondary.main,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
  };
  
  const technicalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          callback: function(value) {
            return value === 1 ? 'Bullish' : value === -1 ? 'Bearish' : 'Neutral';
          }
        }
      }
    },
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!marketData) {
    return (
      <Box p={3}>
        <Typography>No market data available.</Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={fetchData}
          sx={{ mt: 2 }}
        >
          Refresh
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Market Overview
          </Typography>
          <IconButton onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Last updated: {formatDateTime(marketData.timestamp)}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {marketData.market_summary.map((stock) => (
            <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
              <Card 
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setSelectedSymbol(stock.symbol)}
              >
                <CardContent>
                  <Typography variant="h6" component="div">
                    {stock.symbol}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ my: 1 }}>
                    {formatCurrency(stock.current_price)}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {stock.avg_change_percent >= 0 ? (
                      <TrendingUpIcon fontSize="small" color="success" />
                    ) : (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    <Typography
                      variant="body1"
                      color={stock.avg_change_percent >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {formatPercent(stock.avg_change_percent)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Volume: {formatNumber(stock.total_volume)}
                  </Typography>
                  {stock.macd_signal && (
                    <Chip
                      size="small"
                      label={stock.macd_signal}
                      color={stock.macd_signal === 'bullish' ? 'success' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box height={300} mb={4}>
          <Typography variant="h6" gutterBottom>
            Price Ranges
          </Typography>
          <Bar data={getMarketChartData()} options={chartOptions} />
        </Box>
        
        {selectedSymbol && technicalSignals && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Technical Analysis: {selectedSymbol}
        </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box height={300}>
                  <Bar data={getTechnicalChartData()} options={technicalChartOptions} />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Signal Summary
                </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <SignalIcon color={technicalSignals.recommendation === 'buy' ? 'success' : technicalSignals.recommendation === 'sell' ? 'error' : 'default'} />
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        Recommendation: {technicalSignals.recommendation.toUpperCase()}
                </Typography>
                    </Box>
                <Typography variant="body2" color="text.secondary">
                      Trend: {technicalSignals.trend_direction}
                </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Strength: {technicalSignals.trend_strength}
                </Typography>
                    <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                        Signal Strength:
                </Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Chip
                          size="small"
                          label={`Bullish: ${technicalSignals.signal_strength.bullish}`}
                          color="success"
                        />
                        <Chip
                          size="small"
                          label={`Bearish: ${technicalSignals.signal_strength.bearish}`}
                          color="error"
                        />
                      </Box>
                    </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
            </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Top Gainers" />
          <Tab label="Top Losers" />
          <Tab label="Latest News" />
        </Tabs>
        
        {/* Top Gainers */}
        {tabValue === 0 && (
          <List>
            {marketData.top_gainers.map((stock) => (
              <ListItem
                key={stock.symbol}
                button
                onClick={() => navigate(`/market/${stock.symbol}`)}
                divider
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <ChartIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${stock.symbol}: ${stock.name}`}
                  secondary={formatCurrency(stock.price)}
                />
                <Chip
                  label={formatPercent(stock.change_percent)}
                  color="success"
                  size="small"
                />
              </ListItem>
            ))}
            <Box textAlign="center" p={1}>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/market/gainers')}
              >
                View All Gainers
              </Button>
            </Box>
          </List>
        )}
        
        {/* Top Losers */}
        {tabValue === 1 && (
          <List>
            {marketData.top_losers.map((stock) => (
              <ListItem
                key={stock.symbol}
                button
                onClick={() => navigate(`/market/${stock.symbol}`)}
                divider
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'error.light' }}>
                    <ChartIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${stock.symbol}: ${stock.name}`}
                  secondary={formatCurrency(stock.price)}
                />
                <Chip
                  label={formatPercent(stock.change_percent)}
                  color="error"
                  size="small"
                />
              </ListItem>
            ))}
            <Box textAlign="center" p={1}>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/market/losers')}
              >
                View All Losers
              </Button>
            </Box>
          </List>
        )}
        
        {/* Latest News */}
        {tabValue === 2 && (
          <List>
            {marketData.recent_news.map((news) => (
              <ListItem
                key={news.id}
                button
                component="a"
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                divider
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                    <NewsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={news.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {news.source}
                      </Typography>
                      {` - ${formatDateTime(news.published_at)}`}
                    </>
                  }
                />
                <Chip
                  label={news.sentiment > 0 ? 'Positive' : news.sentiment < 0 ? 'Negative' : 'Neutral'}
                  color={news.sentiment > 0 ? 'success' : news.sentiment < 0 ? 'error' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </ListItem>
            ))}
            <Box textAlign="center" p={1}>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/market/news')}
              >
                View All News
              </Button>
            </Box>
          </List>
        )}
      </Paper>
    </Box>
  );
};

MarketOverview.propTypes = {
  children: PropTypes.node
};

export default MarketOverview; 