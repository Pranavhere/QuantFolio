#!/usr/bin/env python
import os
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from arch import arch_model
import scipy.stats as stats

# Import database utilities
from db_utils import fetch_stock_data, fetch_top200_volume_data, create_volatility_models_table, store_volatility_models
from garch_model import analyze_stocks_with_garch

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def calculate_risk_reward_metrics(symbol, lookback_days=120, adv15=None):
    """Calculate risk/reward metrics for a stock using data from TimescaleDB"""
    try:
        # Calculate date range for lookback
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=lookback_days * 1.5)  # Add buffer for market holidays
        
        # Fetch data from database
        stock_data = fetch_stock_data(symbol, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        
        if stock_data.empty or len(stock_data) < lookback_days * 0.7:  # Require at least 70% of the days
            logger.warning(f"Insufficient data for {symbol}: got {len(stock_data)} days, need at least {int(lookback_days * 0.7)}")
            return None
        
        # Calculate returns
        returns = calculate_returns(stock_data['close'])
        if len(returns) < 60:  # Need sufficient data
            logger.warning(f"Insufficient return data for {symbol}: got {len(returns)} points, need at least 60")
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
        
        result = {
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
        
        # Add ADV15 if provided
        if adv15 is not None:
            result['adv15'] = adv15
            
        return result
    except Exception as e:
        logger.error(f"Error calculating metrics for {symbol}: {e}")
        return None

def analyze_and_filter_stocks(symbols, lookback_days=120, top_n=50, adv15_dict=None):
    """Analyze and filter stocks based on risk/reward metrics"""
    results = []
    
    for i, symbol in enumerate(symbols):
        try:
            if (i + 1) % 10 == 0:
                logger.info(f"Processing {i+1}/{len(symbols)} stocks in volatility analysis")
                
            # Get ADV15 for this symbol if available
            adv15_value = adv15_dict.get(symbol) if adv15_dict else None
            
            metrics = calculate_risk_reward_metrics(symbol, lookback_days, adv15_value)
            
            if metrics:
                results.append(metrics)
        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}")
    
    # Convert to DataFrame
    if not results:
        logger.warning("No results generated from volatility analysis")
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
        
        # Volatility ratio score (preference for historical < implied, which suggests undervalued options)
        df['vol_ratio_score'] = df['vol_ratio'].clip(upper=1.0)
        
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
    
    # Display top N stocks
    logger.info("\nTop stocks by risk/reward score:")
    for i, (_, row) in enumerate(top_stocks.head(10).iterrows(), 1):
        log_msg = f"{i}. {row['symbol']} - Score: {row['risk_reward_score']:.4f}, " \
                 f"Return: {row['avg_return']:.4f}, Volatility: {row['volatility']:.4f}, " \
                 f"VaR(95%): {row['historical_var_95']:.4f}, Sharpe: {row['sharpe_ratio']:.4f}"
        
        # Add ADV15 if available
        if 'adv15' in row:
            log_msg += f", ADV15: {row['adv15']:,.0f}"
            
        logger.info(log_msg)
    
    return top_stocks

def get_top50_volatility_symbols():
    """Main function to run the stock filtering analysis and return top 50 symbols"""
    # Create volatility_models table if it doesn't exist
    create_volatility_models_table()
    
    # Get top 200 volume symbols
    logger.info("Fetching top 200 symbols by volume from database...")
    start_date = (datetime.now().date() - timedelta(days=30)).strftime('%Y-%m-%d')
    symbols, vol_data = fetch_top200_volume_data(start_date)
    
    if not symbols:
        logger.error("Failed to get top volume symbols. Please run volume filter first.")
        return {"symbols": []}
    
    # Create ADV15 dictionary from volume data
    logger.info(f"Found {len(symbols)} symbols from volume filter")
    
    # Create a mapping of symbols to ADV15 (avg_daily_volume)
    adv15_dict = {}
    if not vol_data.empty and 'symbol' in vol_data.columns:
        for _, row in vol_data.iterrows():
            symbol = row['symbol']
            if 'avg_daily_volume' in vol_data.columns:
                adv15_dict[symbol] = row['avg_daily_volume']
    
    # Analyze and filter stocks
    logger.info("Analyzing stocks for volatility metrics...")
    top_stocks = analyze_and_filter_stocks(symbols, lookback_days=120, top_n=50, adv15_dict=adv15_dict)
    
    if top_stocks.empty:
        logger.warning("No stocks passed the volatility filters")
        return {"symbols": []}
    
    # Store results in database
    store_volatility_models(top_stocks)
    
    # Return a dictionary with the top 50 symbols and their ADV15 values if available
    result = {
        "symbols": top_stocks['symbol'].tolist()
    }
    
    # Include ADV15 values if available
    if 'adv15' in top_stocks.columns:
        result["adv15"] = dict(zip(top_stocks['symbol'], top_stocks['adv15']))
    
    return result

def main():
    """Main function to run the volatility analysis and save results to the database"""
    logger.info("Starting volatility analysis for top 50 stocks...")
    result = get_top50_volatility_symbols()
    
    # Extract symbols for printing
    top_50_symbols = result["symbols"] if isinstance(result, dict) else result
    
    # Print the top 50 symbols
    if top_50_symbols:
        logger.info(f"Successfully identified top 50 symbols by volatility metrics")
        logger.info(f"Top 10 symbols by volatility metrics: {', '.join(top_50_symbols[:10])}")
    else:
        logger.warning("No symbols returned from volatility analysis")
    
    # Print ADV15 values if available
    if isinstance(result, dict) and "adv15" in result and top_50_symbols:
        logger.info("\nSample ADV15 values (first 5 symbols):")
        for i, symbol in enumerate(top_50_symbols[:5]):
            if symbol in result["adv15"]:
                logger.info(f"{symbol}: {result['adv15'][symbol]:,.0f}")
    
    return top_50_symbols

if __name__ == "__main__":
    main() 