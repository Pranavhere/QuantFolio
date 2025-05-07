#!/usr/bin/env python
import pandas as pd
import numpy as np
import scipy.stats as stats
from arch.univariate import ARCHModelResult
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def calculate_historical_var(returns, confidence_level=0.95, lookback_days=60):
    """
    Calculate historical Value at Risk
    
    Parameters:
    - returns: Series of historical returns
    - confidence_level: Confidence level for VaR (e.g., 0.95 for 95%)
    - lookback_days: Number of days to use for historical window
    
    Returns:
    - VaR value (positive number representing loss)
    """
    if returns.empty or len(returns) < lookback_days:
        return np.nan
    
    # Get recent returns for VaR calculation
    recent_returns = returns.iloc[-lookback_days:]
    
    # Calculate VaR
    var = -np.percentile(recent_returns, 100 * (1 - confidence_level))
    return var

def calculate_parametric_var(returns, confidence_level=0.95):
    """
    Calculate parametric Value at Risk assuming normal distribution
    
    Parameters:
    - returns: Series of returns
    - confidence_level: Confidence level for VaR (e.g., 0.95 for 95%)
    
    Returns:
    - VaR value (positive number representing loss)
    """
    if returns.empty:
        return np.nan
    
    # Calculate mean and standard deviation
    mu = returns.mean()
    sigma = returns.std()
    
    # Calculate VaR
    z_score = stats.norm.ppf(1 - confidence_level)
    var = -(mu + z_score * sigma)
    return var

def calculate_conditional_var(returns, confidence_level=0.95):
    """
    Calculate Conditional Value at Risk (Expected Shortfall)
    
    Parameters:
    - returns: Series of returns
    - confidence_level: Confidence level for CVaR (e.g., 0.95 for 95%)
    
    Returns:
    - CVaR value (positive number representing expected loss beyond VaR)
    """
    if returns.empty:
        return np.nan
    
    # Calculate threshold return based on VaR
    var_threshold = -calculate_historical_var(returns, confidence_level)
    
    # Filter returns that exceed VaR
    extreme_returns = returns[returns <= var_threshold]
    
    # Calculate CVaR as the average of extreme returns
    if len(extreme_returns) > 0:
        cvar = -extreme_returns.mean()
        return cvar
    else:
        return np.nan

def calculate_garch_var(returns, garch_model, confidence_level=0.95, forecast_horizon=1):
    """
    Calculate VaR using a GARCH model
    
    Parameters:
    - returns: Series of returns
    - garch_model: Fitted GARCH model result
    - confidence_level: Confidence level for VaR
    - forecast_horizon: Number of days ahead to forecast
    
    Returns:
    - VaR value based on GARCH volatility forecast
    """
    if returns.empty or garch_model is None:
        return np.nan
    
    try:
        # Get volatility forecast
        forecast = garch_model.forecast(horizon=forecast_horizon)
        forecast_vol = np.sqrt(forecast.variance.iloc[-1, 0])
        
        # Get Z-score for the confidence level
        z_score = stats.norm.ppf(1 - confidence_level)
        
        # Calculate VaR
        var = -(returns.mean() + z_score * forecast_vol)
        return var
    except Exception as e:
        logger.warning(f"GARCH VaR calculation failed: {e}")
        return np.nan

def calculate_var_metrics(symbol, data_path, garch_model=None, lookback_days=60):
    """
    Calculate various VaR metrics for a stock
    
    Parameters:
    - symbol: Stock symbol
    - data_path: Path to stock data CSV file
    - garch_model: Optional pre-fitted GARCH model result
    - lookback_days: Number of days to use for historical window
    
    Returns:
    - Dictionary with VaR metrics
    """
    try:
        # Load data
        df = pd.read_csv(data_path)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df = df.sort_index()
        
        # Calculate returns
        returns = 100 * np.log(df['close'] / df['close'].shift(1)).dropna()
        
        if len(returns) < lookback_days:
            return None
        
        # Calculate different VaR metrics
        historical_var_95 = calculate_historical_var(returns, 0.95, lookback_days)
        historical_var_99 = calculate_historical_var(returns, 0.99, lookback_days)
        parametric_var_95 = calculate_parametric_var(returns, 0.95)
        cvar_95 = calculate_conditional_var(returns, 0.95)
        
        # GARCH-based VaR (if model provided)
        garch_var_95 = calculate_garch_var(returns, garch_model, 0.95) if garch_model is not None else np.nan
        
        # Calculate risk metrics
        average_return = returns.mean()
        volatility = returns.std()
        
        # Risk-adjusted return (Sharpe-like ratio but using VaR)
        # Higher value is better (more return per unit of risk)
        if historical_var_95 > 0:
            return_to_var_ratio = average_return / historical_var_95
        else:
            return_to_var_ratio = np.nan
        
        # Normal Sharpe ratio approximation (assuming zero risk-free rate)
        if volatility > 0:
            sharpe_ratio = average_return / volatility
        else:
            sharpe_ratio = np.nan
        
        return {
            'symbol': symbol,
            'historical_var_95': historical_var_95,
            'historical_var_99': historical_var_99,
            'parametric_var_95': parametric_var_95,
            'conditional_var_95': cvar_95,
            'garch_var_95': garch_var_95,
            'average_return': average_return,
            'volatility': volatility,
            'return_to_var_ratio': return_to_var_ratio,
            'sharpe_ratio': sharpe_ratio,
            'var_to_volatility': historical_var_95 / volatility if volatility > 0 else np.nan
        }
    except Exception as e:
        logger.error(f"Error calculating VaR metrics for {symbol}: {e}")
        return None

def analyze_stocks_with_var(stock_symbols, data_dir, lookback_days=60):
    """
    Analyze multiple stocks using VaR models
    
    Parameters:
    - stock_symbols: List of stock symbols to analyze
    - data_dir: Directory containing stock price CSV files
    - lookback_days: Number of days to use for historical window
    
    Returns:
    - DataFrame with VaR metrics for all analyzed stocks
    """
    results = []
    
    for i, symbol in enumerate(stock_symbols):
        try:
            file_path = os.path.join(data_dir, f"{symbol}.csv")
            if not os.path.exists(file_path):
                logger.warning(f"Data file for {symbol} not found")
                continue
                
            if (i + 1) % 20 == 0:
                logger.info(f"Processing {i+1}/{len(stock_symbols)} stocks")
                
            metrics = calculate_var_metrics(symbol, file_path, lookback_days=lookback_days)
            
            if metrics:
                results.append(metrics)
        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}")
    
    # Convert to DataFrame
    if results:
        return pd.DataFrame(results)
    else:
        return pd.DataFrame()

if __name__ == "__main__":
    # This is just for testing purposes
    data_dir = "../nifty500_1day_ticker"
    test_symbols = ["RELIANCE", "HDFCBANK", "TCS", "INFY"]
    
    result_df = analyze_stocks_with_var(test_symbols, data_dir)
    if not result_df.empty:
        print(result_df) 