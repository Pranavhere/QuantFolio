import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
// Import API services
import { portfolioAPI, dataAPI, tradingAPI } from '../../api/api';
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
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
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
        try {
          const marketResponse = await dataAPI.getMarketSummary();
          if (marketResponse.data) {
            setMarketSummary(marketResponse.data);
          } else {
            throw new Error('Invalid market response');
          }
        } catch (marketErr) {
          console.error('Using mock market data due to error:', marketErr);
          // Generate mock market summary if API fails
          setMarketSummary({
            timestamp: new Date(),
            market_indices: [
              {
                symbol: 'NIFTY 50',
                name: 'NIFTY 50',
                price: 22450.25,
                change: 125.75,
                change_percent: 0.56
              },
              {
                symbol: 'SENSEX',
                name: 'BSE SENSEX',
                price: 73765.35,
                change: 405.15,
                change_percent: 0.55
              },
              {
                symbol: 'NIFTY BANK',
                name: 'NIFTY BANK',
                price: 48752.60,
                change: -55.20,
                change_percent: -0.11
              }
            ],
            market_breadth: {
              advancing: 1245,
              declining: 876,
              unchanged: 102
            },
            trading_volume: {
              value: 5.8,
              unit: 'Billion Shares',
              change_percent: 7.4
            },
            top_gainers: [
              {
                symbol: 'ADANIENT',
                company_name: 'Adani Enterprises',
                price: 2856.50,
                change: 145.30,
                change_percent: 5.36
              },
              {
                symbol: 'TATAMOTORS',
                company_name: 'Tata Motors',
                price: 968.45,
                change: 34.25,
                change_percent: 3.67
              },
              {
                symbol: 'HCLTECH',
                company_name: 'HCL Technologies',
                price: 1487.25,
                change: 36.50,
                change_percent: 2.52
              }
            ],
            top_losers: [
              {
                symbol: 'BAJFINANCE',
                company_name: 'Bajaj Finance',
                price: 6842.75,
                change: -112.45,
                change_percent: -1.62
              },
              {
                symbol: 'SUNPHARMA',
                company_name: 'Sun Pharmaceutical',
                price: 1324.60,
                change: -18.75,
                change_percent: -1.40
              },
              {
                symbol: 'HINDUNILVR',
                company_name: 'Hindustan Unilever',
                price: 2564.85,
                change: -32.15,
                change_percent: -1.24
              }
            ]
          });
        }
        
        // Use mock portfolio data
        setPortfolioSummary(mockPortfolioSummary);
        
        // Use mock activity data
        setRecentActivity(mockRecentActivity);
        
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
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: theme.palette.primary.main,
          pointHoverBackgroundColor: theme.palette.primary.main,
          pointBorderColor: theme.palette.background.paper,
          pointHoverBorderColor: theme.palette.background.paper,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          borderWidth: 2,
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
          borderRadius: 4,
          barThickness: 12,
        },
        {
          label: 'NASDAQ',
          data: [14100, 14000, 14200, 14350, 14500, 14600, 14650],
          backgroundColor: theme.palette.secondary.main,
          borderRadius: 4,
          barThickness: 12,
        },
      ],
    };
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: {
          family: theme.typography.fontFamily,
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          family: '"Roboto Mono", monospace',
          size: 12,
        },
        callbacks: {
          label: function(context) {
            return `Value: ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: '"Roboto Mono", monospace',
            size: 11,
          },
          callback: (value) => formatCurrency(value),
          padding: 10,
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
      }
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 20,
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        titleFont: {
          family: theme.typography.fontFamily,
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          family: '"Roboto Mono", monospace',
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: '"Roboto Mono", monospace',
            size: 11,
          },
          padding: 10,
        },
        beginAtZero: false,
      },
    },
    maintainAspectRatio: false,
    barPercentage: 0.7,
    categoryPercentage: 0.7,
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
          <Paper sx={{ 
            p: 3, 
            position: 'relative',
            background: 'linear-gradient(to right, rgba(0,200,5,0.12), rgba(0,0,0,0))',
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            borderRadius: '4px',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  Welcome to your Financial Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, maxWidth: '700px' }}>
                  Monitor your portfolio performance, track investments, and stay updated with market trends in real-time.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/portfolios/create')}
                sx={{ 
                  borderRadius: '4px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                }}
              >
                New Portfolio
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Portfolio summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 0, 
            height: '100%',
            overflow: 'hidden',
            borderRadius: '4px',
          }}>
            <Box sx={{ 
              bgcolor: 'background.alt', 
              px: 2.5, 
              py: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                Portfolio Summary
              </Typography>
              <IconButton size="small" onClick={() => setLoading(true)} sx={{ color: 'primary.main' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 700, 
                  fontFamily: '"Roboto Mono", monospace',
                  color: 'primary.main' 
                }}
              >
                {formatCurrency(portfolioSummary.totalValue)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: portfolioSummary.dailyChange >= 0 ? 'rgba(0, 200, 5, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                }}>
                  {portfolioSummary.dailyChange >= 0 ? 
                    <ArrowUpIcon fontSize="small" color="success" /> : 
                    <ArrowDownIcon fontSize="small" color="error" />
                  }
                  <Typography
                    variant="body2"
                    sx={{ 
                      ml: 0.5,
                      fontWeight: 600,
                      color: portfolioSummary.dailyChange >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatCurrency(portfolioSummary.dailyChange)} ({formatPercent(portfolioSummary.dailyChangePercent)})
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ ml: 1 }} color="text.secondary">
                  Today
                </Typography>
              </Box>
              
              <Box sx={{
                mb: 2,
                pb: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <Typography variant="overline" sx={{ 
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 600,
                  mb: 1.5,
                  letterSpacing: 1,
                }}>
                  YOUR PORTFOLIOS
                </Typography>
                
                <List disablePadding>
                  {portfolioSummary.portfolios.map((portfolio) => (
                    <ListItem
                      key={portfolio.id}
                      disablePadding
                      sx={{ 
                        py: 1, 
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                        },
                        borderRadius: '4px',
                        mb: 0.5,
                      }}
                      onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: portfolio.changePercent >= 0 ? 'rgba(0, 200, 5, 0.2)' : 'rgba(255, 59, 48, 0.2)',
                            color: portfolio.changePercent >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          <PortfolioIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={portfolio.name}
                        secondary={formatCurrency(portfolio.value)}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontWeight: 600,
                        }}
                        secondaryTypographyProps={{
                          fontFamily: '"Roboto Mono", monospace',
                          fontSize: '0.8125rem',
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: portfolio.changePercent >= 0 ? 'success.main' : 'error.main',
                      }}>
                        {portfolio.changePercent >= 0 ? 
                          <ArrowUpIcon fontSize="small" /> : 
                          <ArrowDownIcon fontSize="small" />
                        }
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          {formatPercent(portfolio.changePercent)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ 
                  py: 1,
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: 'rgba(0, 200, 5, 0.08)',
                  },
                }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/portfolios')}
              >
                View All Portfolios
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Portfolio performance chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 0, 
            height: '100%',
            overflow: 'hidden',
            borderRadius: '4px',
          }}>
            <Box sx={{ 
              bgcolor: 'background.alt', 
              px: 2.5, 
              py: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                Portfolio Performance
              </Typography>
              <Box>
                <Button 
                  size="small" 
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  1D
                </Button>
                <Button 
                  size="small" 
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  1W
                </Button>
                <Button 
                  size="small" 
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  1M
                </Button>
                <Button 
                  size="small" 
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  3M
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  disableElevation
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  1Y
                </Button>
                <Button 
                  size="small" 
                  sx={{ 
                    minWidth: '40px',
                    mx: 0.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  All
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ p: 2.5, height: 'calc(100% - 56px)' }}>
              <Box sx={{ 
                height: '100%', 
                minHeight: '300px',
                maxHeight: '400px',
                width: '100%' 
              }}>
                <Line data={generatePortfolioChartData()} options={chartOptions} />
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Market overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 0, 
            overflow: 'hidden',
            borderRadius: '4px',
          }}>
            <Box sx={{ 
              bgcolor: 'background.alt', 
              px: 2.5, 
              py: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                Market Overview
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
                onClick={() => navigate('/market')}
              >
                View More
              </Button>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Market indices */}
                {marketSummary && marketSummary.market_indices && marketSummary.market_indices.slice(0, 3).map((index) => (
                  <Grid item xs={12} sm={4} key={index.symbol}>
                    <Card sx={{ 
                      bgcolor: 'background.paper', 
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                      <CardContent sx={{ py: 2, px: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {index.name}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          mt: 0.5, 
                          mb: 1, 
                          fontWeight: 700,
                          fontFamily: '"Roboto Mono", monospace', 
                        }}>
                          {index.price.toFixed(2)}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          background: index.change_percent >= 0 ? 'rgba(0, 200, 5, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                          borderRadius: '4px',
                          py: 0.5,
                          px: 1,
                          width: 'fit-content',
                        }}>
                          {index.change_percent >= 0 ? (
                            <ArrowUpIcon fontSize="small" color="success" />
                          ) : (
                            <ArrowDownIcon fontSize="small" color="error" />
                          )}
                          <Typography
                            variant="body2"
                            color={index.change_percent >= 0 ? 'success.main' : 'error.main'}
                            sx={{ ml: 0.5, fontWeight: 600 }}
                          >
                            {formatPercent(index.change_percent)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ 
                height: 250, 
                mt: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                p: 2,
              }}>
                <Bar data={generateMarketChartData()} options={barChartOptions} />
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            p: 0,
            height: '100%',
            overflow: 'hidden',
            borderRadius: '4px',
          }}>
            <Box sx={{ 
              bgcolor: 'background.alt', 
              px: 2.5, 
              py: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <IconButton size="small" color="primary">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ p: 0, height: 'calc(100% - 56px)', overflowY: 'auto' }}>
              <List sx={{ px: 0 }}>
                {recentActivity.map((activity) => (
                  <ListItem
                    key={activity.id}
                    disablePadding
                    sx={{
                      py: 2,
                      px: 2.5,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: 
                            activity.type === 'trade' 
                              ? activity.action === 'Buy' 
                                ? 'rgba(0, 200, 5, 0.2)' 
                                : 'rgba(255, 59, 48, 0.2)'
                              : activity.type === 'deposit'
                                ? 'rgba(84, 199, 236, 0.2)'
                                : 'rgba(255, 184, 0, 0.2)',
                          color:
                            activity.type === 'trade' 
                              ? activity.action === 'Buy' 
                                ? 'success.main' 
                                : 'error.main'
                              : activity.type === 'deposit'
                                ? 'info.main'
                                : 'warning.main',
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
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {activity.type === 'trade'
                            ? `${activity.action} ${activity.quantity} ${activity.symbol} @ ${formatCurrency(activity.price)}`
                            : activity.type === 'deposit'
                              ? `Deposited ${formatCurrency(activity.amount)}`
                              : activity.message}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Roboto Mono", monospace' }}>
                          {formatTime(activity.timestamp)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    py: 1,
                    fontWeight: 600,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(0, 200, 5, 0.08)',
                    },
                  }}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/activity')}
                >
                  View All Activity
                </Button>
              </Box>
            </Box>
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