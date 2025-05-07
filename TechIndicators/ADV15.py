#!/usr/bin/env python
import pandas as pd
import numpy as np

def calculate_adv15(df, col_name='adv15', window=15):
    """
    Calculate the Average Daily Volume (ADV) with a specified window period
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with a 'volume' column
    col_name : str, default 'adv15'
        Name of the output column
    window : int, default 15
        Rolling window size in days
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with a single column containing the ADV values
    """
    # Calculate the ADV
    adv = df['volume'].rolling(window=window).mean()
    
    # Return as a DataFrame with column name
    result = pd.DataFrame(adv, index=df.index, columns=[col_name])
    return result 