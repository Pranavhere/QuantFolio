#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_above_ma(df, windows=[3, 5, 10, 20, 50], prefix='abovema_'):
    """
    Calculate binary indicators showing if close price is above moving averages
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    windows : list, default [3, 5, 10, 20, 50]
        List of moving average periods to check
    prefix : str, default 'abovema_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with binary columns indicating if close is above each MA
    """
    result = pd.DataFrame(index=df.index)
    
    for window in windows:
        # Calculate the moving average
        ma = df['close'].rolling(window=window).mean()
        
        # Create binary indicator (1 if close > MA, 0 otherwise)
        result[f'{prefix}{window}'] = (df['close'] > ma).astype(int)
    
    return result 