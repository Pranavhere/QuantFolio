#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_range_ratios(df):
    """
    Calculate Range Ratio (RR) indicators for various period combinations
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high' and 'low' columns
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with range ratio indicators for various period combinations
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate high-low range
    hl_range = df['high'] - df['low']
    
    # Define all the range ratio combinations
    rr_combinations = [
        (1, 4), (1, 7), (1, 10),
        (2, 5), (2, 7), (2, 10),
        (3, 8), (3, 14),
        (4, 10), (4, 20),
        (5, 10), (5, 20), (5, 30),
        (6, 14), (6, 25),
        (7, 14), (7, 35),
        (8, 22)
    ]
    
    # Calculate range ratios
    for short_period, long_period in rr_combinations:
        # Calculate average ranges
        short_avg = hl_range.rolling(short_period).mean()
        long_avg = hl_range.rolling(long_period).mean()
        
        # Calculate ratio
        result[f'rr_{short_period}_{long_period}'] = short_avg / long_avg
    
    # Calculate range ratio indicators (binary variables)
    # Default using 1-day to 10-day ratio (rr_1_10)
    if 'rr_1_10' in result.columns:
        result['rrover'] = (result['rr_1_10'] >= 1.0).astype(int)
        result['rrunder'] = (result['rr_1_10'] < 1.0).astype(int)
        result['rrhigh'] = (result['rr_1_10'] >= 1.2).astype(int)
        result['rrlow'] = (result['rr_1_10'] <= 0.8).astype(int)
    
    return result 