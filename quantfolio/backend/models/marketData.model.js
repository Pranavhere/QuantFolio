const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['stock', 'crypto', 'etf', 'bond'],
    required: true
  },
  data: [{
    timestamp: {
      type: Date,
      required: true
    },
    open: {
      type: Number,
      required: true,
      min: 0
    },
    high: {
      type: Number,
      required: true,
      min: 0
    },
    low: {
      type: Number,
      required: true,
      min: 0
    },
    close: {
      type: Number,
      required: true,
      min: 0
    },
    volume: {
      type: Number,
      required: true,
      min: 0
    },
    adjustedClose: {
      type: Number,
      min: 0
    }
  }],
  metadata: {
    name: String,
    sector: String,
    industry: String,
    currency: {
      type: String,
      default: 'USD'
    },
    exchange: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  indicators: {
    sma: [{
      period: Number,
      values: [Number]
    }],
    ema: [{
      period: Number,
      values: [Number]
    }],
    rsi: [{
      period: Number,
      values: [Number]
    }],
    macd: {
      fastPeriod: Number,
      slowPeriod: Number,
      signalPeriod: Number,
      values: [{
        macd: Number,
        signal: Number,
        histogram: Number
      }]
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
marketDataSchema.index({ symbol: 1, type: 1 }, { unique: true });
marketDataSchema.index({ 'data.timestamp': 1 });

// Method to add new data point
marketDataSchema.methods.addDataPoint = async function(dataPoint) {
  this.data.push(dataPoint);
  this.metadata.lastUpdated = new Date();
  await this.save();
};

// Method to get data within date range
marketDataSchema.methods.getDataInRange = function(startDate, endDate) {
  return this.data.filter(point => 
    point.timestamp >= startDate && point.timestamp <= endDate
  );
};

// Method to calculate technical indicators
marketDataSchema.methods.calculateIndicators = async function() {
  // Implementation for calculating technical indicators
  // This would be implemented based on your specific requirements
  await this.save();
};

const MarketData = mongoose.model('MarketData', marketDataSchema);

module.exports = MarketData; 