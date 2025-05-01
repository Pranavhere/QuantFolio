const express = require('express');
const {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getQuote
} = require('../controllers/trading.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Order routes
router.route('/orders')
  .get(getOrders)
  .post(createOrder);

router.route('/orders/:id')
  .get(getOrderById)
  .delete(cancelOrder);

// Quote routes
router.route('/quotes/:symbol')
  .get(getQuote);

module.exports = router; 