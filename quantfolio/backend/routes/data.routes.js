const express = require('express');
const {
  getStocks,
  getStockDetails,
  getIndices,
  getEconomicIndicators,
  getMarketSummary
} = require('../controllers/data.controller');

const router = express.Router();

// Public routes
router.get('/stocks', getStocks);
router.get('/stocks/:symbol', getStockDetails);
router.get('/indices', getIndices);
router.get('/economic-indicators', getEconomicIndicators);
router.get('/market-summary', getMarketSummary);

module.exports = router; 