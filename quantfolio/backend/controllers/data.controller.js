const mockData = require('./mock.controller');

// Check if we're in development mode without MongoDB
const useMockData = process.env.NODE_ENV === 'development' && process.env.MONGO_REQUIRED !== 'true';

// @desc    Get all stocks
// @route   GET /api/data/stocks
// @access  Public
exports.getStocks = async (req, res, next) => {
  try {
    // For now, we're always using mock data as we haven't implemented MongoDB models yet
    const stocks = mockData.stocks;
    
    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get stock details by symbol
// @route   GET /api/data/stocks/:symbol
// @access  Public
exports.getStockDetails = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const stock = mockData.stocks.find(s => s.symbol === req.params.symbol);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: stock
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all market indices
// @route   GET /api/data/indices
// @access  Public
exports.getIndices = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const indices = mockData.indices;
    
    res.status(200).json({
      success: true,
      count: indices.length,
      data: indices
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get economic indicators
// @route   GET /api/data/economic-indicators
// @access  Public
exports.getEconomicIndicators = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const indicators = mockData.economicIndicators;
    
    res.status(200).json({
      success: true,
      count: indicators.length,
      data: indicators
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get market summary
// @route   GET /api/data/market-summary
// @access  Public
exports.getMarketSummary = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const summary = mockData.marketSummary;
    
    // Refresh the timestamp to current time
    summary.timestamp = new Date();
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
}; 