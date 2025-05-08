const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const { initializeKafka } = require('./services/kafka.service');
const { initializeTimescaleDB } = require('./services/timescale.service');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Connect to database
connectDB();

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
const authRoutes = require('./routes/auth.routes');
const newsRoutes = require('./routes/news.routes');
const dataRoutes = require('./routes/data.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const assetRoutes = require('./routes/asset.routes');
const tradeRoutes = require('./routes/trade.routes');

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