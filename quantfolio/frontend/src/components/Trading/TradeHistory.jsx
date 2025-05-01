import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

import { tradingAPI } from '../../api/api';

const TradeHistory = () => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [portfolioFilter, setPortfolioFilter] = useState('all');

  useEffect(() => {
    fetchTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      // Apply filters when API supports it
      const params = {};
      if (symbolFilter) {
        params.symbol = symbolFilter;
      }
      if (portfolioFilter !== 'all') {
        params.portfolio_id = portfolioFilter;
      }

      const response = await tradingAPI.getTrades(params);
      setTrades(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trade history. Please try again.');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSymbolChange = (event) => {
    setSymbolFilter(event.target.value);
    setPage(0);
  };

  const handlePortfolioChange = (event) => {
    setPortfolioFilter(event.target.value);
    setPage(0);
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
          <Button color="inherit" size="small" onClick={fetchTrades}>
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
          Trade History
        </Typography>
        <IconButton onClick={fetchTrades}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Symbol</InputLabel>
              <Select
                value={symbolFilter}
                onChange={handleSymbolChange}
                label="Symbol"
                displayEmpty
              >
                <MenuItem value="">All Symbols</MenuItem>
                <MenuItem value="AAPL">AAPL - Apple Inc.</MenuItem>
                <MenuItem value="MSFT">MSFT - Microsoft Corp.</MenuItem>
                <MenuItem value="AMZN">AMZN - Amazon.com Inc.</MenuItem>
                <MenuItem value="GOOGL">GOOGL - Alphabet Inc.</MenuItem>
                <MenuItem value="TSLA">TSLA - Tesla Inc.</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={portfolioFilter}
                onChange={handlePortfolioChange}
                label="Portfolio"
              >
                <MenuItem value="all">All Portfolios</MenuItem>
                {/* This would be populated from portfolio API */}
                <MenuItem value="1">Growth Portfolio</MenuItem>
                <MenuItem value="2">Dividend Portfolio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/trading')}
              fullWidth
            >
              New Trade
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Trade Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Trade ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>Total Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.length > 0 ? (
                (rowsPerPage > 0
                  ? trades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : trades
                ).map((trade) => (
                  <TableRow key={trade.id} hover>
                    <TableCell>{trade.id}</TableCell>
                    <TableCell>{formatDate(trade.timestamp)}</TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {trade.side === 'buy' ? (
                          <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                        )}
                        <Typography 
                          color={trade.side === 'buy' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {trade.side.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>{formatCurrency(trade.price)}</TableCell>
                    <TableCell>{formatCurrency(trade.fee)}</TableCell>
                    <TableCell>{formatCurrency(trade.total_value)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No trades found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={trades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

TradeHistory.propTypes = {
  children: PropTypes.node
};

export default TradeHistory; 