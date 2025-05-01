import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AddCircleOutline as AddIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { dataAPI } from '../../api/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [timeFrame, setTimeFrame] = useState('1d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeFrame]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await dataAPI.getStockDetails(symbol, { time_frame: timeFrame });
      setStock(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again.');
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatVolume = (value) => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toString();
  };

  const getChartData = () => {
    if (!stock || !stock.price_history) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: stock.price_history.map(point => new Date(point.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
      })),
      datasets: [
        {
          label: `${symbol} Price`,
          data: stock.price_history.map(point => point.price),
          borderColor: stock.change_percent >= 0 ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
          backgroundColor: stock.change_percent >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          tension: 0.1,
          fill: true,
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

  const handleTimeFrameChange = (event, newValue) => {
    setTimeFrame(newValue);
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
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={fetchStockData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/market')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {stock?.symbol} - {stock?.name}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={fetchStockData} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/trading', { state: { symbol: stock?.symbol } })}
          >
            Trade
          </Button>
        </Box>
      </Box>

      {/* Price Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h3" component="div">
                {formatCurrency(stock?.current_price || 0)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {stock?.change_percent >= 0 ? (
                  <TrendingUpIcon fontSize="medium" color="success" sx={{ mr: 1 }} />
                ) : (
                  <TrendingDownIcon fontSize="medium" color="error" sx={{ mr: 1 }} />
                )}
                <Typography
                  variant="h6"
                  color={stock?.change_percent >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(stock?.change || 0)} ({formatPercent(stock?.change_percent || 0)})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Last updated: {new Date(stock?.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Day Range
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(stock?.day_low)} - {formatCurrency(stock?.day_high)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  52 Week Range
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(stock?.year_low)} - {formatCurrency(stock?.year_high)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Volume
                </Typography>
                <Typography variant="body1">
                  {formatVolume(stock?.volume || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Market Cap
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(stock?.market_cap || 0)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Price Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={timeFrame} onChange={handleTimeFrameChange}>
            <Tab label="1 Day" value="1d" />
            <Tab label="1 Week" value="1w" />
            <Tab label="1 Month" value="1m" />
            <Tab label="3 Months" value="3m" />
            <Tab label="1 Year" value="1y" />
            <Tab label="5 Years" value="5y" />
          </Tabs>
        </Box>
        <Box height={400}>
          <Line data={getChartData()} options={chartOptions} />
        </Box>
      </Paper>

      {/* Company Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          About {stock?.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {stock?.description || 'No company description available.'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  PE Ratio
                </Typography>
                <Typography variant="h6">
                  {stock?.pe_ratio?.toFixed(2) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Dividend Yield
                </Typography>
                <Typography variant="h6">
                  {stock?.dividend_yield ? `${stock.dividend_yield.toFixed(2)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  52-Week High
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(stock?.year_high || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  52-Week Low
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(stock?.year_low || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

StockDetail.propTypes = {
  children: PropTypes.node
};

export default StockDetail; 