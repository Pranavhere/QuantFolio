#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_sma(df, window=20, col_name=None):
    """
    Calculate Simple Moving Average (SMA)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    window : int, default 20
        SMA period
    col_name : str, default None
        Name of the output column. If None, will be named 'sma_{window}'
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the SMA values
    """
    if col_name is None:
        col_name = f'sma_{window}'
        
    # Calculate SMA
    sma = df['close'].rolling(window=window).mean()
    
    # Return as DataFrame
    result = pd.DataFrame(sma, index=df.index, columns=[col_name])
    return result

def calculate_ema(df, span=20, col_name=None):
    """
    Calculate Exponential Moving Average (EMA)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'close' column
    span : int, default 20
        EMA period
    col_name : str, default None
        Name of the output column. If None, will be named 'ema_{span}'
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the EMA values
    """
    if col_name is None:
        col_name = f'ema_{span}'
        
    # Calculate EMA
    ema = df['close'].ewm(span=span, adjust=False).mean()
    
    # Return as DataFrame
    result = pd.DataFrame(ema, index=df.index, columns=[col_name])
    return result 