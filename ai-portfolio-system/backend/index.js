const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Try to connect to database, but continue if it fails
try {
  if (process.env.NODE_ENV !== 'development' || process.env.MONGO_REQUIRED === 'true') {
    connectDB();
    console.log('MongoDB connection attempted');
  } else {
    console.log('Running without MongoDB in development mode');
  }
} catch (err) {
  console.error('MongoDB connection failed, but continuing in development mode');
}

// Route files
const authRoutes = require('./routes/auth.routes');
const newsRoutes = require('./routes/news.routes');
const dataRoutes = require('./routes/data.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const tradingRoutes = require('./routes/trading.routes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trading', tradingRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'AI Portfolio System API' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 