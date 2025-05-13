const express = require('express');
const router = express.Router();
const { pgPool } = require('../config/db');
const { calculateTechnicalIndicators } = require('../utils/technical');
const moment = require('moment');

router.get('/symbols', async (req, res) => {
    try {
        const result = await pgPool.query('SELECT DISTINCT symbol FROM nse500_data');
        res.json(result.rows.map(row => row.symbol));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/technical/:symbol', async (req, res) => {
    try {
        const data = await pgPool.query(
            'SELECT date, close FROM nse500_data WHERE symbol = $1 ORDER BY date DESC LIMIT 100',
            [req.params.symbol]
        );

        if (data.rows.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const prices = data.rows.map(row => row.close).reverse();
        const indicators = calculateTechnicalIndicators(prices);
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/top-performers', async (req, res) => {
    const { daysBack = 30, topN = 5 } = req.query;
    try {
        const data = await pgPool.query(`
            WITH price_changes AS (
                SELECT 
                    symbol,
                    FIRST_VALUE(close) OVER (PARTITION BY symbol ORDER BY date ASC) as start_price,
                    LAST_VALUE(close) OVER (PARTITION BY symbol ORDER BY date ASC) as end_price
                FROM nse500_data
                WHERE date >= $1 AND date <= $2
            )
            SELECT 
                symbol,
                start_price,
                end_price,
                ((end_price - start_price) / start_price * 100) as percent_change
            FROM price_changes
            GROUP BY symbol, start_price, end_price
            ORDER BY percent_change DESC
            LIMIT $3
        `, [moment().subtract(daysBack, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD'), topN]);

        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/volatility', async (req, res) => {
    const { daysBack = 30, topN = 5 } = req.query;
    try {
        const data = await pgPool.query(`
            SELECT 
                symbol,
                AVG(close) as avg_price,
                STDDEV(close) as std_dev,
                (STDDEV(close) / AVG(close) * 100) as volatility
            FROM nse500_data
            WHERE date >= $1
            GROUP BY symbol
            ORDER BY volatility DESC
            LIMIT $2
        `, [moment().subtract(daysBack, 'days').format('YYYY-MM-DD'), topN]);

        res.json(data.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/summary', async (req, res) => {
    try {
        const data = await pgPool.query('SELECT * FROM ticker_summary ORDER BY symbol');
        const df = data.rows;

        const summaryStats = {
            avg_volume: { mean: 0, std: 0, min: Infinity, max: -Infinity },
            avg_close: { mean: 0, std: 0, min: Infinity, max: -Infinity },
            days_of_data: { mean: 0, std: 0, min: Infinity, max: -Infinity }
        };

        const n = df.length;
        ['avg_volume', 'avg_close', 'days_of_data'].forEach(key => {
            const values = df.map(row => row[key]);
            summaryStats[key].mean = values.reduce((sum, val) => sum + val, 0) / n;
            summaryStats[key].std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - summaryStats[key].mean, 2), 0) / n);
            summaryStats[key].min = Math.min(...values);
            summaryStats[key].max = Math.max(...values);
        });

        const topVolume = df.sort((a, b) => b.avg_volume - a.avg_volume).slice(0, 5);
        const topClose = df.sort((a, b) => b.avg_close - a.avg_close).slice(0, 5);

        res.json({
            summaryStats,
            topVolume,
            topClose,
            totalSymbols: df.length,
            avgDaysOfData: summaryStats.days_of_data.mean
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;