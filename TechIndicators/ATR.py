#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_atr(df, window=14, col_name='atr'):
    """
    Calculate Average True Range (ATR)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high', 'low', and 'close' columns
    window : int, default 14
        ATR period
    col_name : str, default 'atr'
        Name of the output column
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the ATR values
    """
    # Calculate the true range
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    
    # Combine the three ranges
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    
    # Calculate ATR
    atr = true_range.rolling(window=window).mean()
    
    # Return as DataFrame
    result = pd.DataFrame(atr, index=df.index, columns=[col_name])
    return result 