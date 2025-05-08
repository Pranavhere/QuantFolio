const express = require('express');
const router = express.Router();
const {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioPerformance,
  getPortfolioAssets
} = require('../controllers/portfolio.controller');

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Portfolio routes
router.route('/')
  .get(getPortfolios)
  .post(createPortfolio);

router.route('/:id')
  .get(getPortfolio)
  .put(updatePortfolio)
  .delete(deletePortfolio);

router.get('/:id/performance', getPortfolioPerformance);
router.get('/:id/assets', getPortfolioAssets);

module.exports = router; 