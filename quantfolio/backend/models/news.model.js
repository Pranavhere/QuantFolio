const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    summary: {
      type: String,
      required: [true, 'Please add a summary'],
    },
    source: {
      type: String,
      required: [true, 'Please add a source'],
    },
    url: {
      type: String,
      required: [true, 'Please add a URL'],
      match: [
        /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
        'Please add a valid URL',
      ],
    },
    image_url: {
      type: String,
      default: '',
    },
    published_at: {
      type: Date,
      default: Date.now,
    },
    sentiment: {
      type: Number,
      default: 0, // -1 (negative), 0 (neutral), 1 (positive)
    },
    category: {
      type: String,
      enum: ['markets', 'economy', 'business', 'technology', 'politics', 'other'],
      default: 'markets',
    },
    related_symbols: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Create index for searching
NewsSchema.index({ title: 'text', content: 'text', summary: 'text' });

module.exports = mongoose.model('News', NewsSchema); 