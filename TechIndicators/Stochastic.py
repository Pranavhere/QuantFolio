#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_stochastic(df, k_window=14, d_window=3, prefix='stoch_'):
    """
    Calculate Stochastic Oscillator
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high', 'low', and 'close' columns
    k_window : int, default 14
        Window for %K calculation
    d_window : int, default 3
        Window for %D calculation (moving average of %K)
    prefix : str, default 'stoch_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with two columns for %K and %D values
    """
    # Calculate %K
    low_min = df['low'].rolling(window=k_window).min()
    high_max = df['high'].rolling(window=k_window).max()
    k = 100 * ((df['close'] - low_min) / (high_max - low_min))
    
    # Calculate %D
    d = k.rolling(window=d_window).mean()
    
    # Return as DataFrame
    result = pd.DataFrame(index=df.index)
    result[f'{prefix}k'] = k
    result[f'{prefix}d'] = d
    
    return result 