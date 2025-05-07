#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_bollinger_bands(df, window=20, num_std=2, prefix='bollinger_'):
    """
    Calculate Bollinger Bands
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    window : int, default 20
        Rolling window size in days
    num_std : int or float, default 2
        Number of standard deviations for the bands
    prefix : str, default 'bollinger_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with three columns for upper, middle, and lower bands
    """
    # Calculate the SMA and standard deviation
    sma = df['close'].rolling(window=window).mean()
    std = df['close'].rolling(window=window).std()
    
    # Calculate the bands
    upper_band = sma + (std * num_std)
    lower_band = sma - (std * num_std)
    
    # Create result DataFrame
    result = pd.DataFrame(index=df.index)
    result[f'{prefix}upper'] = upper_band
    result[f'{prefix}middle'] = sma
    result[f'{prefix}lower'] = lower_band
    
    return result 