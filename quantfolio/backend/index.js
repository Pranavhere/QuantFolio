const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/error');
const { initializeKafka } = require('./services/kafka.service');
const { initializeTimescaleDB } = require('./services/timescale.service');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const portfolioRoutes = require('./src/routes/portfolio.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantfolio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!'
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    await initializeKafka();
    await initializeTimescaleDB();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
}
};

// Route files
const newsRoutes = require('./routes/news.routes');
const dataRoutes = require('./routes/data.routes');
const assetRoutes = require('./routes/asset.routes');
const tradeRoutes = require('./routes/trade.routes');

// Mount routers
app.use('/api/news', newsRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/portfolio/:portfolioId/assets', assetRoutes);
app.use('/api/portfolio/:portfolioId/trades', tradeRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'AI Portfolio System API' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

// Initialize services before starting the server
initializeServices().then(() => {
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
}); 