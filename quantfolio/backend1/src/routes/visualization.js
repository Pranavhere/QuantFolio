const express = require('express');
const router = express.Router();
const { pgPool } = require('../config/db');
const moment = require('moment');

router.get('/:symbol', async (req, res) => {
    const { timeframe, daysBack } = req.query;
    let startDate;
    if (timeframe === 'daily') {
        startDate = moment().subtract(daysBack || 90, 'days').format('YYYY-MM-DD');
    } else if (timeframe === 'weekly') {
        startDate = moment().subtract(52, 'weeks').format('YYYY-MM-DD');
    } else if (timeframe === 'monthly') {
        startDate = moment().subtract(12, 'months').format('YYYY-MM-DD');
    } else if (timeframe === 'yearly') {
        startDate = moment().subtract(5, 'years').format('YYYY-MM-DD');
    } else {
        startDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
    }

    try {
        let query;
        if (timeframe === 'daily') {
            query = `
                SELECT date, close, volume FROM nse500_data 
                WHERE symbol = $1 AND date >= $2 
                ORDER BY date ASC
            `;
        } else if (timeframe === 'weekly') {
            query = `
                SELECT 
                    DATE_TRUNC('week', date) as week,
                    AVG(close) as close,
                    SUM(volume) as volume
                FROM nse500_data 
                WHERE symbol = $1 AND date >= $2 
                GROUP BY DATE_TRUNC('week', date)
                ORDER BY week ASC
            `;
        } else if (timeframe === 'monthly') {
            query = `
                SELECT 
                    DATE_TRUNC('month', date) as month,
                    AVG(close) as close,
                    SUM(volume) as volume
                FROM nse500_data 
                WHERE symbol = $1 AND date >= $2 
                GROUP BY DATE_TRUNC('month', date)
                ORDER BY month ASC
            `;
        } else if (timeframe === 'yearly') {
            query = `
                SELECT 
                    DATE_TRUNC('year', date) as year,
                    AVG(close) as close,
                    SUM(volume) as volume
                FROM nse500_data 
                WHERE symbol = $1 AND date >= $2 
                GROUP BY DATE_TRUNC('year', date)
                ORDER BY year ASC
            `;
        }

        const data = await pgPool.query(query, [req.params.symbol, startDate]);

        if (data.rows.length === 0) {
            return res.status(404).json({ message: 'No data found for this symbol' });
        }

        res.json({
            labels: data.rows.map(row => moment(row.date || row.week || row.month || row.year).format('YYYY-MM-DD')),
            prices: data.rows.map(row => row.close),
            volumes: data.rows.map(row => row.volume)
        });
    } catch (error) {
        console.error('Visualization error:', error);
        res.status(500).json({ 
            message: 'Server error',
            details: error.message 
        });
    }
});

module.exports = router;