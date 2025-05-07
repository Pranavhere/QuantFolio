#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_net_movement(df):
    """
    Calculate net movement indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'open', 'high', 'low', 'close' columns
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with net movement indicators
    """
    result = pd.DataFrame(index=df.index)
    
    # Net close (today's close - yesterday's close)
    result['net'] = df['close'] - df['close'].shift(1)
    
    # Direction of net movement
    result['netup'] = (result['net'] > 0).astype(int)
    result['netdown'] = (result['net'] < 0).astype(int)
    
    return result

def calculate_roi(df, windows=[1, 2, 3, 4, 5, 10, 20], prefix='roi_'):
    """
    Calculate Return on Investment (ROI) over various periods
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    windows : list, default [1, 2, 3, 4, 5, 10, 20]
        List of lookback periods for ROI calculation
    prefix : str, default 'roi_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with ROI values for specified periods
    """
    result = pd.DataFrame(index=df.index)
    
    # Default ROI (1-day)
    result['roi'] = (df['close'] / df['close'].shift(1) - 1) * 100
    
    # ROI for different periods
    for window in windows:
        if window == 1:  # Skip window=1 as it's already calculated
            continue
        result[f'{prefix}{window}'] = (df['close'] / df['close'].shift(window) - 1) * 100
    
    return result 