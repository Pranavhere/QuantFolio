require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Environment variables:', {
      MONGO_ATLAS_URI: process.env.MONGO_ATLAS_URI ? 'exists' : 'undefined',
      NODE_ENV: process.env.NODE_ENV,
      // Log other relevant env vars
      KAFKA_BROKERS: process.env.KAFKA_BROKERS ? 'exists' : 'undefined',
      TIMESCALE_URI: process.env.TIMESCALE_URI ? 'exists' : 'undefined'
    });

    if (!process.env.MONGO_ATLAS_URI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    const mongoURI = process.env.MONGO_ATLAS_URI.replace(/["']/g, '');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 