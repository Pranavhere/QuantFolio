const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stock_data',
  password: 'password',
  port: 5433,
});

// Initialize TimescaleDB
const initializeTimescaleDB = async () => {
  try {
    const client = await pool.connect();
    console.log('TimescaleDB connected successfully');
    client.release();
  } catch (error) {
    console.error('Error initializing TimescaleDB:', error);
    throw error;
  }
};

// Insert market data
const insertMarketData = async (data) => {
  const { time, symbol, price, volume, open, high, low, close } = data;
  
  try {
    await pool.query(
      `INSERT INTO market_data (time, symbol, price, volume, open, high, low, close)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [time, symbol, price, volume, open, high, low, close]
    );
  } catch (error) {
    console.error('Error inserting market data:', error);
    throw error;
  }
};

// Get historical data
const getHistoricalData = async (symbol, startTime, endTime, interval = '1h') => {
  try {
    const result = await pool.query(
      `SELECT time_bucket($1, time) AS bucket,
              first(price, time) as open,
              max(price) as high,
              min(price) as low,
              last(price, time) as close,
              sum(volume) as volume
       FROM market_data
       WHERE symbol = $2
         AND time >= $3
         AND time <= $4
       GROUP BY bucket
       ORDER BY bucket DESC`,
      [interval, symbol, startTime, endTime]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting historical data:', error);
    throw error;
  }
};

// Get latest price
const getLatestPrice = async (symbol) => {
  try {
    const result = await pool.query(
      `SELECT price, time
       FROM market_data
       WHERE symbol = $1
       ORDER BY time DESC
       LIMIT 1`,
      [symbol]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting latest price:', error);
    throw error;
  }
};

// Get price statistics
const getPriceStatistics = async (symbol, startTime, endTime) => {
  try {
    const result = await pool.query(
      `SELECT 
         avg(price) as avg_price,
         stddev(price) as stddev_price,
         min(price) as min_price,
         max(price) as max_price,
         sum(volume) as total_volume
       FROM market_data
       WHERE symbol = $1
         AND time >= $2
         AND time <= $3`,
      [symbol, startTime, endTime]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting price statistics:', error);
    throw error;
  }
};

// Cleanup
const cleanup = async () => {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error cleaning up TimescaleDB:', error);
  }
};

module.exports = {
  pool,
  initializeTimescaleDB,
  insertMarketData,
  getHistoricalData,
  getLatestPrice,
  getPriceStatistics,
  cleanup,
}; 