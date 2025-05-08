const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes are protected
router.use(authMiddleware);

// Portfolio routes
router.get('/', portfolioController.getAll);
router.get('/:id', portfolioController.getOne);
router.post('/', portfolioController.create);
router.put('/:id', portfolioController.update);
router.delete('/:id', portfolioController.delete);
router.get('/:id/performance', portfolioController.getPerformance);

module.exports = router; 