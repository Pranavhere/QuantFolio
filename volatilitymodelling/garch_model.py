#!/usr/bin/env python
import pandas as pd
import numpy as np
from arch import arch_model
import logging
import datetime
from db_utils import fetch_stock_data

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def calculate_returns(prices):
    """Calculate log returns from price series"""
    return 100 * np.log(prices / prices.shift(1)).dropna()

def fit_garch_model(returns, p=1, q=1, mean_model='Constant', vol_model='GARCH', dist='normal'):
    """
    Fit a GARCH model to return series
    
    Parameters:
    - returns: Series of returns
    - p: ARCH order
    - q: GARCH order
    - mean_model: Mean model specification ('Constant', 'Zero', 'AR', etc.)
    - vol_model: Volatility model ('GARCH', 'EGARCH', 'FIGARCH', etc.)
    - dist: Error distribution ('normal', 'studentst', 'skewstudent', etc.)
    
    Returns:
    - fitted model results
    """
    try:
        model = arch_model(
            returns, 
            p=p, 
            q=q, 
            mean=mean_model, 
            vol=vol_model, 
            dist=dist
        )
        model_fit = model.fit(disp='off')
        return model_fit
    except Exception as e:
        logger.warning(f"GARCH model fitting failed: {e}")
        return None

def forecast_volatility(model_fit, horizon=10):
    """
    Forecast volatility using a fitted GARCH model
    
    Parameters:
    - model_fit: Fitted GARCH model
    - horizon: Number of periods to forecast
    
    Returns:
    - DataFrame with volatility forecasts
    """
    if model_fit is None:
        return None
    
    try:
        forecast = model_fit.forecast(horizon=horizon)
        return forecast.variance.iloc[-1]
    except Exception as e:
        logger.warning(f"Volatility forecasting failed: {e}")
        return None

def calculate_garch_metrics(symbol, lookback_days=120):
    """
    Calculate GARCH metrics for a given stock
    
    Parameters:
    - symbol: Stock symbol
    - lookback_days: Number of days to use for GARCH modeling
    
    Returns:
    - Dictionary with GARCH metrics including:
        - unconditional_volatility: Long-term volatility level
        - persistence: How long volatility shocks persist (α+β)
        - forecast_volatility: Forecasted volatility for next 5 days
        - recent_volatility: Volatility over recent period
    """
    try:
        # Calculate date range for lookback
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=lookback_days * 1.5)  # Add buffer for market holidays
        
        # Fetch data from database
        stock_data = fetch_stock_data(symbol, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        
        if stock_data.empty or len(stock_data) < lookback_days * 0.7:  # Require at least 70% of the days
            logger.warning(f"Insufficient data for {symbol}: got {len(stock_data)} days, need at least {int(lookback_days * 0.7)}")
            return None
        
        # Use recent data (default 120 days) for GARCH modeling
        # If more data was fetched, use only the most recent lookback_days
        if len(stock_data) > lookback_days:
            recent_data = stock_data.iloc[-lookback_days:]
        else:
            recent_data = stock_data
        
        # Calculate returns
        returns = calculate_returns(recent_data['close'])
        if len(returns) < 60:  # Need sufficient data
            logger.warning(f"Insufficient return data for {symbol}: got {len(returns)} points, need at least 60")
            return None
        
        # Fit GARCH model
        garch_result = fit_garch_model(returns)
        if garch_result is None:
            return None
        
        # Extract key metrics
        params = garch_result.params
        
        # Calculate persistence (α+β)
        alpha = params.get('alpha[1]', 0)
        beta = params.get('beta[1]', 0)
        persistence = alpha + beta
        
        # Get unconditional volatility
        omega = params.get('omega', 0)
        if persistence < 1 and persistence > 0:
            unconditional_vol = np.sqrt(omega / (1 - persistence) * 252)
        else:
            unconditional_vol = np.nan
        
        # Recent realized volatility (30 days)
        recent_vol = returns.iloc[-30:].std() * np.sqrt(252)
        
        # Forecast volatility
        forecast_vol = forecast_volatility(garch_result, horizon=5)
        if forecast_vol is not None:
            # Annualize the forecast (convert from daily to annual)
            forecast_vol = np.sqrt(forecast_vol.mean() * 252)
        else:
            forecast_vol = np.nan
        
        return {
            'symbol': symbol,
            'unconditional_volatility': unconditional_vol,
            'persistence': persistence,
            'forecast_volatility': forecast_vol,
            'recent_volatility': recent_vol,
            'volatility_ratio': (forecast_vol / recent_vol) if recent_vol > 0 else np.nan,
            'returns_mean': returns.mean(),
            'returns_std': returns.std()
        }
    except Exception as e:
        logger.error(f"Error calculating GARCH metrics for {symbol}: {e}")
        return None

def analyze_stocks_with_garch(stock_symbols, lookback_days=120):
    """
    Analyze multiple stocks using GARCH models
    
    Parameters:
    - stock_symbols: List of stock symbols to analyze
    - lookback_days: Number of days to use for GARCH modeling
    
    Returns:
    - DataFrame with GARCH metrics for all analyzed stocks
    """
    results = []
    
    for i, symbol in enumerate(stock_symbols):
        try:
            if (i + 1) % 20 == 0:
                logger.info(f"Processing {i+1}/{len(stock_symbols)} stocks with GARCH model")
                
            metrics = calculate_garch_metrics(symbol, lookback_days)
            
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
    from db_utils import fetch_top200_volume_data
    
    # Get top stocks from volume filter
    symbols, _ = fetch_top200_volume_data(
        (datetime.date.today() - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    )
    
    # Take first 5 for testing
    test_symbols = symbols[:5] if symbols else ["RELIANCE", "HDFCBANK", "TCS", "INFY"]
    
    logger.info(f"Testing GARCH model with symbols: {test_symbols}")
    result_df = analyze_stocks_with_garch(test_symbols)
    
    if not result_df.empty:
        logger.info("\nGARCH Model Results:")
        logger.info(f"\n{result_df}")
    else:
        logger.warning("No GARCH model results generated") 