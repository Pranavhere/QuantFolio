const express = require('express');
const router = express.Router({ mergeParams: true }); // To access params from parent router
const {
  getTrades,
  getTrade,
  createTrade,
  updateTrade,
  deleteTrade
} = require('../controllers/trade.controller');

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Trade routes
router.route('/')
  .get(getTrades)
  .post(createTrade);

router.route('/:id')
  .get(getTrade)
  .put(updateTrade)
  .delete(deleteTrade);

module.exports = router; 