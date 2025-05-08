const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  symbol: {
    type: String,
    required: [true, 'Asset symbol is required'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['stock', 'crypto', 'etf', 'bond'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  averagePrice: {
    type: Number,
    required: true,
    min: [0, 'Average price cannot be negative']
  },
  totalCost: {
    type: Number,
    required: true,
    min: [0, 'Total cost cannot be negative']
  },
  currentPrice: {
    type: Number,
    required: true,
    min: [0, 'Current price cannot be negative']
  },
  currentValue: {
    type: Number,
    required: true,
    min: [0, 'Current value cannot be negative']
  },
  performance: {
    daily: {
      type: Number,
      default: 0
    },
    weekly: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    },
    yearly: {
      type: Number,
      default: 0
    },
    allTime: {
      type: Number,
      default: 0
    }
  },
  trades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
assetSchema.index({ portfolio: 1, symbol: 1 }, { unique: true });

// Method to update asset performance
assetSchema.methods.updatePerformance = async function() {
  this.currentValue = this.quantity * this.currentPrice;
  this.performance.allTime = ((this.currentValue - this.totalCost) / this.totalCost) * 100;
  this.lastUpdated = Date.now();
  await this.save();
};

// Method to add a trade
assetSchema.methods.addTrade = async function(trade) {
  this.trades.push(trade._id);
  
  // Update average price and quantity
  if (trade.type === 'buy') {
    const newTotalCost = this.totalCost + (trade.quantity * trade.price);
    const newQuantity = this.quantity + trade.quantity;
    this.averagePrice = newTotalCost / newQuantity;
    this.quantity = newQuantity;
    this.totalCost = newTotalCost;
  } else {
    this.quantity -= trade.quantity;
    this.totalCost = this.quantity * this.averagePrice;
  }
  
  await this.updatePerformance();
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset; 