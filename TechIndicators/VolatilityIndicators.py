#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_volatility_indicators(df, windows=[3, 5, 10, 20]):
    """
    Calculate volatility indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high', 'low', 'close' columns
    windows : list, default [3, 5, 10, 20]
        List of periods for volatility calculations
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with volatility indicators
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate true range
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    
    # Calculate ATR for various periods
    for window in windows:
        atr = true_range.rolling(window=window).mean()
        
        # Volatility is ATR / close (as a percentage)
        if window == 10:  # Default volatility period
            result['volatility'] = (atr / df['close']) * 100
        
        result[f'volatility_{window}'] = (atr / df['close']) * 100
    
    return result 