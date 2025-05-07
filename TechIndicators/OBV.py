#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_obv(df, col_name='obv'):
    """
    Calculate On-Balance Volume (OBV)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'close' and 'volume' columns
    col_name : str, default 'obv'
        Name of the output column
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the OBV values
    """
    # Initialize OBV series
    obv = pd.Series(index=df.index, dtype='float64')
    obv.iloc[0] = 0
    
    # Calculate OBV for each day
    for i in range(1, len(df)):
        if df['close'].iloc[i] > df['close'].iloc[i-1]:
            obv.iloc[i] = obv.iloc[i-1] + df['volume'].iloc[i]
        elif df['close'].iloc[i] < df['close'].iloc[i-1]:
            obv.iloc[i] = obv.iloc[i-1] - df['volume'].iloc[i]
        else:
            obv.iloc[i] = obv.iloc[i-1]
    
    # Return as DataFrame
    result = pd.DataFrame(obv, index=df.index, columns=[col_name])
    return result 