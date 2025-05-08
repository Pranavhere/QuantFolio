const Portfolio = require('../models/portfolio.model');
const Asset = require('../models/asset.model');
const Trade = require('../models/trade.model');

// @desc    Get all portfolios for a user
// @route   GET /api/portfolio
// @access  Private
exports.getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user.id })
      .populate('assets')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: portfolios.length,
      data: portfolios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single portfolio
// @route   GET /api/portfolio/:id
// @access  Private
exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('assets');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new portfolio
// @route   POST /api/portfolio
// @access  Private
exports.createPortfolio = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const portfolio = await Portfolio.create(req.body);

    res.status(201).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update portfolio
// @route   PUT /api/portfolio/:id
// @access  Private
exports.updatePortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    portfolio = await Portfolio.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete portfolio
// @route   DELETE /api/portfolio/:id
// @access  Private
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    // Delete all associated assets
    await Asset.deleteMany({ portfolio: req.params.id });
    
    // Delete all associated trades
    await Trade.deleteMany({ portfolio: req.params.id });

    await portfolio.remove();

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

// @desc    Get portfolio performance
// @route   GET /api/portfolio/:id/performance
// @access  Private
exports.getPortfolioPerformance = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('assets');

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    await portfolio.calculatePerformance();

    res.status(200).json({
      success: true,
      data: {
        currentBalance: portfolio.currentBalance,
        performance: portfolio.performance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get portfolio assets
// @route   GET /api/portfolio/:id/assets
// @access  Private
exports.getPortfolioAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      portfolio: req.params.id
    }).populate('trades');

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