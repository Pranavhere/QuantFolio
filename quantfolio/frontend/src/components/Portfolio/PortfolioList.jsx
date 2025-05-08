import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { portfolioAPI } from '../../services/api';

const PortfolioList = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    description: '',
    type: 'stock',
    initialBalance: 0,
    riskLevel: 'medium',
    strategy: 'passive'
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const response = await portfolioAPI.getAll();
      setPortfolios(response.data.data);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      await portfolioAPI.create(newPortfolio);
      setOpenDialog(false);
      fetchPortfolios();
      setNewPortfolio({
        name: '',
        description: '',
        type: 'stock',
        initialBalance: 0,
        riskLevel: 'medium',
        strategy: 'passive'
      });
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  const handleDeletePortfolio = async (id) => {
    try {
      await portfolioAPI.delete(id);
      fetchPortfolios();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My Portfolios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Portfolio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {portfolios.map((portfolio) => (
          <Grid item xs={12} md={6} lg={4} key={portfolio._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{portfolio.name}</Typography>
                  <Box>
                    <IconButton onClick={() => navigate(`/portfolio/${portfolio._id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePortfolio(portfolio._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {portfolio.description}
                </Typography>
                <Typography variant="body2">
                  Type: {portfolio.type}
                </Typography>
                <Typography variant="body2">
                  Balance: ${portfolio.currentBalance.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Performance: {portfolio.performance.allTime.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            fullWidth
            value={newPortfolio.name}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newPortfolio.description}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Initial Balance"
            type="number"
            fullWidth
            value={newPortfolio.initialBalance}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, initialBalance: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePortfolio} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioList; 