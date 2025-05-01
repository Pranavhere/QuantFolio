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
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { tradingAPI } from '../../api/api';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [portfolioFilter, setPortfolioFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Apply filters when API supports it
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (portfolioFilter !== 'all') {
        params.portfolio_id = portfolioFilter;
      }

      const response = await tradingAPI.getOrders(params);
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history. Please try again.');
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

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handlePortfolioChange = (event) => {
    setPortfolioFilter(event.target.value);
    setPage(0);
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await tradingAPI.cancelOrder(orderId);
      // Update the orders list after cancellation
      fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'executed':
        color = 'success';
        break;
      case 'rejected':
        color = 'error';
        break;
      case 'canceled':
        color = 'warning';
        break;
      case 'pending':
      default:
        color = 'info';
    }

    return <Chip label={status.toUpperCase()} color={color} size="small" />;
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
          <Button color="inherit" size="small" onClick={fetchOrders}>
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
          Order History
        </Typography>
        <IconButton onClick={fetchOrders}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="executed">Executed</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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
              New Order
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Order Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length > 0 ? (
                (rowsPerPage > 0
                  ? orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : orders
                ).map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell>
                      <Typography 
                        color={order.side === 'buy' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {order.side.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.order_type}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      {order.price ? formatCurrency(order.price) : 'Market Price'}
                    </TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => cancelOrder(order.id)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No orders found
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
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

OrderHistory.propTypes = {
  children: PropTypes.node
};

export default OrderHistory; 