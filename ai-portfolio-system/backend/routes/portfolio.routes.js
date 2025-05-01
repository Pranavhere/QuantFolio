const express = require('express');
const {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addAsset,
  removeAsset
} = require('../controllers/portfolio.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getPortfolios)
  .post(createPortfolio);

router.route('/:id')
  .get(getPortfolioById)
  .put(updatePortfolio)
  .delete(deletePortfolio);

router.route('/:id/assets')
  .post(addAsset);

router.route('/:id/assets/:symbol')
  .delete(removeAsset);

module.exports = router; 