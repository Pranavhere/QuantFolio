#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_multi_rsi(df, periods=[3, 4, 5, 6, 8, 10, 14], prefix='rsi_'):
    """
    Calculate Relative Strength Index (RSI) for multiple periods
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    periods : list, default [3, 4, 5, 6, 8, 10, 14]
        List of RSI periods to calculate
    prefix : str, default 'rsi_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with RSI values for different periods
    """
    result = pd.DataFrame(index=df.index)
    
    for period in periods:
        # Calculate price changes
        delta = df['close'].diff()
        
        # Separate gains and losses
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        # Calculate average gain and loss
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        
        # Calculate RS
        rs = avg_gain / avg_loss
        
        # Calculate RSI
        rsi = 100 - (100 / (1 + rs))
        
        # Store result with appropriate name
        if period == 14:  # Default RSI period
            # Include both named formats for the default period
            result['rsi'] = rsi
            result[f'{prefix}{period}'] = rsi
        else:
            result[f'{prefix}{period}'] = rsi
    
    return result 