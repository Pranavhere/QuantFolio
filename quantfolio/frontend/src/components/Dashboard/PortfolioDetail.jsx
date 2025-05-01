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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { portfolioAPI } from '../../api/api';

const PortfolioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolioDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPortfolioDetails = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolioById(id);
      setPortfolio(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolio details:', err);
      setError('Failed to load portfolio details. Please try again.');
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
          <Button color="inherit" size="small" onClick={fetchPortfolioDetails}>
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
          <IconButton onClick={() => navigate('/portfolios')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {portfolio?.name || 'Portfolio Details'}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={fetchPortfolioDetails} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate(`/analytics/${id}`)}
            sx={{ mr: 1 }}
          >
            Analytics
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              // Open add asset dialog
              alert('Add asset functionality would be implemented here');
            }}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Description */}
      {portfolio?.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {portfolio.description}
        </Typography>
      )}

      {/* Portfolio Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(portfolio?.total_value || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Daily Change
                </Typography>
                <Typography 
                  variant="h5" 
                  color={(portfolio?.performance_1d || 0) >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(portfolio?.performance_1d || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Monthly Change
                </Typography>
                <Typography 
                  variant="h5" 
                  color={(portfolio?.performance_1m || 0) >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(portfolio?.performance_1m || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  YTD Change
                </Typography>
                <Typography 
                  variant="h5" 
                  color={(portfolio?.performance_ytd || 0) >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(portfolio?.performance_ytd || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Assets Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Assets
        </Typography>
        
        {portfolio?.assets?.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Purchase Price</TableCell>
                  <TableCell align="right">Current Price</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Change (%)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio.assets.map((asset) => {
                  const currentValue = asset.quantity * asset.current_price;
                  const purchaseValue = asset.quantity * asset.purchase_price;
                  const change = ((asset.current_price - asset.purchase_price) / asset.purchase_price) * 100;
                  
                  return (
                    <TableRow key={asset.symbol} hover>
                      <TableCell>{asset.symbol}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell align="right">{asset.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(asset.purchase_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(asset.current_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(currentValue)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatPercent(change)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${asset.symbol}?`)) {
                              // Implement remove asset logic
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              No assets in this portfolio yet
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => {
                // Open add asset dialog
                alert('Add asset functionality would be implemented here');
              }}
            >
              Add Your First Asset
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

PortfolioDetail.propTypes = {
  children: PropTypes.node
};

export default PortfolioDetail; 