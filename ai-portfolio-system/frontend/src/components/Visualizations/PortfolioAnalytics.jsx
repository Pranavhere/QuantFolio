import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
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
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Pie, Bar, Radar } from 'react-chartjs-2';

// Import API
import { analyticsAPI, portfolioAPI } from '../../api/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend
);

const PortfolioAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [portfolio, setPortfolio] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [risk, setRisk] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState({
    portfolio: true,
    performance: true,
    allocation: true,
    risk: true,
    correlation: true,
    optimization: true,
  });
  const [error, setError] = useState({
    portfolio: null,
    performance: null,
    allocation: null,
    risk: null,
    correlation: null,
    optimization: null,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState(30);
  const [riskTolerance, setRiskTolerance] = useState(0.5);
  
  // Fetch portfolio data
  useEffect(() => {
    fetchPortfolio();
    fetchPerformance();
    fetchAllocation();
    fetchRisk();
    fetchCorrelation();
    fetchOptimization();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  // Fetch performance when time range changes
  useEffect(() => {
    fetchPerformance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);
  
  // Fetch optimization when risk tolerance changes
  useEffect(() => {
    fetchOptimization();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskTolerance]);

  // Fetch functions
  const fetchPortfolio = async () => {
    try {
      setLoading(prev => ({ ...prev, portfolio: true }));
      setError(prev => ({ ...prev, portfolio: null }));
      
      const response = await portfolioAPI.getPortfolioById(id);
      setPortfolio(response.data);
      
      setLoading(prev => ({ ...prev, portfolio: false }));
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(prev => ({ ...prev, portfolio: 'Failed to load portfolio data' }));
      setLoading(prev => ({ ...prev, portfolio: false }));
    }
  };
  
  const fetchPerformance = async () => {
    try {
      setLoading(prev => ({ ...prev, performance: true }));
      setError(prev => ({ ...prev, performance: null }));
      
      const response = await analyticsAPI.getPortfolioPerformance(id, timeRange);
      setPerformance(response.data);
      
      setLoading(prev => ({ ...prev, performance: false }));
    } catch (err) {
      console.error('Error fetching performance:', err);
      setError(prev => ({ ...prev, performance: 'Failed to load performance data' }));
      setLoading(prev => ({ ...prev, performance: false }));
    }
  };
  
  const fetchAllocation = async () => {
    try {
      setLoading(prev => ({ ...prev, allocation: true }));
      setError(prev => ({ ...prev, allocation: null }));
      
      const response = await analyticsAPI.getPortfolioAllocation(id);
      setAllocation(response.data);
      
      setLoading(prev => ({ ...prev, allocation: false }));
    } catch (err) {
      console.error('Error fetching allocation:', err);
      setError(prev => ({ ...prev, allocation: 'Failed to load allocation data' }));
      setLoading(prev => ({ ...prev, allocation: false }));
    }
  };
  
  const fetchRisk = async () => {
    try {
      setLoading(prev => ({ ...prev, risk: true }));
      setError(prev => ({ ...prev, risk: null }));
      
      const response = await analyticsAPI.getPortfolioRisk(id);
      setRisk(response.data);
      
      setLoading(prev => ({ ...prev, risk: false }));
    } catch (err) {
      console.error('Error fetching risk:', err);
      setError(prev => ({ ...prev, risk: 'Failed to load risk metrics' }));
      setLoading(prev => ({ ...prev, risk: false }));
    }
  };
  
  const fetchCorrelation = async () => {
    try {
      setLoading(prev => ({ ...prev, correlation: true }));
      setError(prev => ({ ...prev, correlation: null }));
      
      const response = await analyticsAPI.getAssetCorrelation(id);
      setCorrelation(response.data);
      
      setLoading(prev => ({ ...prev, correlation: false }));
    } catch (err) {
      console.error('Error fetching correlation:', err);
      setError(prev => ({ ...prev, correlation: 'Failed to load correlation data' }));
      setLoading(prev => ({ ...prev, correlation: false }));
    }
  };
  
  const fetchOptimization = async () => {
    try {
      setLoading(prev => ({ ...prev, optimization: true }));
      setError(prev => ({ ...prev, optimization: null }));
      
      const response = await analyticsAPI.getPortfolioOptimization(id, riskTolerance);
      setOptimization(response.data);
      
      setLoading(prev => ({ ...prev, optimization: false }));
    } catch (err) {
      console.error('Error fetching optimization:', err);
      setError(prev => ({ ...prev, optimization: 'Failed to load optimization data' }));
      setLoading(prev => ({ ...prev, optimization: false }));
    }
  };

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Time range handler
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Risk tolerance handler
  const handleRiskToleranceChange = (event, newValue) => {
    setRiskTolerance(newValue);
  };
  
  // Format utilities
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
  
  // Main render
  if (loading.portfolio) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error.portfolio) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchPortfolio}>
              Retry
            </Button>
          }
        >
          {error.portfolio}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/portfolios')}
          sx={{ mt: 2 }}
        >
          Back to Portfolios
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(`/portfolios/${id}`)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1">
              {portfolio?.name} - Analytics
            </Typography>
          </Box>
          <IconButton onClick={() => {
            fetchPerformance();
            fetchAllocation();
            fetchRisk();
            fetchCorrelation();
            fetchOptimization();
          }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {portfolio?.description}
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Performance" />
          <Tab label="Allocation" />
          <Tab label="Risk Metrics" />
          <Tab label="Correlation" />
          <Tab label="Optimization" />
        </Tabs>

        {/* Performance Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="Time Range"
                >
                  <MenuItem value={7}>1 Week</MenuItem>
                  <MenuItem value={30}>1 Month</MenuItem>
                  <MenuItem value={90}>3 Months</MenuItem>
                  <MenuItem value={180}>6 Months</MenuItem>
                  <MenuItem value={365}>1 Year</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {loading.performance ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : error.performance ? (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={fetchPerformance}>
                    Retry
                  </Button>
                }
              >
                {error.performance}
              </Alert>
            ) : (
              <>
                <Box height={400} mb={4}>
                  {performance?.data && (
                    <Line 
                      data={{
                        labels: performance.data.map(item => item.date),
                        datasets: [
                          {
                            label: 'Portfolio Value',
                            data: performance.data.map(item => item.value),
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.primary.light,
                            tension: 0.2,
                            fill: {
                              target: 'origin',
                              above: `${theme.palette.primary.main}30`,
                            },
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
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
                      }}
                    />
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Starting Value
                        </Typography>
                        <Typography variant="h6">
                          {performance?.data && formatCurrency(performance.data[0].value)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Current Value
                        </Typography>
                        <Typography variant="h6">
                          {performance?.data && formatCurrency(performance.data[performance.data.length - 1].value)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Change
                        </Typography>
                        {performance?.data && (
                          <Typography 
                            variant="h6" 
                            color={
                              performance.data[performance.data.length - 1].value >= performance.data[0].value 
                                ? 'success.main' 
                                : 'error.main'
                            }
                          >
                            {formatCurrency(performance.data[performance.data.length - 1].value - performance.data[0].value)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Percent Change
                        </Typography>
                        {performance?.data && (
                          <Typography 
                            variant="h6" 
                            color={
                              performance.data[performance.data.length - 1].value >= performance.data[0].value
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {formatPercent(
                              ((performance.data[performance.data.length - 1].value - performance.data[0].value) / 
                              performance.data[0].value) * 100
                            )}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}

        {/* Allocation Tab */}
        {activeTab === 1 && (
          <Box>
            {loading.allocation ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : error.allocation ? (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={fetchAllocation}>
                    Retry
                  </Button>
                }
              >
                {error.allocation}
              </Alert>
            ) : (
              <Grid container spacing={4}>
                {/* Asset Allocation */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Asset Allocation
                  </Typography>
                  {allocation?.assets && allocation.assets.length > 0 ? (
                    <>
                      <Box height={300} mb={3}>
                        <Pie 
                          data={{
                            labels: allocation.assets.map(asset => asset.symbol),
                            datasets: [
                              {
                                data: allocation.assets.map(asset => asset.percentage),
                                backgroundColor: [
                                  '#4e79a7',
                                  '#f28e2c',
                                  '#e15759',
                                  '#76b7b2',
                                  '#59a14f',
                                  '#edc949',
                                  '#af7aa1',
                                  '#ff9da7',
                                  '#9c755f',
                                  '#bab0ab'
                                ],
                                borderColor: theme.palette.background.paper,
                                borderWidth: 2,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.label}: ${context.parsed}%`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                      
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Symbol</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Value</TableCell>
                              <TableCell align="right">%</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allocation.assets.map((asset) => (
                              <TableRow key={asset.symbol} hover>
                                <TableCell>{asset.symbol}</TableCell>
                                <TableCell>{asset.name}</TableCell>
                                <TableCell align="right">{formatCurrency(asset.value)}</TableCell>
                                <TableCell align="right">{asset.percentage}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Typography>No assets in portfolio</Typography>
                  )}
                </Grid>
                
                {/* Sector Allocation */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Sector Allocation
                  </Typography>
                  {allocation?.sectors && allocation.sectors.length > 0 ? (
                    <>
                      <Box height={300} mb={3}>
                        <Bar 
                          data={{
                            labels: allocation.sectors.map(sector => sector.sector),
                            datasets: [
                              {
                                label: 'Sector Allocation',
                                data: allocation.sectors.map(sector => sector.allocation),
                                backgroundColor: theme.palette.primary.main,
                              }
                            ]
                          }}
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.parsed.x}%`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  callback: function(value) {
                                    return `${value}%`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                      
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Sector</TableCell>
                              <TableCell align="right">Allocation</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allocation.sectors.map((sector) => (
                              <TableRow key={sector.sector} hover>
                                <TableCell>{sector.sector}</TableCell>
                                <TableCell align="right">{sector.allocation}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Typography>No sector data available</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Risk Metrics Tab */}
        {activeTab === 2 && (
          <Box>
            {loading.risk ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : error.risk ? (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={fetchRisk}>
                    Retry
                  </Button>
                }
              >
                {error.risk}
              </Alert>
            ) : risk?.metrics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box height={400}>
                    <Radar
                      data={{
                        labels: [
                          'Sharpe Ratio',
                          'Sortino Ratio',
                          'Alpha',
                          'Beta',
                          'R-Squared',
                          'Information Ratio',
                        ],
                        datasets: [
                          {
                            label: 'Portfolio Risk Metrics',
                            data: [
                              risk.metrics.sharpe_ratio,
                              risk.metrics.sortino_ratio,
                              risk.metrics.alpha * 100, // Scale alpha to be visible
                              risk.metrics.beta,
                              risk.metrics.r_squared,
                              risk.metrics.information_ratio,
                            ],
                            backgroundColor: `${theme.palette.primary.main}40`,
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                            pointBackgroundColor: theme.palette.primary.main,
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: theme.palette.primary.main,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            angleLines: {
                              display: true,
                            },
                            suggestedMin: 0,
                          }
                        },
                      }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Key Risk Indicators
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box mb={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Volatility (Annual)
                            </Typography>
                            <Typography variant="h6">
                              {(risk.metrics.volatility * 100).toFixed(2)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box mb={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Maximum Drawdown
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {(risk.metrics.max_drawdown * 100).toFixed(2)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box mb={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Value at Risk (95%)
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {(risk.metrics.var_95 * 100).toFixed(2)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box mb={2}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Beta
                            </Typography>
                            <Typography variant="h6">
                              {risk.metrics.beta.toFixed(2)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Value</TableCell>
                          <TableCell align="right">Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              Sharpe Ratio
                              <Tooltip title="Risk-adjusted return. Higher is better. >1 is good, >2 is excellent." placement="top">
                                <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{risk.metrics.sharpe_ratio.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {risk.metrics.sharpe_ratio > 2 ? 'Excellent' : 
                              risk.metrics.sharpe_ratio > 1 ? 'Good' : 
                              risk.metrics.sharpe_ratio > 0.5 ? 'Average' : 'Poor'}
                          </TableCell>
                        </TableRow>
                        <TableRow hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              Sortino Ratio
                              <Tooltip title="Downside risk-adjusted return. Higher is better." placement="top">
                                <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{risk.metrics.sortino_ratio.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {risk.metrics.sortino_ratio > 2 ? 'Excellent' : 
                              risk.metrics.sortino_ratio > 1 ? 'Good' : 
                              risk.metrics.sortino_ratio > 0.5 ? 'Average' : 'Poor'}
                          </TableCell>
                        </TableRow>
                        <TableRow hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              Alpha
                              <Tooltip title="Excess return over benchmark. Higher is better." placement="top">
                                <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{(risk.metrics.alpha * 100).toFixed(2)}%</TableCell>
                          <TableCell align="right">
                            {risk.metrics.alpha > 0.02 ? 'Excellent' : 
                              risk.metrics.alpha > 0 ? 'Good' : 
                              risk.metrics.alpha > -0.02 ? 'Average' : 'Poor'}
                          </TableCell>
                        </TableRow>
                        <TableRow hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              R-Squared
                              <Tooltip title="Correlation with market. Higher means more market-driven returns." placement="top">
                                <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{risk.metrics.r_squared.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {risk.metrics.r_squared > 0.8 ? 'High correlation' : 
                              risk.metrics.r_squared > 0.5 ? 'Moderate' : 'Low correlation'}
                          </TableCell>
                        </TableRow>
                        <TableRow hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              Information Ratio
                              <Tooltip title="Active return per unit of risk. Higher is better." placement="top">
                                <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{risk.metrics.information_ratio.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {risk.metrics.information_ratio > 1 ? 'Excellent' : 
                              risk.metrics.information_ratio > 0.5 ? 'Good' : 
                              risk.metrics.information_ratio > 0 ? 'Average' : 'Poor'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            ) : (
              <Typography>No risk metrics available</Typography>
            )}
          </Box>
        )}

        {/* Correlation Tab */}
        {activeTab === 3 && (
          <Box>
            {loading.correlation ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : error.correlation ? (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={fetchCorrelation}>
                    Retry
                  </Button>
                }
              >
                {error.correlation}
              </Alert>
            ) : correlation?.correlation_matrix && correlation.correlation_matrix.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Asset correlation matrix shows the relationship between different assets in your portfolio. 
                  Lower correlation between assets indicates better diversification.
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        {correlation.correlation_matrix.map((row) => (
                          <TableCell key={row.symbol} align="center">{row.symbol}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {correlation.correlation_matrix.map((row) => (
                        <TableRow key={row.symbol} hover>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            {row.symbol}
                          </TableCell>
                          {correlation.correlation_matrix.map((col) => {
                            const value = row.correlations[col.symbol];
                            let bgcolor = '#ffffff';
                            
                            // Color coding for correlation values
                            if (row.symbol !== col.symbol) {
                              if (value > 0.7) bgcolor = `${theme.palette.error.light}50`;
                              else if (value < 0.3) bgcolor = `${theme.palette.success.light}50`;
                            }
                            
                            return (
                              <TableCell 
                                key={col.symbol} 
                                align="center"
                                sx={{
                                  bgcolor,
                                  fontWeight: row.symbol === col.symbol ? 'bold' : 'normal',
                                }}
                              >
                                {value.toFixed(2)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Correlation Guide:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${theme.palette.error.light}50` 
                        }}
                      >
                        <Box sx={{ width: 16, height: 16, mr: 1, bgcolor: `${theme.palette.error.light}50` }} />
                        <Typography variant="body2">
                          High Correlation (&gt;0.7)
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center' 
                        }}
                      >
                        <Box sx={{ width: 16, height: 16, mr: 1, bgcolor: '#ffffff' }} />
                        <Typography variant="body2">
                          Moderate (0.3-0.7)
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          bgcolor: `${theme.palette.success.light}50` 
                        }}
                      >
                        <Box sx={{ width: 16, height: 16, mr: 1, bgcolor: `${theme.palette.success.light}50` }} />
                        <Typography variant="body2">
                          Low Correlation (&lt;0.3)
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Typography>
                No correlation data available. Add more assets to your portfolio to see correlation analysis.
              </Typography>
            )}
          </Box>
        )}

        {/* Optimization Tab */}
        {activeTab === 4 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Risk Tolerance:
              </Typography>
              <Box sx={{ width: 300 }}>
                <Slider
                  value={riskTolerance}
                  onChange={handleRiskToleranceChange}
                  step={0.1}
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 0.5, label: 'Medium' },
                    { value: 1, label: 'High' },
                  ]}
                  min={0}
                  max={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
              </Box>
            </Box>
            
            {loading.optimization ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : error.optimization ? (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={fetchOptimization}>
                    Retry
                  </Button>
                }
              >
                {error.optimization}
              </Alert>
            ) : optimization?.optimal_allocation && optimization.optimal_allocation.length > 0 ? (
              <>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell align="right">Current Weight</TableCell>
                            <TableCell align="right">Optimal Weight</TableCell>
                            <TableCell align="right">Difference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {optimization.optimal_allocation.map((asset) => (
                            <TableRow key={asset.symbol} hover>
                              <TableCell>
                                <Typography variant="body2">
                                  {asset.symbol} - {asset.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{asset.current_weight}%</TableCell>
                              <TableCell align="right">{asset.optimal_weight}%</TableCell>
                              <TableCell 
                                align="right"
                                sx={{
                                  color: asset.optimal_weight > asset.current_weight 
                                    ? theme.palette.success.main 
                                    : asset.optimal_weight < asset.current_weight 
                                      ? theme.palette.error.main 
                                      : 'inherit'
                                }}
                              >
                                {(asset.optimal_weight - asset.current_weight).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={5}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Optimized Portfolio Metrics
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Expected Annual Return
                            </Typography>
                            <Typography variant="h6" color="success.main">
                              {(optimization.expected_metrics.annual_return * 100).toFixed(2)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Expected Annual Risk
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {(optimization.expected_metrics.annual_risk * 100).toFixed(2)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Sharpe Ratio
                            </Typography>
                            <Typography variant="h6">
                              {optimization.expected_metrics.sharpe_ratio.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Risk Tolerance
                            </Typography>
                            <Typography variant="h6">
                              {(optimization.risk_tolerance * 100).toFixed(0)}%
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          This optimization aims to maximize returns for your selected risk tolerance level.
                          Adjust the risk tolerance slider to see how the optimal portfolio allocation changes.
                        </Typography>
                        
                        <Button 
                          variant="contained" 
                          color="primary"
                          fullWidth
                          onClick={() => alert('This would apply the optimized allocation in a real application.')}
                        >
                          Apply Optimized Allocation
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography>
                No optimization data available. Add assets to your portfolio to see optimization suggestions.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

PortfolioAnalytics.propTypes = {
  children: PropTypes.node
};

export default PortfolioAnalytics; 