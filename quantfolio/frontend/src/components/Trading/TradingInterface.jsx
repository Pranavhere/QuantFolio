import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ShoppingCart as BuyIcon,
  Sell as SellIcon,
  Calculate as CalculateIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import { portfolioAPI, tradingAPI, dataAPI } from '../../api/api';
import { useNavigate } from 'react-router-dom';

const TradingInterface = () => {
  const navigate = useNavigate();
  
  // State for order form
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  
  // Other state
  const [portfolios, setPortfolios] = useState([]);
  const [stockOptions, setStockOptions] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderPreview, setOrderPreview] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    severity: 'success',
    message: '',
  });
  
  // Load portfolios and stock options on component mount
  useEffect(() => {
    fetchPortfolios();
    fetchStockOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fetch user portfolios
  const fetchPortfolios = async () => {
    try {
      const response = await portfolioAPI.getPortfolios();
      if (response.data && response.data.data) {
        setPortfolios(response.data.data);
        // Set first portfolio as default if available
        if (response.data.data.length > 0) {
          setPortfolioId(response.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      showAlert('error', 'Failed to load portfolios');
    }
  };
  
  // Fetch available stocks
  const fetchStockOptions = async () => {
    try {
      const response = await dataAPI.getStocks();
      if (response.data && response.data.data) {
        setStockOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stock options:', err);
      // Use some mock stocks if API fails
      setStockOptions([
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
      ]);
    }
  };
  
  // Fetch stock details when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchStockDetails(symbol);
    } else {
      setStockData(null);
      setPrice('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);
  
  // Get stock details
  const fetchStockDetails = async (stockSymbol) => {
    try {
      setLoading(true);
      const response = await dataAPI.getStockDetails(stockSymbol);
      setStockData(response.data);
      // Update price field with current stock price for market orders
      if (response.data && response.data.price) {
        // Set as current price for reference, will be editable for non-market orders
        setPrice(response.data.price.toString());
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock details:', err);
      setLoading(false);
      // Use mock data if API fails
      const mockStock = stockOptions.find(stock => stock.symbol === stockSymbol);
      if (mockStock) {
        const mockPrice = 150 + Math.random() * 50;
        setStockData({
          symbol: stockSymbol,
          name: mockStock.name || 'Unknown Stock',
          price: mockPrice,
          change: Math.random() * 5 * (Math.random() > 0.5 ? 1 : -1),
          change_percent: Math.random() * 3 * (Math.random() > 0.5 ? 1 : -1),
          volume: Math.floor(500000 + Math.random() * 1500000),
          market_cap: mockPrice * (1000000 + Math.random() * 9000000),
        });
        // Set as current price for reference, will be editable for non-market orders
        setPrice(mockPrice.toString());
      }
    }
  };
  
  // Update price when order type changes
  useEffect(() => {
    // If switching to market order and we have stock data, use current price
    if (orderType === 'market' && stockData && stockData.price) {
      setPrice(stockData.price.toString());
    }
  }, [orderType, stockData]);
  
  // Update order preview when inputs change
  useEffect(() => {
    // Clear order preview when inputs change
    if (orderPreview) {
      setOrderPreview(null);
    }
  }, [symbol, quantity, price, orderType, side, portfolioId]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Preview order first
      await calculateOrderPreview();
      
      // Confirmation dialog shown by orderPreview
      
      setLoading(false);
    } catch (err) {
      console.error('Error submitting order:', err);
      setLoading(false);
      showAlert('error', 'Failed to process order');
    }
  };
  
  // Calculate order preview
  const calculateOrderPreview = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // For market orders, use the current stock price
      const orderPrice = orderType === 'market' && stockData 
        ? stockData.price 
        : parseFloat(price);
      
      const totalValue = parseFloat(quantity) * orderPrice;
      const commission = totalValue * 0.0025; // 0.25% commission
      
      const preview = {
        symbol,
        side,
        orderType,
        quantity: parseFloat(quantity),
        price: orderPrice,
        totalValue,
        commission,
        finalAmount: side === 'buy' ? totalValue + commission : totalValue - commission,
      };
      
      setOrderPreview(preview);
    } catch (err) {
      console.error('Error calculating preview:', err);
      showAlert('error', 'Failed to calculate order preview');
    }
  };
  
  // Submit final order
  const submitOrder = async () => {
    if (!orderPreview) return;
    
    try {
      setLoading(true);
      
      // For market orders, use the current stock price
      const finalPrice = orderType === 'market' && stockData 
        ? stockData.price 
        : parseFloat(price);
      
      const orderData = {
        portfolio_id: portfolioId,
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        price: finalPrice,
      };
      
      await tradingAPI.createOrder(orderData);
      
      setLoading(false);
      setOrderPreview(null);
      resetForm();
      showAlert('success', 'Order submitted successfully');
    } catch (err) {
      console.error('Error submitting order:', err);
      setLoading(false);
      showAlert('error', 'Failed to submit order');
    }
  };
  
  // Validate form inputs
  const validateForm = () => {
    if (!symbol) {
      showAlert('error', 'Please select a stock');
      return false;
    }
    
    if (!portfolioId) {
      showAlert('error', 'Please select a portfolio');
      return false;
    }
    
    if (!quantity || parseFloat(quantity) <= 0) {
      showAlert('error', 'Please enter a valid quantity');
      return false;
    }
    
    // Only validate price for non-market orders
    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      showAlert('error', 'Please enter a valid price for your limit or GTC order');
      return false;
    }
    
    return true;
  };
  
  // Reset form to default values
  const resetForm = () => {
    setSymbol('');
    setQuantity('');
    setPrice('');
    setOrderType('market');
    setSide('buy');
    setStockData(null);
    setOrderPreview(null);
  };
  
  // Show alert message
  const showAlert = (severity, message) => {
    setAlert({
      open: true,
      severity,
      message,
    });
  };
  
  // Handle alert close
  const handleAlertClose = () => {
    setAlert({
      ...alert,
      open: false,
    });
  };
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      navigate('/orders');
    } else if (newValue === 2) {
      navigate('/trades');
    }
  };
  
  // Handle order type change
  const handleOrderTypeChange = (e) => {
    const newOrderType = e.target.value;
    setOrderType(newOrderType);
    
    // If changing to market order and we have stock data, use current price
    if (newOrderType === 'market' && stockData && stockData.price) {
      setPrice(stockData.price.toString());
    }
  };
  
  // Check if price field should be disabled - ONLY for market orders
  const isPriceDisabled = () => {
    return orderType === 'market';
  };

  // Get helper text for price field
  const getPriceHelperText = () => {
    if (orderType === 'market') {
      return 'Market price will be used';
    } else if (orderType === 'limit') {
      return 'Enter your limit price';
    } else if (orderType === 'gtc') {
      return 'Order valid until canceled';
    }
    return '';
  };
  
  return (
    <Box>
      {/* Page header with tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Trade" icon={<BuyIcon />} />
          <Tab label="Orders" icon={<HistoryIcon />} />
          <Tab label="Trades" icon={<HistoryIcon />} />
        </Tabs>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Order form */}
        <Grid item xs={12} md={8}>
          <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Place Order
            </Typography>
            
            <Grid container spacing={3}>
              {/* Buy/Sell selection */}
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
                  <Button
                    variant={side === 'buy' ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setSide('buy')}
                    startIcon={<BuyIcon />}
                    sx={{ flex: 1 }}
                  >
                    Buy
                  </Button>
                  <Button
                    variant={side === 'sell' ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setSide('sell')}
                    startIcon={<SellIcon />}
                    sx={{ flex: 1 }}
                  >
                    Sell
                  </Button>
                </Box>
              </Grid>
              
              {/* Order type */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Order Type
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant={orderType === 'market' ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => handleOrderTypeChange({ target: { value: 'market' } })}
                    sx={{ flex: 1 }}
                  >
                    Market Order
                  </Button>
                  <Button
                    variant={orderType === 'limit' ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => handleOrderTypeChange({ target: { value: 'limit' } })}
                    sx={{ flex: 1 }}
                  >
                    Limit Order
                  </Button>
                  <Button
                    variant={orderType === 'gtc' ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => handleOrderTypeChange({ target: { value: 'gtc' } })}
                    sx={{ flex: 1 }}
                  >
                    GTC
                  </Button>
                </Box>
              </Grid>
              
              {/* Portfolio selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Portfolio</InputLabel>
                  <Select
                    value={portfolioId}
                    onChange={(e) => setPortfolioId(e.target.value)}
                    label="Portfolio"
                    required
                  >
                    {portfolios.map((portfolio) => (
                      <MenuItem key={portfolio._id} value={portfolio._id}>
                        {portfolio.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Stock selection */}
              <Grid item xs={12}>
                <Autocomplete
                  options={stockOptions}
                  getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
                  renderInput={(params) => <TextField {...params} label="Stock" required />}
                  value={stockOptions.find(opt => opt.symbol === symbol) || null}
                  onChange={(e, newValue) => setSymbol(newValue ? newValue.symbol : '')}
                  isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
                />
              </Grid>
              
              {/* Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  InputProps={{
                    inputProps: { min: 1, step: 1 },
                  }}
                  required
                />
              </Grid>
              
              {/* Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { 
                      min: 0.01, 
                      step: 0.01
                    }
                  }}
                  required={!isPriceDisabled()}
                  disabled={isPriceDisabled()}
                  helperText={getPriceHelperText()}
                />
              </Grid>
              
              {/* Action buttons */}
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<CalculateIcon />}
                    onClick={calculateOrderPreview}
                    disabled={loading}
                  >
                    Calculate
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color={side === 'buy' ? 'success' : 'error'}
                    disabled={loading}
                  >
                    {side === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Stock details and order preview */}
        <Grid item xs={12} md={4}>
          {stockData && stockData.symbol && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {stockData.symbol} - {stockData.name || 'Unknown'}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body1">Current Price</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {stockData.price ? formatCurrency(stockData.price) : 'N/A'}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Change
                  </Typography>
                  <Typography
                    variant="body2"
                    color={(stockData.change_percent >= 0) ? 'success.main' : 'error.main'}
                  >
                    {stockData.change !== undefined ? formatCurrency(stockData.change) : '$0.00'} 
                    ({stockData.change_percent !== undefined ? stockData.change_percent : '0'}%)
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Volume
                    </Typography>
                    <Typography variant="body2">
                      {stockData.volume ? stockData.volume.toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Market Cap
                    </Typography>
                    <Typography variant="body2">
                      {stockData.market_cap ? formatCurrency(stockData.market_cap) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {orderPreview && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Preview
                </Typography>
                
                <Typography variant="body1" mb={2}>
                  {orderPreview.side === 'buy' ? 'Buy' : 'Sell'} {orderPreview.quantity} shares of {orderPreview.symbol} at {formatCurrency(orderPreview.price)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {orderPreview.orderType === 'market' ? 'Market Order' : 
                   orderPreview.orderType === 'limit' ? 'Limit Order' : 
                   'Good Till Canceled (GTC)'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">
                    {formatCurrency(orderPreview.totalValue)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Commission</Typography>
                  <Typography variant="body2">
                    {formatCurrency(orderPreview.commission)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" fontWeight="bold">
                    {orderPreview.side === 'buy' ? 'Total Cost' : 'Total Proceeds'}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(orderPreview.finalAmount)}
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  color={orderPreview.side === 'buy' ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                  onClick={submitOrder}
                  disabled={loading}
                >
                  Confirm Order
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      
      {/* Loading indicator */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {/* Alert snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

TradingInterface.propTypes = {
  children: PropTypes.node
};

export default TradingInterface; 