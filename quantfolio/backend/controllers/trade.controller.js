const Trade = require('../models/trade.model');
const Asset = require('../models/asset.model');
const Portfolio = require('../models/portfolio.model');

// @desc    Get all trades for a portfolio
// @route   GET /api/portfolio/:portfolioId/trades
// @access  Private
exports.getTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ portfolio: req.params.portfolioId })
      .populate('asset')
      .sort('-executionTime');

    res.status(200).json({
      success: true,
      count: trades.length,
      data: trades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single trade
// @route   GET /api/portfolio/:portfolioId/trades/:id
// @access  Private
exports.getTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    }).populate('asset');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new trade
// @route   POST /api/portfolio/:portfolioId/trades
// @access  Private
exports.createTrade = async (req, res) => {
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

    // Check if asset exists
    const asset = await Asset.findOne({
      portfolio: req.params.portfolioId,
      symbol: req.body.symbol
    });

    if (!asset && req.body.type === 'sell') {
      return res.status(400).json({
        success: false,
        error: 'Cannot sell asset that does not exist in portfolio'
      });
    }

    // Create trade
    const trade = await Trade.create({
      ...req.body,
      portfolio: req.params.portfolioId,
      asset: asset ? asset._id : null
    });

    if (asset) {
      // Update asset with trade
      await asset.addTrade(trade);
    } else if (req.body.type === 'buy') {
      // Create new asset for buy trade
      const newAsset = await Asset.create({
        portfolio: req.params.portfolioId,
        symbol: req.body.symbol,
        name: req.body.name,
        type: req.body.assetType,
        quantity: req.body.quantity,
        averagePrice: req.body.price,
        totalCost: req.body.quantity * req.body.price,
        currentPrice: req.body.price,
        currentValue: req.body.quantity * req.body.price
      });

      trade.asset = newAsset._id;
      await trade.save();
      await newAsset.addTrade(trade);
    }

    // Update portfolio performance
    await portfolio.calculatePerformance();

    res.status(201).json({
      success: true,
      data: trade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update trade
// @route   PUT /api/portfolio/:portfolioId/trades/:id
// @access  Private
exports.updateTrade = async (req, res) => {
  try {
    let trade = await Trade.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Only allow updating status and notes
    const updateFields = {};
    if (req.body.status) updateFields.status = req.body.status;
    if (req.body.notes) updateFields.notes = req.body.notes;

    trade = await Trade.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    // If status changed to completed, update asset and portfolio
    if (req.body.status === 'completed' && trade.status === 'completed') {
      const asset = await Asset.findById(trade.asset);
      if (asset) {
        await asset.addTrade(trade);
        const portfolio = await Portfolio.findById(req.params.portfolioId);
        await portfolio.calculatePerformance();
      }
    }

    res.status(200).json({
      success: true,
      data: trade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete trade
// @route   DELETE /api/portfolio/:portfolioId/trades/:id
// @access  Private
exports.deleteTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.id,
      portfolio: req.params.portfolioId
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Remove trade from asset if it exists
    if (trade.asset) {
      const asset = await Asset.findById(trade.asset);
      if (asset) {
        asset.trades = asset.trades.filter(t => t.toString() !== trade._id.toString());
        await asset.save();
      }
    }

    await trade.remove();

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