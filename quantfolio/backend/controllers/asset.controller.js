const Asset = require('../models/asset.model');
const Portfolio = require('../models/portfolio.model');
const Trade = require('../models/trade.model');

// @desc    Get all assets for a portfolio
// @route   GET /api/portfolio/:portfolioId/assets
// @access  Private
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ portfolio: req.params.portfolioId })
      .populate('trades')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single asset
// @route   GET /api/portfolio/:portfolioId/assets/:id
// @access  Private
exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    }).populate('trades');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Add asset to portfolio
// @route   POST /api/portfolio/:portfolioId/assets
// @access  Private
exports.addAsset = async (req, res) => {
  try {
    // Check if portfolio exists
    const portfolio = await Portfolio.findOne({
      _id: req.params.portfolioId,
      user: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    // Check if asset already exists
    let asset = await Asset.findOne({
      portfolio: req.params.portfolioId,
      symbol: req.body.symbol
    });

    if (asset) {
      // Update existing asset
      const trade = await Trade.create({
        portfolio: req.params.portfolioId,
        asset: asset._id,
        type: 'buy',
        quantity: req.body.quantity,
        price: req.body.price,
        status: 'completed'
      });

      await asset.addTrade(trade);
    } else {
      // Create new asset
      req.body.portfolio = req.params.portfolioId;
      asset = await Asset.create(req.body);

      const trade = await Trade.create({
        portfolio: req.params.portfolioId,
        asset: asset._id,
        type: 'buy',
        quantity: req.body.quantity,
        price: req.body.price,
        status: 'completed'
      });

      await asset.addTrade(trade);
    }

    // Update portfolio performance
    await portfolio.calculatePerformance();

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update asset
// @route   PUT /api/portfolio/:portfolioId/assets/:id
// @access  Private
exports.updateAsset = async (req, res) => {
  try {
    let asset = await Asset.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Update portfolio performance
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    await portfolio.calculatePerformance();

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Remove asset from portfolio
// @route   DELETE /api/portfolio/:portfolioId/assets/:id
// @access  Private
exports.removeAsset = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    // Create sell trade
    const trade = await Trade.create({
      portfolio: req.params.portfolioId,
      asset: asset._id,
      type: 'sell',
      quantity: asset.quantity,
      price: asset.currentPrice,
      status: 'completed'
    });

    // Remove asset
    await asset.remove();

    // Update portfolio performance
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    await portfolio.calculatePerformance();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update asset prices
// @route   PUT /api/portfolio/:portfolioId/assets/update-prices
// @access  Private
exports.updateAssetPrices = async (req, res) => {
  try {
    const { updates } = req.body;

    for (const update of updates) {
      const asset = await Asset.findOne({
        portfolio: req.params.portfolioId,
        symbol: update.symbol
      });

      if (asset) {
        asset.currentPrice = update.price;
        await asset.updatePerformance();
      }
    }

    // Update portfolio performance
    const portfolio = await Portfolio.findById(req.params.portfolioId);
    await portfolio.calculatePerformance();

    res.status(200).json({
      success: true,
      message: 'Asset prices updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 