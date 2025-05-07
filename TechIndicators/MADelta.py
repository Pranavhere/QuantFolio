#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_ma_delta(df, windows=[3, 5, 7, 10, 12, 15, 18, 20], prefix='madelta_'):
    """
    Calculate MA Delta indicators (normalized distance from price to moving average)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'close' column
    windows : list, default [3, 5, 7, 10, 12, 15, 18, 20]
        List of moving average periods
    prefix : str, default 'madelta_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with MA Delta indicators for various periods
    """
    result = pd.DataFrame(index=df.index)
    
    # Get the default ATR for normalization (10-period ATR)
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    atr_10 = true_range.rolling(window=10).mean()
    
    # Calculate MA deltas for each period
    for window in windows:
        # Calculate the MA
        ma = df['close'].rolling(window=window).mean()
        
        # Calculate the delta (difference between price and MA)
        delta = df['close'] - ma
        
        # Normalize by ATR
        result[f'{prefix}{window}'] = delta / atr_10
    
    # Default madelta uses the 50-period MA
    ma_50 = df['close'].rolling(window=50).mean()
    result['madelta'] = (df['close'] - ma_50) / atr_10
    
    return result 