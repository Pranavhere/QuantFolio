const mockData = require('./mock.controller');

// Check if we're in development mode without MongoDB
const useMockData = process.env.NODE_ENV === 'development' && process.env.MONGO_REQUIRED !== 'true';

// @desc    Get all portfolios
// @route   GET /api/portfolio
// @access  Private
exports.getPortfolios = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    // In a real application, we would filter portfolios by user_id
    const portfolios = mockData.portfolios;
    
    res.status(200).json({
      success: true,
      count: portfolios.length,
      data: portfolios
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get portfolio by ID
// @route   GET /api/portfolio/:id
// @access  Private
exports.getPortfolioById = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const portfolio = mockData.portfolios.find(p => p._id === req.params.id);
    
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
  } catch (err) {
    next(err);
  }
};

// @desc    Create portfolio
// @route   POST /api/portfolio
// @access  Private
exports.createPortfolio = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const newPortfolio = {
      _id: (mockData.portfolios.length + 1).toString(),
      user_id: '1', // Hard-coded user ID for now
      name: req.body.name,
      description: req.body.description,
      created_at: new Date(),
      updated_at: new Date(),
      assets: [],
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
      },
      risk_level: req.body.risk_level || 'Moderate'
    };
    
    mockData.portfolios.push(newPortfolio);
    
    res.status(201).json({
      success: true,
      data: newPortfolio
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update portfolio
// @route   PUT /api/portfolio/:id
// @access  Private
exports.updatePortfolio = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const index = mockData.portfolios.findIndex(p => p._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }
    
    const updatedPortfolio = {
      ...mockData.portfolios[index],
      name: req.body.name || mockData.portfolios[index].name,
      description: req.body.description || mockData.portfolios[index].description,
      risk_level: req.body.risk_level || mockData.portfolios[index].risk_level,
      updated_at: new Date()
    };
    
    mockData.portfolios[index] = updatedPortfolio;
    
    res.status(200).json({
      success: true,
      data: updatedPortfolio
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete portfolio
// @route   DELETE /api/portfolio/:id
// @access  Private
exports.deletePortfolio = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const index = mockData.portfolios.findIndex(p => p._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }
    
    mockData.portfolios.splice(index, 1);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add asset to portfolio
// @route   POST /api/portfolio/:id/assets
// @access  Private
exports.addAsset = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const index = mockData.portfolios.findIndex(p => p._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }
    
    const { symbol, name, quantity, purchase_price } = req.body;
    
    // Check if asset already exists in portfolio
    const assetIndex = mockData.portfolios[index].assets.findIndex(a => a.symbol === symbol);
    
    if (assetIndex !== -1) {
      // Update existing asset
      mockData.portfolios[index].assets[assetIndex].quantity += parseFloat(quantity);
      // Recalculate average purchase price
      const totalQuantity = mockData.portfolios[index].assets[assetIndex].quantity;
      const existingTotal = (totalQuantity - parseFloat(quantity)) * mockData.portfolios[index].assets[assetIndex].purchase_price;
      const newTotal = parseFloat(quantity) * parseFloat(purchase_price);
      mockData.portfolios[index].assets[assetIndex].purchase_price = (existingTotal + newTotal) / totalQuantity;
    } else {
      // Add new asset
      const newAsset = {
        symbol,
        name,
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchase_price),
        current_price: parseFloat(purchase_price), // Use purchase price as current price for now
        allocation: 0 // Will be recalculated
      };
      
      mockData.portfolios[index].assets.push(newAsset);
    }
    
    // Recalculate allocations for all assets
    const totalValue = mockData.portfolios[index].assets.reduce(
      (total, asset) => total + asset.quantity * asset.current_price, 0
    );
    
    mockData.portfolios[index].assets.forEach(asset => {
      asset.allocation = parseFloat(((asset.quantity * asset.current_price / totalValue) * 100).toFixed(1));
    });
    
    // Update portfolio
    mockData.portfolios[index].updated_at = new Date();
    
    // Create trade record
    const newTrade = {
      _id: (mockData.trades.length + 1).toString(),
      user_id: mockData.portfolios[index].user_id,
      portfolio_id: mockData.portfolios[index]._id,
      symbol,
      name,
      type: 'buy',
      quantity: parseFloat(quantity),
      price: parseFloat(purchase_price),
      total: parseFloat(quantity) * parseFloat(purchase_price),
      date: new Date(),
      status: 'completed'
    };
    
    mockData.trades.push(newTrade);
    
    res.status(200).json({
      success: true,
      data: mockData.portfolios[index]
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove asset from portfolio
// @route   DELETE /api/portfolio/:id/assets/:symbol
// @access  Private
exports.removeAsset = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const portfolioIndex = mockData.portfolios.findIndex(p => p._id === req.params.id);
    
    if (portfolioIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }
    
    const assetIndex = mockData.portfolios[portfolioIndex].assets.findIndex(
      a => a.symbol === req.params.symbol
    );
    
    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found in portfolio'
      });
    }
    
    // Remove asset
    const removedAsset = mockData.portfolios[portfolioIndex].assets.splice(assetIndex, 1)[0];
    
    // Recalculate allocations for remaining assets
    const totalValue = mockData.portfolios[portfolioIndex].assets.reduce(
      (total, asset) => total + asset.quantity * asset.current_price, 0
    );
    
    mockData.portfolios[portfolioIndex].assets.forEach(asset => {
      asset.allocation = totalValue > 0 
        ? parseFloat(((asset.quantity * asset.current_price / totalValue) * 100).toFixed(1))
        : 0;
    });
    
    // Update portfolio
    mockData.portfolios[portfolioIndex].updated_at = new Date();
    
    // Create sell trade record
    const newTrade = {
      _id: (mockData.trades.length + 1).toString(),
      user_id: mockData.portfolios[portfolioIndex].user_id,
      portfolio_id: mockData.portfolios[portfolioIndex]._id,
      symbol: removedAsset.symbol,
      name: removedAsset.name,
      type: 'sell',
      quantity: removedAsset.quantity,
      price: removedAsset.current_price,
      total: removedAsset.quantity * removedAsset.current_price,
      date: new Date(),
      status: 'completed'
    };
    
    mockData.trades.push(newTrade);
    
    res.status(200).json({
      success: true,
      data: mockData.portfolios[portfolioIndex]
    });
  } catch (err) {
    next(err);
  }
}; 