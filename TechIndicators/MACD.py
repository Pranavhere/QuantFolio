#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_macd(df, fast=12, slow=26, signal=9, prefix='macd_'):
    """
    Calculate MACD (Moving Average Convergence Divergence)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    fast : int, default 12
        Fast EMA period
    slow : int, default 26
        Slow EMA period
    signal : int, default 9
        Signal line period
    prefix : str, default 'macd_'
        Prefix for column names
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with three columns for MACD line, signal line and histogram
    """
    # Calculate the fast and slow exponential moving averages
    ema_fast = df['close'].ewm(span=fast, adjust=False).mean()
    ema_slow = df['close'].ewm(span=slow, adjust=False).mean()
    
    # Calculate the MACD line
    macd_line = ema_fast - ema_slow
    
    # Calculate the signal line
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    
    # Calculate the histogram
    histogram = macd_line - signal_line
    
    # Create result DataFrame
    result = pd.DataFrame(index=df.index)
    result[f'{prefix}line'] = macd_line
    result[f'{prefix}signal'] = signal_line
    result[f'{prefix}histogram'] = histogram
    
    return result 