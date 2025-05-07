#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_candle_patterns(df):
    """
    Calculate various candlestick pattern indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'open', 'high', 'low', 'close' columns
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with binary columns for various candlestick patterns
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate price ranges
    body_range = (df['close'] - df['open']).abs()
    hl_range = df['high'] - df['low']
    
    # Doji (small body compared to total range)
    result['doji'] = (body_range <= 0.1 * hl_range).astype(int)
    
    # Inside bars (today's range is inside yesterday's range)
    result['inside'] = ((df['low'] > df['low'].shift(1)) & 
                       (df['high'] < df['high'].shift(1))).astype(int)
    
    # Outside bars (today's range engulfs yesterday's range)
    result['outside'] = ((df['low'] < df['low'].shift(1)) & 
                        (df['high'] > df['high'].shift(1))).astype(int)
    
    # Hook patterns
    result['hookdown'] = ((df['open'] > df['high'].shift(1)) & 
                         (df['close'] < df['close'].shift(1))).astype(int)
    
    result['hookup'] = ((df['open'] < df['low'].shift(1)) & 
                       (df['close'] > df['close'].shift(1))).astype(int)
    
    # Higher/Lower High/Low/Open/Close
    result['hh'] = (df['high'] > df['high'].shift(1)).astype(int)  # Higher High
    result['hl'] = (df['low'] > df['low'].shift(1)).astype(int)    # Higher Low
    result['ho'] = (df['open'] > df['open'].shift(1)).astype(int)  # Higher Open
    result['hc'] = (df['close'] > df['close'].shift(1)).astype(int) # Higher Close
    
    result['lh'] = (df['high'] < df['high'].shift(1)).astype(int)  # Lower High
    result['ll'] = (df['low'] < df['low'].shift(1)).astype(int)    # Lower Low
    result['lo'] = (df['open'] < df['open'].shift(1)).astype(int)  # Lower Open
    result['lc'] = (df['close'] < df['close'].shift(1)).astype(int) # Lower Close
    
    # Gaps
    result['gap'] = ((df['low'] > df['high'].shift(1)) | 
                     (df['high'] < df['low'].shift(1))).astype(int)
    
    result['gapup'] = (df['low'] > df['high'].shift(1)).astype(int)
    result['gapdown'] = (df['high'] < df['low'].shift(1)).astype(int)
    
    # Breakaway gaps after inside bars - Fix the type error
    # Convert numeric values to boolean before using boolean operations
    inside_prev = result['inside'].shift(1).fillna(0).astype(bool)
    gapup_bool = result['gapup'].astype(bool)
    gapdown_bool = result['gapdown'].astype(bool)
    
    result['gapbaup'] = (inside_prev & gapup_bool).astype(int)
    result['gapbadown'] = (inside_prev & gapdown_bool).astype(int)
    
    # Big moves (additional calculations needed in PricePatterns.py)
    # These will be placeholders, properly calculated when combined with other indicators
    result['bigup'] = 0
    result['bigdown'] = 0
    
    return result 