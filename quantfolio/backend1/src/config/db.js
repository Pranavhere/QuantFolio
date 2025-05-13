const { Pool } = require('pg');
const mongoose = require('mongoose');
const config = require('./config');

// TimescaleDB connection
const pgPool = new Pool({
    host: config.pgHost,
    port: config.pgPort,
    user: config.pgUser,
    password: config.pgPassword,
    database: config.pgDatabase
});

// MongoDB connection
const connectMongo = async () => {
    try {
        await mongoose.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create TimescaleDB tables if they don't exist
const initTables = async () => {
    try {
        // Stock data table (already exists as per previous setup)
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS nse500_data (
                date DATE NOT NULL,
                symbol TEXT NOT NULL,
                close FLOAT NOT NULL,
                volume BIGINT NOT NULL,
                PRIMARY KEY (date, symbol)
            );
        `);

        // Convert to hypertable for TimescaleDB
        await pgPool.query(`
            SELECT create_hypertable('nse500_data', 'date', if_not_exists => TRUE);
        `);

        // Portfolio table
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS portfolios (
                user_id TEXT NOT NULL,
                portfolio_id TEXT NOT NULL,
                name TEXT NOT NULL,
                cash FLOAT NOT NULL,
                holdings JSONB NOT NULL,
                transactions JSONB NOT NULL,
                performance JSONB NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                PRIMARY KEY (user_id, portfolio_id)
            );
        `);

        // Convert to hypertable (optional, since we're not using time-series for portfolios)
        console.log('Tables initialized');
    } catch (error) {
        console.error('Error initializing tables:', error);
        process.exit(1);
    }
};

initTables();

module.exports = { pgPool, connectMongo };