const express = require('express');
const router = express.Router();
const { pgPool } = require('../config/db');
const moment = require('moment');

router.get('/insights', async (req, res) => {
    try {
        // Top 5 advancing/declining symbols over the last 30 days
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
            LIMIT 5
        `, [moment().subtract(30, 'days').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]);

        const advancing = data.rows.filter(row => row.percent_change > 0);
        const declining = data.rows.filter(row => row.percent_change < 0).sort((a, b) => a.percent_change - b.percent_change);

        res.json({
            advancing: advancing.slice(0, 5),
            declining: declining.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/summary', async (req, res) => {
    try {
        // Overall market summary
        const summary = await pgPool.query(`
            SELECT 
                COUNT(DISTINCT symbol) as total_symbols,
                AVG((SELECT COUNT(*) FROM nse500_data d2 WHERE d2.symbol = d1.symbol)) as avg_days_of_data
            FROM nse500_data d1
        `);

        const stats = await pgPool.query(`
            SELECT 
                AVG(close) as avg_close_mean,
                STDDEV(close) as avg_close_std,
                AVG(volume) as avg_volume_mean,
                STDDEV(volume) as avg_volume_std
            FROM nse500_data
            WHERE date >= $1
        `, [moment().subtract(90, 'days').format('YYYY-MM-DD')]);

        const topVolume = await pgPool.query(`
            SELECT 
                symbol,
                AVG(volume) as avg_volume
            FROM nse500_data
            WHERE date >= $1
            GROUP BY symbol
            ORDER BY avg_volume DESC
            LIMIT 5
        `, [moment().subtract(90, 'days').format('YYYY-MM-DD')]);

        // Market trend over time (last 90 days)
        const trend = await pgPool.query(`
            SELECT 
                DATE_TRUNC('day', date) as day,
                AVG(close) as avg_close
            FROM nse500_data
            WHERE date >= $1
            GROUP BY DATE_TRUNC('day', date)
            ORDER BY day ASC
        `, [moment().subtract(90, 'days').format('YYYY-MM-DD')]);

        res.json({
            totalSymbols: summary.rows[0].total_symbols,
            avgDaysOfData: summary.rows[0].avg_days_of_data,
            summaryStats: stats.rows[0],
            topVolume: topVolume.rows,
            marketTrend: {
                labels: trend.rows.map(row => moment(row.day).format('YYYY-MM-DD')),
                values: trend.rows.map(row => row.avg_close)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;