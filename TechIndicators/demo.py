#!/usr/bin/env python
import os
import pandas as pd
import sys
import matplotlib.pyplot as plt

# Import all indicator modules using relative imports
from . import ADV15
from . import BollingerBands
from . import MACD
from . import RSI
from . import MovingAverages
from . import ATR
from . import OBV
from . import Stochastic

def load_stock_data(file_path):
    """Load stock price data from CSV file"""
    try:
        df = pd.read_csv(file_path)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df = df.sort_index()
        return df
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return None

def main():
    # Define the path to the ACE.csv file
    data_dir = "/Users/pranavlakhotia/cursor_Quant/kite_connect_app/nifty500_1day_ticker"
    symbol = "ACE"
    file_path = os.path.join(data_dir, f"{symbol}.csv")
    
    # Load the data
    print(f"Loading data for {symbol} from {file_path}...")
    df = load_stock_data(file_path)
    
    if df is None:
        print(f"Failed to load data for {symbol}")
        return
    
    # Print the first few rows of the original data
    print("\nOriginal Data:")
    print(df.head())
    
    # Calculate technical indicators
    print("\nCalculating technical indicators...")
    
    # Calculate ADV15
    adv15_df = ADV15.calculate_adv15(df)
    
    # Calculate Bollinger Bands
    bb_df = BollingerBands.calculate_bollinger_bands(df)
    
    # Calculate MACD
    macd_df = MACD.calculate_macd(df)
    
    # Calculate RSI
    rsi_df = RSI.calculate_rsi(df)
    
    # Calculate Moving Averages
    sma20_df = MovingAverages.calculate_sma(df, window=20)
    sma50_df = MovingAverages.calculate_sma(df, window=50)
    ema9_df = MovingAverages.calculate_ema(df, span=9)
    ema21_df = MovingAverages.calculate_ema(df, span=21)
    
    # Calculate ATR
    atr_df = ATR.calculate_atr(df)
    
    # Calculate OBV
    obv_df = OBV.calculate_obv(df)
    
    # Calculate Stochastic
    stoch_df = Stochastic.calculate_stochastic(df)
    
    # Combine original data with all indicators
    result_df = df.copy()
    result_df = pd.concat([
        result_df, 
        adv15_df,
        bb_df,
        macd_df,
        rsi_df,
        sma20_df,
        sma50_df,
        ema9_df,
        ema21_df,
        atr_df,
        obv_df,
        stoch_df
    ], axis=1)
    
    # Print the DataFrame with indicators
    print("\nData with Technical Indicators:")
    pd.set_option('display.max_columns', None)  # Show all columns
    pd.set_option('display.width', 1000)  # Wider display
    print(result_df.tail(10))
    
    # Display some statistics
    print("\nStatistics for Technical Indicators:")
    print(result_df.describe())
    
    return result_df

if __name__ == "__main__":
    print("Starting technical indicator demo for ACE.csv...")
    result_df = main()
    print("Analysis completed.") 