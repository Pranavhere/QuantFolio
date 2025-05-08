const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  portfolio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Trade quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Trade price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  executionTime: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  strategy: {
    type: String,
    enum: ['manual', 'algorithm', 'ai'],
    default: 'manual'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for faster queries
tradeSchema.index({ portfolio: 1, executionTime: -1 });
tradeSchema.index({ asset: 1, executionTime: -1 });

// Pre-save middleware to calculate total amount
tradeSchema.pre('save', function(next) {
  this.totalAmount = this.quantity * this.price;
  next();
});

// Method to calculate trade performance
tradeSchema.methods.calculatePerformance = function(currentPrice) {
  if (this.type === 'buy') {
    return ((currentPrice - this.price) / this.price) * 100;
  } else {
    return ((this.price - currentPrice) / currentPrice) * 100;
  }
};

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade; 