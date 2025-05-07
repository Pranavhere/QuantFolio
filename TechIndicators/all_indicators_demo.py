#!/usr/bin/env python
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
import sys

# Import the combined indicators module - use relative imports
from . import CombinedIndicators

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

def print_dataframe_info(df):
    """Print detailed information about the DataFrame"""
    print("\n===== DataFrame Information =====")
    print(f"Shape: {df.shape}")
    print(f"Columns ({len(df.columns)}):")
    
    # Get column data types and print them in groups
    dtypes = df.dtypes
    print("\nNumeric Columns:")
    for col, dtype in dtypes.items():
        if np.issubdtype(dtype, np.number):
            print(f"  - {col}: {dtype}")
    
    print("\nNon-Numeric Columns:")
    for col, dtype in dtypes.items():
        if not np.issubdtype(dtype, np.number):
            print(f"  - {col}: {dtype}")
    
    print("\nData Sample:")
    print(df.head(3))
    
    print("\nSummary Statistics (selected columns):")
    # Select a subset of columns for the statistics to keep output manageable
    selected_columns = ['close', 'volume', 'rsi', 'atr', 'volatility', 'adx']
    selected_columns = [col for col in selected_columns if col in df.columns]
    if selected_columns:
        print(df[selected_columns].describe().T)
    
    print("\nMemory Usage:")
    memory_usage = df.memory_usage(deep=True).sum() / (1024 * 1024)  # Convert to MB
    print(f"Total: {memory_usage:.2f} MB")

def print_available_indicators():
    """Print all available indicators from the package"""
    all_indicators = CombinedIndicators.get_all_indicator_columns()
    print(f"\nAvailable Technical Indicators ({len(all_indicators)}):")
    
    # Group indicators by type
    indicator_groups = {
        "Price": ['close', 'open', 'high', 'low'],
        "Volume": ['volume', 'vma', 'vmratio', 'vmover', 'vmunder', 'obv', 'adv15'],
        "Moving Averages": [col for col in all_indicators if 'sma_' in col or 'ema_' in col],
        "Above MA": [col for col in all_indicators if 'abovema_' in col],
        "MA Delta": [col for col in all_indicators if 'madelta_' in col],
        "RSI": [col for col in all_indicators if col.startswith('rsi')],
        "Bollinger": [col for col in all_indicators if 'bollinger' in col],
        "MACD": [col for col in all_indicators if 'macd' in col],
        "ADX": ['adx', 'diplus', 'diminus'],
        "Stochastic": [col for col in all_indicators if 'stoch' in col],
        "Candle Patterns": ['doji', 'inside', 'outside', 'hookup', 'hookdown', 'gap', 'gapup', 'gapdown'],
        "Net Movement": ['net', 'netup', 'netdown'] + [col for col in all_indicators if col.startswith('roi')],
        "Range": [col for col in all_indicators if col.startswith('nr_') or col.startswith('wr_')],
        "Range Ratio": [col for col in all_indicators if col.startswith('rr_')],
        "Separation": [col for col in all_indicators if col.startswith('sep')],
        "Volatility": ['atr'] + [col for col in all_indicators if 'volatility' in col],
        "Other": []
    }
    
    # Print each group
    for group, indicators in indicator_groups.items():
        if indicators:
            print(f"\n{group} Indicators ({len(indicators)}):")
            for i, indicator in enumerate(sorted(indicators)):
                print(f"  {i+1}. {indicator}")
    
    # Find any indicators not in groups
    all_grouped = []
    for indicators in indicator_groups.values():
        all_grouped.extend(indicators)
    
    remaining = [ind for ind in all_indicators if ind not in all_grouped]
    if remaining:
        print("\nOther Indicators:")
        for i, indicator in enumerate(sorted(remaining)):
            print(f"  {i+1}. {indicator}")

def main():
    # Define the path to the stock data file
    data_dir = "/Users/pranavlakhotia/cursor_Quant/kite_connect_app/nifty500_1day_ticker"
    symbol = "ACE"
    file_path = os.path.join(data_dir, f"{symbol}.csv")
    
    # Print available indicators
    print_available_indicators()
    
    # Load the data
    print(f"\nLoading data for {symbol} from {file_path}...")
    df = load_stock_data(file_path)
    
    if df is None:
        print(f"Failed to load data for {symbol}")
        return
    
    # Print the first few rows of the original data
    print("\nOriginal Data:")
    print(df.head())
    print(f"Original data shape: {df.shape}")
    
    # Calculate all indicators at once
    print("\nCalculating all technical indicators...")
    df_with_all_indicators = CombinedIndicators.calculate_all_indicators(df)
    
    # Print detailed information about the DataFrame
    print_dataframe_info(df_with_all_indicators)
    
    # Print all the data points in the DataFrame
    print("\n===== FULL DATAFRAME WITH ALL INDICATORS =====")
    pd.set_option('display.max_columns', None)  # Show all columns
    pd.set_option('display.width', 1000)  # Wider display
    
    # Show first and last 10 rows
    print("\nFirst 10 rows:")
    print(df_with_all_indicators.head(10))
    
    print("\nLast 10 rows:")
    print(df_with_all_indicators.tail(10))
    
    # Reset display options to defaults
    pd.reset_option('display.max_columns')
    pd.reset_option('display.width')
    
    return df_with_all_indicators

if __name__ == "__main__":
    print("Starting demo with all technical indicators for ACE.csv...")
    df_with_all_indicators = main()
    print("Analysis completed.") 