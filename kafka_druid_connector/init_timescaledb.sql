-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create stock_market_data table
CREATE TABLE IF NOT EXISTS stock_market_data (
    time TIMESTAMPTZ NOT NULL,
    symbol TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    volume BIGINT NOT NULL,
    exchange TEXT NOT NULL,
    change_percent DECIMAL(10,2),
    rsi_14 DECIMAL(10,2),
    macd DECIMAL(10,2),
    macd_signal DECIMAL(10,2),
    macd_hist DECIMAL(10,2),
    sma_20 DECIMAL(10,2),
    sma_50 DECIMAL(10,2),
    sma_200 DECIMAL(10,2),
    bollinger_upper DECIMAL(10,2),
    bollinger_lower DECIMAL(10,2),
    atr DECIMAL(10,2),
    adx DECIMAL(10,2),
    diplus DECIMAL(10,2),
    diminus DECIMAL(10,2),
    stoch_k DECIMAL(10,2),
    stoch_d DECIMAL(10,2)
);

-- Create hypertable
SELECT create_hypertable('stock_market_data', 'time');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_market_data_symbol ON stock_market_data (symbol);
CREATE INDEX IF NOT EXISTS idx_stock_market_data_time_symbol ON stock_market_data (time, symbol); 