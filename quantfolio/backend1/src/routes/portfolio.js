const express = require('express');
const router = express.Router();
const { pgPool } = require('../config/db');
const authenticateToken = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');

// GET /api/portfolios - Fetch all portfolios for a user
router.get('/', authenticateToken, async (req, res) => {
    const user_id = req.user.userId;
    try {
        console.log('Fetching portfolios for user:', user_id);
        const result = await pgPool.query('SELECT * FROM portfolios WHERE user_id = $1', [user_id]);
        console.log('Found portfolios:', result.rows.length);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching portfolios:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST /api/portfolio/create - Create a new portfolio
router.post('/create', authenticateToken, async (req, res) => {
    const { name } = req.body;
    const user_id = req.user.userId;

    if (!name) {
        return res.status(400).json({ message: 'Portfolio name is required' });
    }

    try {
        console.log('Creating portfolio for user:', user_id, 'with name:', name);
        const result = await pgPool.query(
            'INSERT INTO portfolios (user_id, portfolio_id, name, cash, holdings, transactions, performance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [
                user_id,
                `portfolio_${Date.now()}`,
                name,
                100000, // Initial cash
                JSON.stringify({}), // Empty holdings
                JSON.stringify([]), // Empty transactions
                JSON.stringify({ portfolioValues: [], timestamps: [], returns: [] }), // Empty performance
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );
        console.log('Created portfolio:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating portfolio:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/portfolio/:portfolioId/state - Fetch portfolio state
router.get('/:portfolioId/state', authenticateToken, async (req, res) => {
    const { portfolioId } = req.params;
    const user_id = req.user.userId;

    try {
        console.log('Fetching portfolio state for user:', user_id, 'portfolio:', portfolioId);
        
        // First check if portfolio exists
        const portfolioCheck = await pgPool.query(
            'SELECT * FROM portfolios WHERE user_id = $1 AND portfolio_id = $2',
            [user_id, portfolioId]
        );

        if (portfolioCheck.rows.length === 0) {
            console.log('Portfolio not found:', portfolioId);
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        const portfolio = new Portfolio(user_id, portfolioId);
        await portfolio.loadState();
        
        // Log the loaded state for debugging
        console.log('Loaded portfolio state:', {
            cash: portfolio.cash,
            holdings: portfolio.holdings,
            transactions: portfolio.transactions?.length || 0
        });

        const state = {
            totalValue: portfolio.calculateTotalValue(),
            transactions: portfolio.state.transactions || [],
            cash: portfolio.cash,
            holdings: portfolio.holdings
        };
        
        console.log('Returning portfolio state:', state);
        res.status(200).json(state);
    } catch (error) {
        console.error('Error fetching portfolio state:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/portfolio/:portfolioId/metrics - Fetch portfolio metrics
router.get('/:portfolioId/metrics', authenticateToken, async (req, res) => {
    const { portfolioId } = req.params;
    const user_id = req.user.userId;

    try {
        console.log('Fetching portfolio metrics for user:', user_id, 'portfolio:', portfolioId);
        
        // First check if portfolio exists
        const portfolioCheck = await pgPool.query(
            'SELECT * FROM portfolios WHERE user_id = $1 AND portfolio_id = $2',
            [user_id, portfolioId]
        );

        if (portfolioCheck.rows.length === 0) {
            console.log('Portfolio not found:', portfolioId);
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        const portfolio = new Portfolio(user_id, portfolioId);
        await portfolio.loadState();

        // Log the loaded state for debugging
        console.log('Loaded portfolio for metrics:', {
            cash: portfolio.cash,
            holdings: portfolio.holdings,
            transactions: portfolio.transactions?.length || 0,
            performance: portfolio.performance
        });

        const metrics = await portfolio.calculateMetrics();
        console.log('Calculated metrics:', metrics);
        
        res.status(200).json(metrics);
    } catch (error) {
        console.error('Error fetching portfolio metrics:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;