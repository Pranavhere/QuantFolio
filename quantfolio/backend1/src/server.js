const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./config/db');
const config = require('./config/config');

const app = express();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stock'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/visualize', require('./routes/visualization'));
app.use('/api/market', require('./routes/market'));
app.use('/api/trades', require('./routes/trades'));

// Start server
connectMongo().then(() => {
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
});