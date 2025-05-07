#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_adx(df, window=14, col_name='adx'):
    """
    Calculate Average Directional Index (ADX)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'high', 'low', and 'close' columns
    window : int, default 14
        Lookback period
    col_name : str, default 'adx'
        Name for the ADX column
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with ADX, DI+, and DI- columns
    """
    # Create result DataFrame
    result = pd.DataFrame(index=df.index)
    
    # Calculate True Range
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    
    # Calculate Directional Movement
    up_move = df['high'] - df['high'].shift(1)
    down_move = df['low'].shift(1) - df['low']
    
    # Positive Directional Movement (+DM)
    pos_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
    pos_dm = pd.Series(pos_dm, index=df.index)
    
    # Negative Directional Movement (-DM)
    neg_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
    neg_dm = pd.Series(neg_dm, index=df.index)
    
    # Smooth true range and directional movement using Wilder's smoothing
    smooth_tr = true_range.rolling(window).sum()
    smooth_pos_dm = pos_dm.rolling(window).sum()
    smooth_neg_dm = neg_dm.rolling(window).sum()
    
    # Calculate Directional Indicators (+DI and -DI)
    pos_di = 100 * (smooth_pos_dm / smooth_tr)
    neg_di = 100 * (smooth_neg_dm / smooth_tr)
    
    # Calculate Directional Index (DX)
    dx = 100 * (abs(pos_di - neg_di) / (pos_di + neg_di))
    
    # Calculate Average Directional Index (ADX)
    adx = dx.rolling(window).mean()
    
    # Store results
    result[col_name] = adx
    result['diplus'] = pos_di
    result['diminus'] = neg_di
    
    return result 