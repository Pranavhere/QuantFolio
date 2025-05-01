import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

import { portfolioAPI } from '../../api/api';

const PortfolioList = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolios();
      setPortfolios(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError('Failed to load portfolios. Please try again.');
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
          <Button color="inherit" size="small" onClick={fetchPortfolios}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Your Portfolios
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/portfolios/create')}
        >
          Create New Portfolio
        </Button>
      </Box>

      {portfolios.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            You don't have any portfolios yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first portfolio to start tracking your investments
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/portfolios/create')}
          >
            Create Portfolio
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => (
            <Grid item xs={12} md={6} lg={4} key={portfolio.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {portfolio.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {portfolio.description || 'No description'}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(portfolio.total_value)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Performance
                      </Typography>
                      <Typography 
                        variant="h6" 
                        color={portfolio.performance_1m >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercent(portfolio.performance_1m)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate(`/analytics/${portfolio.id}`)}
                  >
                    Analytics
                  </Button>
                  <Box flexGrow={1} />
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this portfolio?')) {
                        // Implement delete logic
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

PortfolioList.propTypes = {
  children: PropTypes.node
};

export default PortfolioList; 