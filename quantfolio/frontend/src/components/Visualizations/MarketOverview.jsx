import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
// Import API
import { dataAPI } from '../../api/api';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ChartIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Article as NewsIcon,
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);



const MarketOverview = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch market data
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dataAPI.getMarketSummary();
      setMarketData(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data. Please try again.');
      setLoading(false);
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
    if (!marketData || !marketData.market_indices) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    return {
      labels: marketData.market_indices.map(index => index.symbol),
      datasets: [
        {
          label: 'Change Percent',
          data: marketData.market_indices.map(index => index.change_percent),
          backgroundColor: marketData.market_indices.map(index => 
            index.change_percent >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
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
            return formatPercent(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatPercent(value);
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
          {marketData.market_indices.map((index) => (
            <Grid item xs={12} sm={6} md={4} key={index.symbol}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" component="div">
                    {index.name}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ my: 1 }}>
                    {formatNumber(index.price)}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {index.change_percent >= 0 ? (
                      <TrendingUpIcon fontSize="small" color="success" />
                    ) : (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    <Typography
                      variant="body1"
                      color={index.change_percent >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {formatNumber(index.change)} ({formatPercent(index.change_percent)})
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box height={300} mb={4}>
          <Typography variant="h6" gutterBottom>
            Market Performance
          </Typography>
          <Bar data={getMarketChartData()} options={chartOptions} />
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          Market Breadth
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Advancing
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatNumber(marketData.market_breadth.advancing)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Declining
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatNumber(marketData.market_breadth.declining)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Unchanged
                </Typography>
                <Typography variant="h6">
                  {formatNumber(marketData.market_breadth.unchanged)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Typography variant="subtitle1" gutterBottom>
          Trading Volume
        </Typography>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">
              {marketData.trading_volume.value} {marketData.trading_volume.unit}
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography
                variant="body2"
                color={marketData.trading_volume.change_percent >= 0 ? 'success.main' : 'error.main'}
              >
                {formatPercent(marketData.trading_volume.change_percent)} from previous day
              </Typography>
            </Box>
          </CardContent>
        </Card>
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