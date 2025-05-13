QuantFolio Backend
Setup

Clone the repository:
cd C:\Users\91738\OneDrive\Documents\Major Project\QuantFolio\quantfolio_backend


Install dependencies:
npm install


Setup environment variables:

Create a .env file (see .env artifact).
Update MONGO_URI with your MongoDB Atlas connection string.
Set a secure JWT_SECRET.


Create the portfolio table in TimescaleDB:
docker exec -it timescaledb psql -U postgres -d stock_data

CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    adjusted_price DECIMAL(10, 2) NOT NULL,
    cost_or_proceeds DECIMAL(10, 2) NOT NULL,
    cash_after DECIMAL(10, 2) NOT NULL
);
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX idx_portfolio_symbol ON portfolio(symbol);


Run the server:
npm run dev



API Endpoints

Auth:
POST /api/auth/register - Register a user.
POST /api/auth/login - Login and get JWT.


Stocks:
GET /api/stocks/symbols - List all symbols.
GET /api/stocks/technical/:symbol - Get technical indicators.
GET /api/stocks/top-performers - Get top performers.
GET /api/stocks/volatility - Get most volatile stocks.
GET /api/stocks/summary - Get summary insights.


Portfolio:
POST /api/portfolio/buy - Buy a stock.
POST /api/portfolio/sell - Sell a stock.
GET /api/portfolio/state - Get portfolio state.
GET /api/portfolio/metrics - Get performance metrics.


Visualization:
GET /api/visualize/:symbol - Get price/volume chart (base64).



Notes

Ensure TimescaleDB is running (docker ps).
Test endpoints with Postman or a frontend.

