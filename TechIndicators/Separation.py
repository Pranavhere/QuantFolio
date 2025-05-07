#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_separation(df, periods=[(3, 3), (5, 5), (8, 8), (10, 10), (14, 14), (21, 21), (30, 30), (40, 40)], prefix='sep_'):
    """
    Calculate separation indicators (measure of open/close position within range)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'open', 'high', 'low', 'close' columns
    periods : list of tuples, default [(3,3), (5,5), (8,8), (10,10), (14,14), (21,21), (30,30), (40,40)]
        List of period combinations for calculating average separation
    prefix : str, default 'sep_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with separation indicators
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate basic separation (percentage of close within the day's range)
    # 0 = close at low, 100 = close at high
    result['sep'] = 100 * (df['close'] - df['low']) / (df['high'] - df['low']).replace(0, np.nan)
    
    # Calculate open-based separation (percentage of open within the day's range)
    open_sep = 100 * (df['open'] - df['low']) / (df['high'] - df['low']).replace(0, np.nan)
    
    # Calculate relative index of close vs open within high-low range
    result['rixc_1'] = result['sep']
    result['rixo_1'] = open_sep
    
    # Calculate separation differences for various periods
    for period_close, period_open in periods:
        # Average separation for close and open
        close_sep_avg = result['sep'].rolling(period_close).mean()
        open_sep_avg = open_sep.rolling(period_open).mean()
        
        # Store the average separation values
        result[f'{prefix}{period_close}_{period_open}'] = close_sep_avg - open_sep_avg
    
    # Binary separation indicators
    result['sepdoji'] = (result['sep'].abs() <= 15).astype(int)
    result['sephigh'] = (result['sep'].abs() >= 70).astype(int)
    result['seplow'] = (result['sep'].abs() <= 30).astype(int)
    
    # Calculate the trend indicator - Fix potential type error
    # Only calculate if 'rrover' column exists, otherwise set to 0
    if 'rrover' in result.columns:
        rrover_bool = result['rrover'].astype(bool)
        sephigh_bool = result['sephigh'].astype(bool)
        result['trend'] = (rrover_bool & sephigh_bool).astype(int)
    else:
        result['trend'] = 0
    
    return result 