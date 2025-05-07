#!/usr/bin/env python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime


class Portfolio:
    """
    Portfolio class for simulating and tracking trading performance.
    
    This class handles:
    - Maintaining portfolio balance
    - Tracking positions (long, short, cash)
    - Calculating returns, drawdowns, and performance metrics
    - Simulating buy/sell trades with various constraints (commission, slippage)
    """
    
    def __init__(self, initial_capital=100000.0, commission=0.001, slippage=0.001):
        """
        Initialize the portfolio
        
        Parameters:
        -----------
        initial_capital : float, default 100000.0
            Starting capital amount
        commission : float, default 0.001 (0.1%)
            Commission rate for each trade
        slippage : float, default 0.001 (0.1%)
            Slippage rate for each trade
        """
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.commission = commission
        self.slippage = slippage
        
        # Portfolio tracking
        self.positions = {}  # Symbol -> quantity mapping
        self.cash = initial_capital
        self.transactions = []
        
        # Performance tracking
        self.portfolio_values = []
        self.timestamps = []
        self.returns = []
        self.equity_curve = pd.DataFrame()
    
    def buy(self, symbol, price, quantity, timestamp):
        """
        Execute a buy order
        
        Parameters:
        -----------
        symbol : str
            Symbol/ticker of the asset
        price : float
            Purchase price
        quantity : int or float
            Quantity to purchase
        timestamp : datetime
            Time of the transaction
        
        Returns:
        --------
        bool
            True if the order was executed, False otherwise
        """
        # Apply slippage to the price (higher for buys)
        adjusted_price = price * (1 + self.slippage)
        
        # Calculate total cost with commission
        total_cost = adjusted_price * quantity * (1 + self.commission)
        
        # Check if enough cash is available
        if total_cost > self.cash:
            return False
        
        # Update cash and positions
        self.cash -= total_cost
        if symbol in self.positions:
            self.positions[symbol] += quantity
        else:
            self.positions[symbol] = quantity
        
        # Record the transaction
        self.transactions.append({
            'timestamp': timestamp,
            'symbol': symbol,
            'action': 'BUY',
            'price': price,
            'adjusted_price': adjusted_price,
            'quantity': quantity,
            'cost': total_cost,
            'cash_after': self.cash
        })
        
        return True
    
    def sell(self, symbol, price, quantity, timestamp):
        """
        Execute a sell order
        
        Parameters:
        -----------
        symbol : str
            Symbol/ticker of the asset
        price : float
            Selling price
        quantity : int or float
            Quantity to sell
        timestamp : datetime
            Time of the transaction
        
        Returns:
        --------
        bool
            True if the order was executed, False otherwise
        """
        # Check if position exists
        if symbol not in self.positions or self.positions[symbol] < quantity:
            return False
        
        # Apply slippage to the price (lower for sells)
        adjusted_price = price * (1 - self.slippage)
        
        # Calculate proceeds after commission
        proceeds = adjusted_price * quantity * (1 - self.commission)
        
        # Update cash and positions
        self.cash += proceeds
        self.positions[symbol] -= quantity
        
        # Remove the position if quantity is zero
        if self.positions[symbol] == 0:
            del self.positions[symbol]
        
        # Record the transaction
        self.transactions.append({
            'timestamp': timestamp,
            'symbol': symbol,
            'action': 'SELL',
            'price': price,
            'adjusted_price': adjusted_price,
            'quantity': quantity,
            'proceeds': proceeds,
            'cash_after': self.cash
        })
        
        return True
    
    def update_portfolio_value(self, price_data, timestamp):
        """
        Update the portfolio value based on current market prices
        
        Parameters:
        -----------
        price_data : dict
            Dictionary mapping symbols to their current prices
        timestamp : datetime
            Current timestamp
        """
        # Calculate the value of all positions
        positions_value = sum(
            self.positions.get(symbol, 0) * price
            for symbol, price in price_data.items()
        )
        
        # Calculate total portfolio value
        portfolio_value = self.cash + positions_value
        
        # Track the portfolio value over time
        self.portfolio_values.append(portfolio_value)
        self.timestamps.append(timestamp)
        self.current_capital = portfolio_value
        
        # Calculate returns
        if len(self.portfolio_values) > 1:
            daily_return = (portfolio_value / self.portfolio_values[-2]) - 1
        else:
            daily_return = 0
        
        self.returns.append(daily_return)
    
    def get_portfolio_state(self):
        """
        Get the current state of the portfolio
        
        Returns:
        --------
        dict
            Dictionary containing portfolio state information
        """
        return {
            'cash': self.cash,
            'positions': self.positions.copy(),
            'portfolio_value': self.portfolio_values[-1] if self.portfolio_values else self.cash,
            'returns': self.returns[-1] if self.returns else 0,
            'total_return': (self.portfolio_values[-1] / self.initial_capital - 1) 
                            if self.portfolio_values else 0
        }
    
    def calculate_metrics(self):
        """
        Calculate portfolio performance metrics
        
        Returns:
        --------
        dict
            Dictionary containing portfolio performance metrics
        """
        if not self.portfolio_values:
            return {
                'total_return': 0,
                'annualized_return': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'win_rate': 0
            }
        
        # Create a DataFrame to store the portfolio values and timestamps
        self.equity_curve = pd.DataFrame({
            'timestamp': self.timestamps,
            'portfolio_value': self.portfolio_values,
            'return': self.returns
        })
        self.equity_curve.set_index('timestamp', inplace=True)
        
        # Calculate daily returns
        daily_returns = pd.Series(self.returns)
        
        # Calculate total return
        total_return = (self.portfolio_values[-1] / self.initial_capital) - 1
        
        # Calculate annualized return (assuming 252 trading days per year)
        n_days = len(self.portfolio_values)
        annualized_return = ((1 + total_return) ** (252 / n_days)) - 1 if n_days > 0 else 0
        
        # Calculate Sharpe ratio (assuming risk-free rate is 0)
        sharpe_ratio = daily_returns.mean() / daily_returns.std() * np.sqrt(252) if daily_returns.std() != 0 else 0
        
        # Calculate maximum drawdown
        cumulative_returns = (1 + pd.Series(self.returns)).cumprod()
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns / running_max) - 1
        max_drawdown = drawdown.min()
        
        # Calculate win rate from transactions
        if self.transactions:
            buy_transactions = {t['symbol']: t for t in self.transactions if t['action'] == 'BUY'}
            sell_transactions = {t['symbol']: t for t in self.transactions if t['action'] == 'SELL'}
            
            # Match buys and sells to determine winning trades
            winning_trades = sum(
                1 for symbol in sell_transactions
                if symbol in buy_transactions and 
                sell_transactions[symbol]['adjusted_price'] > buy_transactions[symbol]['adjusted_price']
            )
            
            win_rate = winning_trades / len(sell_transactions) if sell_transactions else 0
        else:
            win_rate = 0
        
        return {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate
        }
    
    def plot_performance(self, title="Portfolio Performance"):
        """
        Plot portfolio performance metrics
        
        Parameters:
        -----------
        title : str, default "Portfolio Performance"
            Title for the performance plot
        """
        if not self.portfolio_values:
            print("No portfolio data to plot")
            return
        
        # Calculate metrics
        metrics = self.calculate_metrics()
        
        # Create a figure with subplots
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), gridspec_kw={'height_ratios': [3, 1]})
        
        # Plot portfolio value
        ax1.plot(self.timestamps, self.portfolio_values, label='Portfolio Value')
        ax1.set_title(f"{title}\nTotal Return: {metrics['total_return']:.2%}, Sharpe: {metrics['sharpe_ratio']:.2f}")
        ax1.set_ylabel('Portfolio Value ($)')
        ax1.grid(True)
        ax1.legend()
        
        # Plot daily returns
        ax2.bar(self.timestamps, self.returns)
        ax2.set_ylabel('Daily Returns')
        ax2.set_xlabel('Date')
        ax2.grid(True)
        
        plt.tight_layout()
        plt.show()
        
        # Additional plots - Drawdown
        cumulative_returns = (1 + pd.Series(self.returns)).cumprod()
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns / running_max) - 1
        
        plt.figure(figsize=(12, 5))
        plt.plot(self.timestamps, drawdown, color='red')
        plt.fill_between(self.timestamps, drawdown, 0, color='red', alpha=0.3)
        plt.title(f"Drawdown (Max: {metrics['max_drawdown']:.2%})")
        plt.ylabel('Drawdown')
        plt.xlabel('Date')
        plt.grid(True)
        plt.show() 