import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { portfolioAPI } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PortfolioDetail = () => {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [assetAllocation, setAssetAllocation] = useState([]);

  useEffect(() => {
    fetchPortfolioDetails();
  }, [id]);

  const fetchPortfolioDetails = async () => {
    try {
      const [portfolioResponse, performanceResponse, assetsResponse] = await Promise.all([
        portfolioAPI.getOne(id),
        portfolioAPI.getPerformance(id),
        portfolioAPI.getAssets(id)
      ]);

      setPortfolio(portfolioResponse.data.data);
      
      // Transform data for charts
      const perfData = performanceResponse.data.data.performanceHistory.map(point => ({
        date: new Date(point.date).toLocaleDateString(),
        value: point.value
      }));
      setPerformanceData(perfData);

      const allocation = assetsResponse.data.data.map(asset => ({
        name: asset.symbol,
        value: asset.currentValue
      }));
      setAssetAllocation(allocation);
    } catch (error) {
      console.error('Error fetching portfolio details:', error);
    }
  };

  if (!portfolio) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {portfolio.name}
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        {portfolio.description}
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Current Balance</Typography>
                  <Typography variant="h6">${portfolio.currentBalance.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Daily Change</Typography>
                  <Typography variant="h6" color={portfolio.performance.daily >= 0 ? 'success.main' : 'error.main'}>
                    {portfolio.performance.daily.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Monthly Change</Typography>
                  <Typography variant="h6" color={portfolio.performance.monthly >= 0 ? 'success.main' : 'error.main'}>
                    {portfolio.performance.monthly.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">All Time Change</Typography>
                  <Typography variant="h6" color={portfolio.performance.allTime >= 0 ? 'success.main' : 'error.main'}>
                    {portfolio.performance.allTime.toFixed(2)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance History
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Allocation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Allocation
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Holdings Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Holdings
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Shares</TableCell>
                      <TableCell>Avg. Price</TableCell>
                      <TableCell>Current Price</TableCell>
                      <TableCell>Market Value</TableCell>
                      <TableCell>Unrealized P/L</TableCell>
                      <TableCell>% of Portfolio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.assets.map((asset) => (
                      <TableRow key={asset._id}>
                        <TableCell>{asset.symbol}</TableCell>
                        <TableCell>{asset.quantity}</TableCell>
                        <TableCell>${asset.averagePrice.toFixed(2)}</TableCell>
                        <TableCell>${asset.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>${asset.currentValue.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: asset.unrealizedPL >= 0 ? 'success.main' : 'error.main' }}>
                          ${asset.unrealizedPL.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {((asset.currentValue / portfolio.currentBalance) * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortfolioDetail; 