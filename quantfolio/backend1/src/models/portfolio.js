const { pgPool } = require('../config/db');
const moment = require('moment');

class Portfolio {
    constructor(userId, portfolioId = null) {
        this.userId = userId;
        this.portfolioId = portfolioId || `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = `Portfolio_${this.portfolioId.split('_')[1]}`;
        this.cash = 100000; // Starting cash
        this.holdings = {};
        this.transactions = [];
        this.performance = { portfolioValues: [], timestamps: [], returns: [] };
        this.state = { transactions: [] };
    }

    async loadState() {
        try {
            const result = await pgPool.query(
                'SELECT * FROM portfolios WHERE user_id = $1 AND portfolio_id = $2',
                [this.userId, this.portfolioId]
            );
            
            if (result.rows.length === 0) {
                console.log('No portfolio found for user:', this.userId, 'portfolio:', this.portfolioId);
                return;
            }

            const portfolio = result.rows[0];
            console.log('Loading portfolio state:', {
                portfolioId: this.portfolioId,
                hasHoldings: !!portfolio.holdings,
                hasTransactions: !!portfolio.transactions,
                hasPerformance: !!portfolio.performance
            });

            this.name = portfolio.name;
            this.cash = portfolio.cash || 100000; // Default to 100000 if not set

            try {
                this.holdings = typeof portfolio.holdings === 'string' ? 
                    JSON.parse(portfolio.holdings) : 
                    (portfolio.holdings || {});
            } catch (e) {
                console.error('Error parsing holdings:', e);
                this.holdings = {};
            }

            try {
                this.transactions = typeof portfolio.transactions === 'string' ? 
                    JSON.parse(portfolio.transactions) : 
                    (portfolio.transactions || []);
            } catch (e) {
                console.error('Error parsing transactions:', e);
                this.transactions = [];
            }

            try {
                this.performance = typeof portfolio.performance === 'string' ? 
                    JSON.parse(portfolio.performance) : 
                    (portfolio.performance || { portfolioValues: [], timestamps: [], returns: [] });
            } catch (e) {
                console.error('Error parsing performance:', e);
                this.performance = { portfolioValues: [], timestamps: [], returns: [] };
            }

            // Initialize state with transactions
            this.state = {
                transactions: this.transactions || []
            };

            console.log('Successfully loaded portfolio state');
        } catch (error) {
            console.error('Error in loadState:', error);
            throw error;
        }
    }

    async saveState() {
        const now = new Date().toISOString();
        await pgPool.query(
            `INSERT INTO portfolios (user_id, portfolio_id, name, cash, holdings, transactions, performance, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (user_id, portfolio_id)
             DO UPDATE SET name = $3, cash = $4, holdings = $5, transactions = $6, performance = $7, updated_at = $9`,
            [
                this.userId,
                this.portfolioId,
                this.name,
                this.cash,
                JSON.stringify(this.holdings),
                JSON.stringify(this.transactions),
                JSON.stringify(this.performance),
                now,
                now
            ]
        );
    }

    async createPortfolio(name) {
        this.name = name;
        this.cash = 100000;
        this.holdings = {};
        this.transactions = [];
        this.performance = { portfolioValues: [], timestamps: [], returns: [] };

        // Simulate initial performance data for 90 days
        const startDate = moment().subtract(90, 'days');
        for (let i = 0; i < 90; i++) {
            const date = startDate.clone().add(i, 'days').format('YYYY-MM-DD');
            const value = this.cash * (1 + (Math.random() * 0.02 - 0.01)); // Random fluctuation
            this.performance.portfolioValues.push(value);
            this.performance.timestamps.push(date);
            if (i > 0) {
                const prevValue = this.performance.portfolioValues[i - 1];
                const dailyReturn = (value - prevValue) / prevValue;
                this.performance.returns.push(dailyReturn);
            }
        }
        if (this.performance.returns.length === 0) this.performance.returns.push(0);

        await this.saveState();
    }

    async buy(symbol, price, quantity, date) {
        const cost = price * quantity;
        if (cost > this.cash) return false;

        this.cash -= cost;
        this.holdings[symbol] = (this.holdings[symbol] || 0) + quantity;
        this.transactions.push({ type: 'buy', symbol, price, quantity, date: date.toISOString() });

        // Update performance
        await this.updatePerformance(date);
        await this.saveState();
        return true;
    }

    async sell(symbol, price, quantity, date) {
        if (!this.holdings[symbol] || this.holdings[symbol] < quantity) return false;

        this.holdings[symbol] -= quantity;
        if (this.holdings[symbol] === 0) delete this.holdings[symbol];
        this.cash += price * quantity;
        this.transactions.push({ type: 'sell', symbol, price, quantity, date: date.toISOString() });

        // Update performance
        await this.updatePerformance(date);
        await this.saveState();
        return true;
    }

    async updatePerformance(date) {
        // Fetch current prices for holdings
        const symbols = Object.keys(this.holdings);
        let totalValue = this.cash;

        if (symbols.length > 0) {
            const priceData = await pgPool.query(
                'SELECT symbol, close FROM nse500_data WHERE date = (SELECT MAX(date) FROM nse500_data WHERE date <= $1) AND symbol = ANY($2)',
                [date, symbols]
            );

            const prices = priceData.rows.reduce((acc, row) => {
                acc[row.symbol] = row.close;
                return acc;
            }, {});

            for (const symbol of symbols) {
                if (prices[symbol]) {
                    totalValue += prices[symbol] * this.holdings[symbol];
                }
            }
        }

        const timestamp = moment(date).format('YYYY-MM-DD');
        const lastIndex = this.performance.timestamps.length - 1;
        if (lastIndex >= 0 && this.performance.timestamps[lastIndex] === timestamp) {
            // Update the last entry
            this.performance.portfolioValues[lastIndex] = totalValue;
            if (lastIndex > 0) {
                const prevValue = this.performance.portfolioValues[lastIndex - 1];
                this.performance.returns[lastIndex - 1] = (totalValue - prevValue) / prevValue;
            }
        } else {
            // Add a new entry
            this.performance.timestamps.push(timestamp);
            this.performance.portfolioValues.push(totalValue);
            if (this.performance.portfolioValues.length > 1) {
                const prevValue = this.performance.portfolioValues[this.performance.portfolioValues.length - 2];
                const dailyReturn = (totalValue - prevValue) / prevValue;
                this.performance.returns.push(dailyReturn);
            }
        }
    }

    async calculateMetrics() {
        const values = this.performance.portfolioValues;
        const returns = this.performance.returns;

        const totalReturn = values.length > 1 ? (values[values.length - 1] / values[0]) - 1 : 0;
        const annualizedReturn = values.length > 1 ? Math.pow(1 + totalReturn, 252 / (values.length - 1)) - 1 : 0;

        const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = returns.length > 1 ? Math.sqrt(
            returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
        ) : 0;
        const sharpeRatio = stdDev !== 0 ? (annualizedReturn - 0.03) / (stdDev * Math.sqrt(252)) : 0; // Assuming risk-free rate of 3%

        const cumulativeReturns = [];
        let cumulative = 1;
        for (const r of returns) {
            cumulative *= (1 + r);
            cumulativeReturns.push(cumulative);
        }

        let maxDrawdown = 0;
        let runningMax = 1;
        for (const cr of cumulativeReturns) {
            runningMax = Math.max(runningMax, cr);
            const drawdown = (cr / runningMax) - 1;
            maxDrawdown = Math.min(maxDrawdown, drawdown);
        }

        const winRate = returns.length > 0 ? returns.filter(r => r > 0).length / returns.length : 0;

        return {
            totalReturn,
            annualizedReturn,
            sharpeRatio,
            maxDrawdown,
            winRate,
            portfolioValues: this.performance.portfolioValues,
            timestamps: this.performance.timestamps,
            returns,
            drawdowns: cumulativeReturns.map((cr, i) => {
                const maxSoFar = Math.max(...cumulativeReturns.slice(0, i + 1));
                return (cr / maxSoFar) - 1;
            })
        };
    }

    async optimize() {
        // Simple optimization: Adjust holdings to minimize risk (volatility)
        const symbols = Object.keys(this.holdings);
        if (symbols.length === 0) return { message: 'No holdings to optimize' };

        // Fetch historical data for volatility calculation
        const data = await pgPool.query(
            `SELECT symbol, close FROM nse500_data 
             WHERE symbol = ANY($1) AND date >= $2 
             ORDER BY date ASC`,
            [symbols, moment().subtract(90, 'days').format('YYYY-MM-DD')]
        );

        const pricesBySymbol = data.rows.reduce((acc, row) => {
            if (!acc[row.symbol]) acc[row.symbol] = [];
            acc[row.symbol].push(row.close);
            return acc;
        }, {});

        // Calculate volatility for each symbol
        const volatilities = {};
        for (const symbol of symbols) {
            const prices = pricesBySymbol[symbol];
            if (prices && prices.length > 1) {
                const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
                const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
                volatilities[symbol] = Math.sqrt(variance);
            } else {
                volatilities[symbol] = 0;
            }
        }

        // Rebalance: Allocate more to less volatile stocks
        const totalVolatility = Object.values(volatilities).reduce((a, b) => a + b, 0);
        if (totalVolatility === 0) return { message: 'Unable to calculate volatility' };

        const totalQuantity = Object.values(this.holdings).reduce((a, b) => a + b, 0);
        const newHoldings = {};
        for (const symbol of symbols) {
            const weight = (totalVolatility - volatilities[symbol]) / (totalVolatility * (symbols.length - 1));
            newHoldings[symbol] = Math.round(totalQuantity * weight);
        }

        // Update holdings
        this.holdings = newHoldings;
        await this.updatePerformance(new Date());
        await this.saveState();
        return { message: 'Portfolio optimized', newHoldings };
    }

    static async getPortfolios(userId) {
        const result = await pgPool.query(
            'SELECT * FROM portfolios WHERE user_id = $1',
            [userId]
        );
        return result.rows;
    }

    async getPortfolioState(prices) {
        let totalValue = this.cash;
        for (const symbol in this.holdings) {
            if (prices[symbol]) {
                totalValue += prices[symbol] * this.holdings[symbol];
            }
        }
        return {
            cash: this.cash,
            holdings: this.holdings,
            totalValue,
            transactions: this.transactions.slice(-5) // Last 5 transactions
        };
    }

    calculateTotalValue() {
        try {
            console.log('Calculating total value for portfolio:', this.portfolioId);
            console.log('Current holdings:', this.holdings);
            console.log('Current cash:', this.cash);
            
            let totalValue = this.cash || 0;
            
            // Add value of holdings if we have any
            if (this.holdings && Object.keys(this.holdings).length > 0) {
                // For now, just use the cash value since we don't have real-time prices
                // In a real implementation, you would fetch current prices for each holding
                console.log('Holdings present but using cash value only');
            }
            
            console.log('Calculated total value:', totalValue);
            return totalValue;
        } catch (error) {
            console.error('Error calculating total value:', error);
            return this.cash || 0; // Return cash value as fallback
        }
    }
}

module.exports = Portfolio;