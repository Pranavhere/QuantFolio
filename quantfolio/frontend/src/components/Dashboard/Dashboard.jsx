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

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [marketSummary, setMarketSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch portfolio summary
        const portfolioResponse = await portfolioAPI.getPortfolios();
        if (portfolioResponse.data) {
          setPortfolioSummary(portfolioResponse.data);
        }
        
        // Fetch market summary
        const marketResponse = await dataAPI.getMarketSummary();
        if (marketResponse.data) {
          setMarketSummary(marketResponse.data);
        }
        
        // Fetch recent activity
        const activityResponse = await tradingAPI.getTrades({ limit: 5 });
        if (activityResponse.data) {
          setRecentActivity(activityResponse.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Format currency values
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format percentage values
  const formatPercent = (percent) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percent / 100);
  };
  
  // Format timestamp
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date));
  };
  
  // Generate portfolio chart data
  const generatePortfolioChartData = () => {
    if (!portfolioSummary) return null;
    
    return {
      labels: portfolioSummary.portfolios.map(p => p.name),
      datasets: [
        {
          label: 'Portfolio Value',
          data: portfolioSummary.portfolios.map(p => p.value),
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Generate market chart data
  const generateMarketChartData = () => {
    if (!marketSummary) return null;
    
    return {
      labels: marketSummary.market_indices.map(index => index.symbol),
      datasets: [
        {
          label: 'Change %',
          data: marketSummary.market_indices.map(index => index.change_percent),
          backgroundColor: marketSummary.market_indices.map(index => 
            index.change_percent >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
          borderColor: marketSummary.market_indices.map(index => 
            index.change_percent >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
          borderWidth: 1,
        },
      ],
    };
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Portfolio Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h2">
                Portfolio Summary
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/portfolio/new')}
              >
                New Portfolio
              </Button>
            </Box>
            
            {portfolioSummary && (
              <>
                <Box display="flex" alignItems="baseline" mb={2}>
                  <Typography variant="h4" component="div" mr={2}>
                    {formatCurrency(portfolioSummary.totalValue)}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {portfolioSummary.dailyChange >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography
                      variant="h6"
                      color={portfolioSummary.dailyChange >= 0 ? 'success.main' : 'error.main'}
                      ml={1}
                    >
                      {formatCurrency(portfolioSummary.dailyChange)} ({formatPercent(portfolioSummary.dailyChangePercent)})
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  {portfolioSummary.portfolios.map((portfolio) => (
                    <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {portfolio.name}
                          </Typography>
                          <Typography variant="h5" component="div">
                            {formatCurrency(portfolio.value)}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={1}>
                            {portfolio.change >= 0 ? (
                              <TrendingUpIcon color="success" fontSize="small" />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" />
                            )}
                            <Typography
                              variant="body2"
                              color={portfolio.change >= 0 ? 'success.main' : 'error.main'}
                              ml={0.5}
                            >
                              {formatCurrency(portfolio.change)} ({formatPercent(portfolio.changePercent)})
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<ShowIcon />}
                            onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                          >
                            View Details
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Market Summary */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Market Summary
            </Typography>
            
            {marketSummary && (
              <>
                <Grid container spacing={2} mb={3}>
                  {marketSummary.market_indices.map((index) => (
                    <Grid item xs={12} sm={4} key={index.symbol}>
                      <Box
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          {index.name}
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(index.price)}
                        </Typography>
                        <Box display="flex" alignItems="center">
                          {index.change >= 0 ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <Typography
                            variant="body2"
                            color={index.change >= 0 ? 'success.main' : 'error.main'}
                            ml={0.5}
                          >
                            {formatCurrency(index.change)} ({formatPercent(index.change_percent)})
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                <Box height={300}>
                  <Bar
                    data={generateMarketChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Recent Activity
            </Typography>
            
            <List>
              {recentActivity.map((activity) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
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
                        activity.type === 'trade' ? (
                          `${activity.action} ${activity.quantity} ${activity.symbol} @ ${formatCurrency(activity.price)}`
                        ) : activity.type === 'deposit' ? (
                          `Deposit ${formatCurrency(activity.amount)}`
                        ) : (
                          activity.message
                        )
                      }
                      secondary={formatTime(activity.timestamp)}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 