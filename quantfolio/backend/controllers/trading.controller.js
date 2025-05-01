const mockData = require('./mock.controller');

// Check if we're in development mode without MongoDB
const useMockData = process.env.NODE_ENV === 'development' && process.env.MONGO_REQUIRED !== 'true';

// @desc    Get all orders
// @route   GET /api/trading/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    // In a real app, we would filter by user ID and other params
    const trades = mockData.trades;
    
    res.status(200).json({
      success: true,
      count: trades.length,
      data: trades
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get order by ID
// @route   GET /api/trading/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const trade = mockData.trades.find(t => t._id === req.params.id);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: trade
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create order
// @route   POST /api/trading/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const { portfolio_id, symbol, name, type, quantity, price } = req.body;
    
    // Validate required fields
    if (!portfolio_id || !symbol || !name || !type || !quantity || !price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: portfolio_id, symbol, name, type, quantity, price'
      });
    }
    
    // Create new trade/order
    const newTrade = {
      _id: (mockData.trades.length + 1).toString(),
      user_id: '1', // Hard-coded for now
      portfolio_id,
      symbol,
      name,
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      total: parseFloat(quantity) * parseFloat(price),
      date: new Date(),
      status: 'completed' // Assume instant execution for mock
    };
    
    mockData.trades.push(newTrade);
    
    // Update portfolio if order is completed
    if (newTrade.status === 'completed') {
      const portfolioIndex = mockData.portfolios.findIndex(p => p._id === portfolio_id);
      
      if (portfolioIndex !== -1) {
        const portfolio = mockData.portfolios[portfolioIndex];
        
        // Find asset in portfolio
        const assetIndex = portfolio.assets.findIndex(a => a.symbol === symbol);
        
        if (type === 'buy') {
          if (assetIndex !== -1) {
            // Update existing asset
            const asset = portfolio.assets[assetIndex];
            const oldQuantity = asset.quantity;
            const newQuantity = oldQuantity + parseFloat(quantity);
            
            // Update average purchase price (weighted average)
            const oldValue = oldQuantity * asset.purchase_price;
            const newValue = parseFloat(quantity) * parseFloat(price);
            const newPurchasePrice = (oldValue + newValue) / newQuantity;
            
            asset.quantity = newQuantity;
            asset.purchase_price = newPurchasePrice;
            asset.current_price = parseFloat(price); // Update current price
          } else {
            // Add new asset
            portfolio.assets.push({
              symbol,
              name,
              quantity: parseFloat(quantity),
              purchase_price: parseFloat(price),
              current_price: parseFloat(price),
              allocation: 0 // Will be recalculated
            });
          }
        } else if (type === 'sell') {
          if (assetIndex !== -1) {
            const asset = portfolio.assets[assetIndex];
            
            // Check if selling all shares
            if (asset.quantity <= parseFloat(quantity)) {
              // Remove asset completely
              portfolio.assets.splice(assetIndex, 1);
            } else {
              // Reduce quantity
              asset.quantity -= parseFloat(quantity);
              asset.current_price = parseFloat(price); // Update current price
            }
          }
        }
        
        // Recalculate allocations
        const totalValue = portfolio.assets.reduce(
          (total, asset) => total + asset.quantity * asset.current_price, 0
        );
        
        portfolio.assets.forEach(asset => {
          asset.allocation = totalValue > 0
            ? parseFloat(((asset.quantity * asset.current_price / totalValue) * 100).toFixed(1))
            : 0;
        });
        
        // Update portfolio timestamp
        portfolio.updated_at = new Date();
      }
    }
    
    res.status(201).json({
      success: true,
      data: newTrade
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   DELETE /api/trading/orders/:id
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    // For now, we're always using mock data
    const index = mockData.trades.findIndex(t => t._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order can be cancelled
    if (mockData.trades[index].status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Completed orders cannot be cancelled'
      });
    }
    
    // Update order status to cancelled
    mockData.trades[index].status = 'cancelled';
    
    res.status(200).json({
      success: true,
      data: mockData.trades[index]
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get quotes for a symbol
// @route   GET /api/trading/quotes/:symbol
// @access  Private
exports.getQuote = async (req, res, next) => {
  try {
    // For now, return mock data
    const stock = mockData.stocks.find(s => s.symbol === req.params.symbol);
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Symbol not found'
      });
    }
    
    // Format as a quote
    const quote = {
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      change_percent: stock.change_percent,
      volume: stock.volume,
      timestamp: new Date(),
      market_status: 'open', // Mock status
      bid: stock.price - 0.01,
      ask: stock.price + 0.01,
      bid_size: Math.floor(Math.random() * 100) * 100,
      ask_size: Math.floor(Math.random() * 100) * 100,
    };
    
    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (err) {
    next(err);
  }
}; 