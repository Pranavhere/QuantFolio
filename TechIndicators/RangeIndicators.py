#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_range_indicators(df, nr_periods=[3, 4, 5, 7, 8, 10, 18], wr_periods=[2, 3, 4, 5, 6, 7, 10]):
    """
    Calculate Narrow Range (NR) and Wide Range (WR) indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high' and 'low' columns
    nr_periods : list, default [3, 4, 5, 7, 8, 10, 18]
        List of lookback periods for NR calculations
    wr_periods : list, default [2, 3, 4, 5, 6, 7, 10]
        List of lookback periods for WR calculations
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with NR and WR indicators
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate high-low range
    hl_range = df['high'] - df['low']
    
    # Calculate Narrow Range (NR) indicators
    for period in nr_periods:
        # Rolling minimum of range over the period
        min_range = hl_range.rolling(period).min()
        
        # NR is 1 if today's range equals the minimum range over the period
        result[f'nr_{period}'] = (hl_range == min_range).astype(int)
    
    # Calculate Wide Range (WR) indicators
    for period in wr_periods:
        # Rolling maximum of range over the period
        max_range = hl_range.rolling(period).max()
        
        # WR is 1 if today's range equals the maximum range over the period
        if period == 4:  # Default WR period (used as just 'wr')
            result['wr'] = (hl_range == max_range).astype(int)
        else:
            result[f'wr_{period}'] = (hl_range == max_range).astype(int)
    
    return result 