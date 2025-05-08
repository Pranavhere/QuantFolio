const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Watchlist name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assets: [{
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['stock', 'crypto', 'etf', 'bond'],
      required: true
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },
    priceChange: {
      type: Number,
      default: 0
    },
    priceChangePercent: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    alerts: [{
      type: {
        type: String,
        enum: ['price_above', 'price_below', 'percent_change'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      triggered: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isPublic: {
    type: Boolean,
    default: false
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
watchlistSchema.index({ user: 1, name: 1 }, { unique: true });
watchlistSchema.index({ 'assets.symbol': 1 });

// Method to add an asset to watchlist
watchlistSchema.methods.addAsset = async function(assetData) {
  const existingAsset = this.assets.find(a => a.symbol === assetData.symbol);
  if (existingAsset) {
    throw new Error('Asset already in watchlist');
  }
  this.assets.push(assetData);
  await this.save();
};

// Method to remove an asset from watchlist
watchlistSchema.methods.removeAsset = async function(symbol) {
  this.assets = this.assets.filter(a => a.symbol !== symbol);
  await this.save();
};

// Method to update asset prices
watchlistSchema.methods.updateAssetPrices = async function(updates) {
  updates.forEach(update => {
    const asset = this.assets.find(a => a.symbol === update.symbol);
    if (asset) {
      asset.currentPrice = update.price;
      asset.priceChange = update.priceChange;
      asset.priceChangePercent = update.priceChangePercent;
      asset.lastUpdated = new Date();
    }
  });
  await this.save();
};

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist; 