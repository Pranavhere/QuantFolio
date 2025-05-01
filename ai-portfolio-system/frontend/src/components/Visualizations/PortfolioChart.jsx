import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton, 
  Stack,
  useTheme,
  CircularProgress
} from '@mui/material';
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
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PortfolioChart = ({ 
  portfolioData, 
  title = 'Portfolio Performance', 
  loading = false,
  error = null,
  height = 400,
  showControls = true,
  defaultRange = '1M'
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState(defaultRange);
  
  // Time range options
  const timeRanges = [
    { value: '1W', label: '1W', days: 7 },
    { value: '1M', label: '1M', days: 30 },
    { value: '3M', label: '3M', days: 90 },
    { value: '6M', label: '6M', days: 180 },
    { value: '1Y', label: '1Y', days: 365 },
    { value: 'All', label: 'All', days: null },
  ];
  
  // Handle time range change
  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Filter data by time range
  const getFilteredData = () => {
    if (!portfolioData || !portfolioData.length) {
      return null;
    }
    
    const range = timeRanges.find(r => r.value === timeRange);
    
    // If "All" is selected or no range is found, return all data
    if (timeRange === 'All' || !range) {
      return portfolioData;
    }
    
    // Filter data based on days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - range.days);
    
    return portfolioData.filter(item => {
      const date = new Date(item.date);
      return date >= cutoffDate;
    });
  };
  
  // Generate chart data
  const getChartData = () => {
    const data = getFilteredData();
    
    if (!data) {
      return {
        labels: [],
        datasets: [{
          label: 'Value',
          data: [],
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          tension: 0.3,
          fill: true,
        }]
      };
    }
    
    return {
      labels: data.map(item => item.date),
      datasets: [{
        label: 'Portfolio Value',
        data: data.map(item => item.value),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.3,
        fill: true,
      }]
    };
  };
  
  // Chart options
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
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        }
      },
      y: {
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };
  
  // Calculate metrics
  const calculateMetrics = () => {
    const data = getFilteredData();
    
    if (!data || data.length < 2) {
      return {
        startValue: 0,
        endValue: 0,
        changeValue: 0,
        changePercent: 0,
      };
    }
    
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const changeValue = endValue - startValue;
    const changePercent = (changeValue / startValue) * 100;
    
    return {
      startValue,
      endValue,
      changeValue,
      changePercent,
    };
  };
  
  const metrics = calculateMetrics();
  const isPositiveChange = metrics.changeValue >= 0;
  
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          
          {showControls && (
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              size="small"
            >
              {timeRanges.map((range) => (
                <ToggleButton key={range.value} value={range.value}>
                  {range.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Box>
        
        <Stack direction="row" spacing={4} mb={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Value
            </Typography>
            <Typography variant="h5">
              {formatCurrency(metrics.endValue)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              {timeRange} Change
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="h5"
                color={isPositiveChange ? 'success.main' : 'error.main'}
              >
                {isPositiveChange ? '+' : ''}{formatCurrency(metrics.changeValue)}
              </Typography>
              <Typography
                variant="body2"
                color={isPositiveChange ? 'success.main' : 'error.main'}
              >
                ({isPositiveChange ? '+' : ''}{metrics.changePercent.toFixed(2)}%)
              </Typography>
            </Stack>
          </Box>
        </Stack>
        
        <Box height={height}>
          <Line data={getChartData()} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PortfolioChart; 