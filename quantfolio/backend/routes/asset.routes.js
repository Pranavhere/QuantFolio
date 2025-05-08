const express = require('express');
const router = express.Router({ mergeParams: true }); // To access params from parent router
const {
  getAssets,
  getAsset,
  addAsset,
  updateAsset,
  removeAsset,
  updateAssetPrices
} = require('../controllers/asset.controller');

const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Asset routes
router.route('/')
  .get(getAssets)
  .post(addAsset);

router.route('/:id')
  .get(getAsset)
  .put(updateAsset)
  .delete(removeAsset);

router.put('/update-prices', updateAssetPrices);

module.exports = router; 