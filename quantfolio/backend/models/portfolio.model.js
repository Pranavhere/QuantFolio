const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Portfolio name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['stock', 'crypto', 'mixed'],
    default: 'stock'
  },
  initialBalance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    min: [0, 'Initial balance cannot be negative']
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
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
  assets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  strategy: {
    type: String,
    enum: ['passive', 'active', 'hybrid'],
    default: 'passive'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
portfolioSchema.index({ user: 1, name: 1 }, { unique: true });

// Method to calculate portfolio performance
portfolioSchema.methods.calculatePerformance = async function() {
  const assets = await this.populate('assets');
  let totalValue = 0;
  let totalCost = 0;

  assets.forEach(asset => {
    totalValue += asset.currentValue;
    totalCost += asset.totalCost;
  });

  this.currentBalance = totalValue;
  this.performance.allTime = ((totalValue - totalCost) / totalCost) * 100;
  await this.save();
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio; 