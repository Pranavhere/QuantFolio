const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const { pgPool } = require('../config/db');

router.post('/buy/:portfolioId', auth, async (req, res) => {
    const { symbol, price, quantity } = req.body;
    const userId = req.user.userId;
    const portfolioId = req.params.portfolioId;

    try {
        const portfolio = new Portfolio(userId, portfolioId);
        await portfolio.loadState();
        const success = await portfolio.buy(symbol, price, quantity, new Date());
        if (!success) {
            return res.status(400).json({ message: 'Insufficient funds or invalid order' });
        }

        // Log the trade in the trades table
        await pgPool.query(
            'INSERT INTO trades (user_id, portfolio_id, type, symbol, price, quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, portfolioId, 'buy', symbol, price, quantity]
        );

        res.json({ message: 'Buy order executed' });
    } catch (error) {
        console.error('Error executing buy order:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/sell/:portfolioId', auth, async (req, res) => {
    const { symbol, price, quantity } = req.body;
    const userId = req.user.userId;
    const portfolioId = req.params.portfolioId;

    try {
        const portfolio = new Portfolio(userId, portfolioId);
        await portfolio.loadState();
        const success = await portfolio.sell(symbol, price, quantity, new Date());
        if (!success) {
            return res.status(400).json({ message: 'Insufficient quantity or invalid order' });
        }

        // Log the trade in the trades table
        await pgPool.query(
            'INSERT INTO trades (user_id, portfolio_id, type, symbol, price, quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, portfolioId, 'sell', symbol, price, quantity]
        );

        res.json({ message: 'Sell order executed' });
    } catch (error) {
        console.error('Error executing sell order:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
    const userId = req.user.userId;

    try {
        const tradesResult = await pgPool.query(
            'SELECT * FROM trades WHERE user_id = $1 ORDER BY date DESC',
            [userId]
        );
        res.status(200).json(tradesResult.rows);
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;