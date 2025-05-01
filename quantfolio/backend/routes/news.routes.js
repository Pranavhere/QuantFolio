const express = require('express');
const {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  searchNews,
  getNewsByCategory,
} = require('../controllers/news.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getNews);
router.get('/search', searchNews);
router.get('/category/:category', getNewsByCategory);
router.get('/:id', getNewsById);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), createNews);
router.put('/:id', protect, authorize('admin'), updateNews);
router.delete('/:id', protect, authorize('admin'), deleteNews);

module.exports = router; 