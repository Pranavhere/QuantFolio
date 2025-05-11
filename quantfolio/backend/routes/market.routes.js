const express = require('express');
const router = express.Router();

// Get market summary
router.get('/market-summary', async (req, res) => {
  try {
    // Mock data for now - replace with real data from your data source
    const marketSummary = {
      indices: {
        nifty50: {
          value: 22450.25,
          change: 125.75,
          changePercent: 0.56
        },
        sensex: {
          value: 73765.35,
          change: 405.25,
          changePercent: 0.55
        },
        niftyBank: {
          value: 48752.60,
          change: -52.40,
          changePercent: -0.11
        }
      },
      topGainers: [
        { symbol: 'RELIANCE', price: 2873.75, change: 45.50, changePercent: 1.61 },
        { symbol: 'TCS', price: 3742.30, change: 62.80, changePercent: 1.71 },
        { symbol: 'INFY', price: 1538.25, change: 28.25, changePercent: 1.87 }
      ],
      topLosers: [
        { symbol: 'HDFCBANK', price: 1625.40, change: -8.65, changePercent: -0.53 },
        { symbol: 'ICICIBANK', price: 945.75, change: -4.25, changePercent: -0.45 },
        { symbol: 'KOTAKBANK', price: 1756.30, change: -7.80, changePercent: -0.44 }
      ],
      marketStatus: 'open',
      lastUpdated: new Date().toISOString()
    };

    res.json(marketSummary);
  } catch (error) {
    console.error('Error fetching market summary:', error);
    res.status(500).json({ error: 'Failed to fetch market summary' });
  }
});

// Get stock details
router.get('/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    // Mock data - replace with real data
    const stockData = {
      symbol,
      price: 1500.25,
      change: 25.50,
      changePercent: 1.73,
      volume: 1250000,
      high: 1520.75,
      low: 1480.50,
      open: 1490.25,
      previousClose: 1474.75,
      marketCap: 1500000000000,
      peRatio: 25.5,
      dividendYield: 1.2
    };
    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock details:', error);
    res.status(500).json({ error: 'Failed to fetch stock details' });
  }
});

// Get all stocks
router.get('/stocks', async (req, res) => {
  try {
    // Mock data - replace with real data
    const stocks = [
      { symbol: 'RELIANCE', price: 2873.75, change: 45.50, changePercent: 1.61 },
      { symbol: 'TCS', price: 3742.30, change: 62.80, changePercent: 1.71 },
      { symbol: 'HDFCBANK', price: 1625.40, change: -8.65, changePercent: -0.53 },
      { symbol: 'INFY', price: 1538.25, change: 28.25, changePercent: 1.87 },
      { symbol: 'ICICIBANK', price: 945.75, change: -4.25, changePercent: -0.45 }
    ];
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

module.exports = router; 