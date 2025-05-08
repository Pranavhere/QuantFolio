const Portfolio = require('../models/portfolio.model');

exports.getAll = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user.userId });
    res.json({
      data: {
        portfolios
      }
    });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({
      error: 'Error fetching portfolios'
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found'
      });
    }

    res.json({
      data: {
        portfolio
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      error: 'Error fetching portfolio'
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;

    const portfolio = new Portfolio({
      name,
      description,
      user: req.user.userId,
      assets: []
    });

    await portfolio.save();

    res.status(201).json({
      data: {
        portfolio
      }
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({
      error: 'Error creating portfolio'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description } = req.body;

    const portfolio = await Portfolio.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      {
        name,
        description
      },
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found'
      });
    }

    res.json({
      data: {
        portfolio
      }
    });
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({
      error: 'Error updating portfolio'
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found'
      });
    }

    res.json({
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({
      error: 'Error deleting portfolio'
    });
  }
};

exports.getPerformance = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found'
      });
    }

    // Calculate portfolio performance
    const totalValue = portfolio.assets.reduce((sum, asset) => {
      return sum + (asset.quantity * asset.currentPrice);
    }, 0);

    const totalCost = portfolio.assets.reduce((sum, asset) => {
      return sum + (asset.quantity * asset.averagePrice);
    }, 0);

    const performance = {
      totalValue,
      totalCost,
      profitLoss: totalValue - totalCost,
      profitLossPercentage: ((totalValue - totalCost) / totalCost) * 100
    };

    res.json({
      data: {
        performance
      }
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      error: 'Error calculating performance'
    });
  }
};