import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Stack,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as PortfolioIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const PortfolioSummary = ({
  portfolioData,
  loading = false,
  error = null,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format percentage
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" onClick={onRefresh} startIcon={<RefreshIcon />} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!portfolioData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography>No portfolios found.</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/portfolios/create')} 
            sx={{ mt: 2 }}
          >
            Create Portfolio
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const { totalValue, dailyChange, dailyChangePercent, portfolios } = portfolioData;
  const isPositiveChange = dailyChangePercent >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Portfolio Summary
          </Typography>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        <Typography variant="h4" component="div" gutterBottom>
          {formatCurrency(totalValue)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip
            icon={isPositiveChange ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${formatCurrency(dailyChange)} (${formatPercent(dailyChangePercent)})`}
            color={isPositiveChange ? 'success' : 'error'}
            variant="outlined"
          />
          <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
            Today
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Your Portfolios
        </Typography>
        
        {portfolios.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No portfolios found.
          </Typography>
        ) : (
          <List disablePadding>
            {portfolios.map((portfolio) => (
              <ListItem
                key={portfolio.id}
                disablePadding
                sx={{ py: 1, cursor: 'pointer' }}
                onClick={() => navigate(`/portfolios/${portfolio.id}`)}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: portfolio.changePercent >= 0 ? 'success.main' : 'error.main',
                    }}
                  >
                    <PortfolioIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={portfolio.name}
                  secondary={formatCurrency(portfolio.value)}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
                <Typography
                  variant="body2"
                  color={portfolio.changePercent >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(portfolio.changePercent)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
        
        <Box sx={{ mt: 2 }}>
          {portfolios.length > 0 && (
            <Button
              fullWidth
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/portfolios')}
            >
              View All Portfolios
            </Button>
          )}
          
          {portfolios.length === 0 && (
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/portfolios/create')}
            >
              Create Portfolio
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary; 