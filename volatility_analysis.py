#!/usr/bin/env python
import os
import pandas as pd
import numpy as np
import logging
from datetime import datetime
import matplotlib.pyplot as plt
from arch import arch_model
import scipy.stats as stats

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_stock_data(file_path):
    """Load stock price data from CSV file"""
    try:
        df = pd.read_csv(file_path)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df = df.sort_index()
        return df
    except Exception as e:
        logger.error(f"Error loading data from {file_path}: {e}")
        return None

def calculate_returns(prices):
    """Calculate log returns from price series"""
    return 100 * np.log(prices / prices.shift(1)).dropna()

def fit_garch_model(returns, p=1, q=1):
    """Fit a GARCH model to return series"""
    try:
        model = arch_model(returns, p=p, q=q, mean='Constant', vol='GARCH', dist='normal')
        model_fit = model.fit(disp='off')
        return model_fit
    except Exception as e:
        logger.warning(f"GARCH model fitting failed: {e}")
        return None

def calculate_historical_var(returns, confidence_level=0.95, lookback_days=60):
    """Calculate historical Value at Risk"""
    if returns.empty or len(returns) < lookback_days:
        return np.nan
    
    # Get recent returns for VaR calculation
    recent_returns = returns.iloc[-lookback_days:]
    
    # Calculate VaR
    var = -np.percentile(recent_returns, 100 * (1 - confidence_level))
    return var

def calculate_risk_reward_metrics(symbol, data_path, lookback_days=120):
    """Calculate risk/reward metrics for a stock"""
    try:
        # Load data
        stock_data = load_stock_data(data_path)
        if stock_data is None or len(stock_data) < lookback_days:
            return None
        
        # Calculate returns
        returns = calculate_returns(stock_data['close'])
        if len(returns) < 60:  # Need sufficient data
            return None
        
        # Fit GARCH model
        garch_result = fit_garch_model(returns)
        
        # Calculate metrics
        avg_return = returns.mean()
        volatility = returns.std() * np.sqrt(252)  # Annualized
        
        # Calculate VaR
        historical_var_95 = calculate_historical_var(returns, 0.95, 60)
        
        # Calculate GARCH metrics if model fit was successful
        if garch_result is not None:
            # Extract parameters
            params = garch_result.params
            alpha = params.get('alpha[1]', 0)
            beta = params.get('beta[1]', 0)
            persistence = alpha + beta
            
            # Forecast volatility
            forecast = garch_result.forecast(horizon=5)
            forecast_vol = np.sqrt(forecast.variance.iloc[-1].mean() * 252)  # Annualized
            
            # Calculate implied volatility (from GARCH)
            implied_vol = forecast_vol
        else:
            persistence = np.nan
            forecast_vol = np.nan
            implied_vol = np.nan
        
        # Calculate realized vs implied volatility ratio
        historical_vol = volatility  # Historical/realized volatility
        vol_ratio = historical_vol / implied_vol if implied_vol > 0 and not np.isnan(implied_vol) else np.nan
        
        # Calculate risk/reward ratio
        if historical_var_95 > 0:
            return_to_var_ratio = avg_return / historical_var_95
        else:
            return_to_var_ratio = np.nan
            
        if volatility > 0:
            sharpe_ratio = avg_return / volatility
        else:
            sharpe_ratio = np.nan
        
        return {
            'symbol': symbol,
            'avg_return': avg_return,
            'volatility': volatility,
            'historical_var_95': historical_var_95,
            'persistence': persistence,
            'forecast_volatility': forecast_vol,
            'implied_volatility': implied_vol,
            'vol_ratio': vol_ratio,
            'return_to_var_ratio': return_to_var_ratio,
            'sharpe_ratio': sharpe_ratio
        }
    except Exception as e:
        logger.error(f"Error calculating metrics for {symbol}: {e}")
        return None

def analyze_and_filter_stocks(symbols, data_dir, top_n=50):
    """Analyze and filter stocks based on risk/reward metrics"""
    results = []
    
    for i, symbol in enumerate(symbols):
        try:
            file_path = os.path.join(data_dir, f"{symbol}.csv")
            if not os.path.exists(file_path):
                logger.warning(f"Data file for {symbol} not found")
                continue
                
            if (i + 1) % 10 == 0:
                logger.info(f"Processing {i+1}/{len(symbols)} stocks")
                
            metrics = calculate_risk_reward_metrics(symbol, file_path)
            
            if metrics:
                results.append(metrics)
        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}")
    
    # Convert to DataFrame
    if not results:
        return pd.DataFrame()
    
    df = pd.DataFrame(results)
    
    # Calculate combined risk/reward score
    try:
        # Normalize return (higher is better)
        df['return_score'] = (df['avg_return'] - df['avg_return'].min()) / \
                           (df['avg_return'].max() - df['avg_return'].min())
        
        # Normalize volatility (lower is better)
        df['volatility_score'] = 1 - (df['volatility'] / df['volatility'].max())
        
        # Normalize VaR (lower is better)
        df['var_score'] = 1 - (df['historical_var_95'] / df['historical_var_95'].max())
        
        # Normalize implied vol (mixed - we want moderate, not too high or low)
        mean_implied_vol = df['implied_volatility'].mean()
        df['implied_vol_score'] = 1 - abs(df['implied_volatility'] - mean_implied_vol) / df['implied_volatility'].max()
        
        # Combined score (customize weights based on your strategy)
        df['risk_reward_score'] = (
            0.35 * df['return_score'] +       # Return component (higher weight for return)
            0.20 * df['volatility_score'] +    # Volatility component
            0.20 * df['var_score'] +           # VaR risk component
            0.15 * df['sharpe_ratio'].clip(lower=0) +  # Sharpe ratio component (normalized already)
            0.10 * df['implied_vol_score']     # Implied volatility component
        )
    except Exception as e:
        logger.error(f"Error calculating scores: {e}")
        # If scoring fails, just sort by Sharpe ratio
        if 'sharpe_ratio' in df.columns:
            df['risk_reward_score'] = df['sharpe_ratio']
    
    # Sort by risk/reward score in descending order (higher is better)
    df = df.sort_values('risk_reward_score', ascending=False)
    
    # Filter top N stocks
    top_stocks = df.head(top_n)
    
    return top_stocks

def plot_risk_reward(df, output_file='risk_reward_plot.png'):
    """Generate a risk vs reward scatter plot with the top stocks highlighted"""
    if df.empty:
        logger.warning("Cannot create plot: DataFrame is empty")
        return
    
    try:
        plt.figure(figsize=(12, 8))
        
        # Use historical volatility for X-axis (risk)
        x = df['volatility']
        # Use average return for Y-axis (reward)
        y = df['avg_return']
        
        # Scatter plot with color based on risk/reward score
        scatter = plt.scatter(x, y, c=df['risk_reward_score'], cmap='viridis', 
                            alpha=0.7, s=50, edgecolors='k', linewidths=0.5)
        
        # Add colorbar
        cbar = plt.colorbar(scatter)
        cbar.set_label('Risk/Reward Score')
        
        # Highlight top 10 stocks
        top_10 = df.head(10)
        plt.scatter(top_10['volatility'], top_10['avg_return'], 
                color='red', s=100, alpha=0.8, marker='*', label='Top 10')
        
        # Add labels for top 10 stocks
        for i, row in top_10.iterrows():
            plt.annotate(row['symbol'], 
                        (row['volatility'], row['avg_return']),
                        xytext=(5, 5), textcoords='offset points',
                        fontsize=8, fontweight='bold')
        
        # Add labels and title
        plt.xlabel('Volatility (Risk)')
        plt.ylabel('Average Return (Reward)')
        plt.title('Risk vs Reward Analysis of Volume-Filtered Stocks')
        plt.grid(True, alpha=0.3)
        plt.legend()
        
        # Save plot
        plt.tight_layout()
        plt.savefig(output_file)
        logger.info(f"Plot saved to {output_file}")
        
        plt.close()
    except Exception as e:
        logger.error(f"Error generating plot: {e}")

def get_top_volume_symbols():
    """Get top 200 symbols sorted by volume/market cap from fetch_volume.py"""
    try:
        # First try to import the function directly
        try:
            # Use absolute import to be sure
            from fetch_volume import main as fetch_volume_main
            logger.info("Running fetch_volume.main() to get fresh top 200 symbols...")
            symbols = fetch_volume_main()
            if symbols and len(symbols) >= 200:
                logger.info(f"Successfully retrieved {len(symbols)} symbols from fetch_volume.main()")
                return symbols[:200]  # Ensure we only take 200
        except Exception as e:
            logger.warning(f"Could not run fetch_volume.main(): {e}")
        
        # Try to import the get_top_200_symbols function
        try:
            from fetch_volume import get_top_200_symbols
            logger.info("Trying get_top_200_symbols function...")
            symbols = get_top_200_symbols()
            if symbols and len(symbols) > 0:
                logger.info(f"Successfully imported {len(symbols)} symbols from get_top_200_symbols()")
                return symbols
        except Exception as e:
            logger.warning(f"Could not import symbols from get_top_200_symbols: {e}")
             
        # Fallback to checking for existing volume analysis files
        volume_files = [f for f in os.listdir() if f.startswith('top_volatility_stocks_')]
        if volume_files:
            latest_file = max(volume_files, key=os.path.getctime)
            df = pd.read_csv(latest_file)
            symbols = df['symbol'].tolist()
            logger.info(f"Loaded {len(symbols)} symbols from {latest_file}")
            return symbols[:200]  # Limit to 200
            
        # Last resort - just use the first 200 symbols from the data directory
        data_dir = "nifty500_1day_ticker"
        csv_files = [f.replace('.csv', '') for f in os.listdir(data_dir) if f.endswith('.csv')]
        symbols = csv_files[:200]
        logger.info(f"Using first {len(symbols)} symbols from data directory")
        return symbols
            
    except Exception as e:
        logger.error(f"Error getting volume symbols: {e}")
        return []

def main():
    """Main function to run the stock filtering analysis"""
    # Directory containing stock price data
    data_dir = "nifty500_1day_ticker"
    
    # Get the top 200 volume-filtered symbols
    logger.info("Getting top 200 symbols filtered by volume...")
    volume_filtered_symbols = get_top_volume_symbols()
    
    if not volume_filtered_symbols:
        logger.warning("No volume-filtered symbols found, falling back to all symbols")
        # Fallback to all symbols if needed
        csv_files = [f.replace('.csv', '') for f in os.listdir(data_dir) if f.endswith('.csv')]
        volume_filtered_symbols = csv_files[:200]  # Limit to 200
    
    logger.info(f"Analyzing {len(volume_filtered_symbols)} volume-filtered stocks...")
    
    # Analyze and filter stocks based on GARCH and VaR models
    top_stocks = analyze_and_filter_stocks(volume_filtered_symbols, data_dir, top_n=50)
    
    if top_stocks.empty:
        logger.warning("No stocks passed the volatility filters")
        return []
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    top_stocks_file = f"top50_volatility_stocks_{timestamp}.csv"
    
    top_stocks.to_csv(top_stocks_file, index=False)
    logger.info(f"Top 50 stocks saved to {top_stocks_file}")
    
    # Save just the list of top 50 symbols
    top_symbols_file = f"top50_volatility_symbols_{timestamp}.txt"
    with open(top_symbols_file, 'w') as f:
        f.write('\n'.join(top_stocks['symbol'].tolist()))
    logger.info(f"Top 50 symbols list saved to {top_symbols_file}")
    
    # Generate visualization
    plot_file = f"risk_reward_plot_{timestamp}.png"
    plot_risk_reward(top_stocks, output_file=plot_file)
    
    # Display top 10 stocks
    logger.info("\nTop 10 stocks by risk/reward score:")
    for i, (_, row) in enumerate(top_stocks.head(10).iterrows(), 1):
        logger.info(f"{i}. {row['symbol']} - Score: {row['risk_reward_score']:.4f}, "
                  f"Return: {row['avg_return']:.4f}, Volatility: {row['volatility']:.4f}, "
                  f"VaR(95%): {row['historical_var_95']:.4f}, Sharpe: {row['sharpe_ratio']:.4f}")
    
    return top_stocks['symbol'].tolist()

if __name__ == "__main__":
    logger.info("Starting volatility-based stock filtering on volume-filtered symbols...")
    top_50_symbols = main()
    logger.info("Analysis completed.") 