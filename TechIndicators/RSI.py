#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_rsi(df, window=14, col_name='rsi'):
    """
    Calculate Relative Strength Index (RSI)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    window : int, default 14
        RSI period
    col_name : str, default 'rsi'
        Name of the output column
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the RSI values
    """
    # Calculate price changes
    delta = df['close'].diff()
    
    # Separate gains and losses
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    
    # Calculate average gain and loss
    avg_gain = gain.rolling(window=window).mean()
    avg_loss = loss.rolling(window=window).mean()
    
    # Calculate RS
    rs = avg_gain / avg_loss
    
    # Calculate RSI
    rsi = 100 - (100 / (1 + rs))
    
    # Return as DataFrame
    result = pd.DataFrame(rsi, index=df.index, columns=[col_name])
    return result 