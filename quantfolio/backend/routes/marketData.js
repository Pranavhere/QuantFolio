const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// TimescaleDB connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stock_data',
  password: 'password',
  port: 5432,
});

// Get stock data by symbol with technical indicators
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        time, 
        symbol, 
        price, 
        volume, 
        exchange, 
        change_percent,
        rsi_14,
        macd,
        macd_signal,
        macd_hist,
        sma_20,
        sma_50,
        sma_200,
        bollinger_upper,
        bollinger_lower,
        atr,
        adx,
        diplus,
        diminus,
        stoch_k,
        stoch_d
      FROM stock_market_data
      WHERE symbol = $1
    `;
    
    const params = [symbol];
    
    if (startDate && endDate) {
      query += ` AND time BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY time ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get technical signals for a symbol
router.get('/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const query = `
      WITH latest_data AS (
        SELECT 
          time,
          symbol,
          price,
          volume,
          rsi_14,
          macd,
          macd_signal,
          sma_20,
          sma_50,
          bollinger_upper,
          bollinger_lower,
          adx,
          diplus,
          diminus,
          stoch_k
        FROM stock_market_data
        WHERE symbol = $1
        ORDER BY time DESC
        LIMIT 1
      )
      SELECT 
        time,
        symbol,
        price,
        volume,
        CASE 
          WHEN rsi_14 > 70 THEN 'overbought'
          WHEN rsi_14 < 30 THEN 'oversold'
          ELSE 'neutral'
        END as rsi_signal,
        CASE 
          WHEN macd > macd_signal THEN 'bullish'
          WHEN macd < macd_signal THEN 'bearish'
          ELSE 'neutral'
        END as macd_signal,
        CASE 
          WHEN sma_20 > sma_50 THEN 'golden_cross'
          WHEN sma_20 < sma_50 THEN 'death_cross'
          ELSE 'neutral'
        END as ma_signal,
        CASE 
          WHEN price > bollinger_upper THEN 'upper_break'
          WHEN price < bollinger_lower THEN 'lower_break'
          ELSE 'neutral'
        END as bollinger_signal,
        CASE 
          WHEN adx > 25 THEN 'strong'
          ELSE 'weak'
        END as trend_strength,
        CASE 
          WHEN diplus > diminus THEN 'bullish'
          WHEN diplus < diminus THEN 'bearish'
          ELSE 'neutral'
        END as trend_direction,
        CASE 
          WHEN stoch_k > 80 THEN 'overbought'
          WHEN stoch_k < 20 THEN 'oversold'
          ELSE 'neutral'
        END as stoch_signal
      FROM latest_data;
    `;
    
    const result = await pool.query(query, [symbol]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for symbol' });
    }
    
    // Generate overall recommendation
    const signals = result.rows[0];
    let recommendation = 'hold';
    
    // Count bullish and bearish signals
    const bullishSignals = [
      signals.rsi_signal === 'oversold',
      signals.macd_signal === 'bullish',
      signals.ma_signal === 'golden_cross',
      signals.bollinger_signal === 'lower_break',
      signals.trend_direction === 'bullish',
      signals.stoch_signal === 'oversold'
    ].filter(Boolean).length;
    
    const bearishSignals = [
      signals.rsi_signal === 'overbought',
      signals.macd_signal === 'bearish',
      signals.ma_signal === 'death_cross',
      signals.bollinger_signal === 'upper_break',
      signals.trend_direction === 'bearish',
      signals.stoch_signal === 'overbought'
    ].filter(Boolean).length;
    
    if (bullishSignals >= 4) {
      recommendation = 'buy';
    } else if (bearishSignals >= 4) {
      recommendation = 'sell';
    }
    
    res.json({
      ...signals,
      recommendation,
      signal_strength: {
        bullish: bullishSignals,
        bearish: bearishSignals
      }
    });
    
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available symbols
router.get('/symbols', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT symbol 
      FROM stock_market_data 
      ORDER BY symbol
    `);
    res.json(result.rows.map(row => row.symbol));
  } catch (error) {
    console.error('Error fetching symbols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market summary
router.get('/market-summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        symbol,
        MAX(price) as current_price,
        MIN(price) as min_price,
        MAX(price) - MIN(price) as price_range,
        SUM(volume) as total_volume,
        AVG(change_percent) as avg_change_percent,
        MAX(rsi_14) as current_rsi,
        MAX(adx) as current_adx,
        CASE 
          WHEN MAX(macd) > MAX(macd_signal) THEN 'bullish'
          WHEN MAX(macd) < MAX(macd_signal) THEN 'bearish'
          ELSE 'neutral'
        END as macd_signal
      FROM stock_market_data
      WHERE time >= NOW() - INTERVAL '1 day'
      GROUP BY symbol
      ORDER BY total_volume DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching market summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 