#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_volume_indicators(df):
    """
    Calculate volume-related indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'volume' column
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with volume indicators
    """
    result = pd.DataFrame(index=df.index)
    
    # Calculate volume moving average (20-day)
    result['vma'] = df['volume'].rolling(window=20).mean()
    
    # Calculate volume ratio (today's volume / average volume)
    result['vmratio'] = df['volume'] / result['vma']
    
    # Binary volume indicators
    result['vmover'] = (result['vmratio'] >= 1).astype(int)
    result['vmunder'] = (result['vmratio'] < 1).astype(int)
    
    return result 