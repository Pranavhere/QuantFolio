#!/usr/bin/env python
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
import sys

# Import technical indicators using relative imports
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

def prepare_data_with_indicators(df, lookback=30):
    """
    Prepare data with technical indicators for LSTM model
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data
    lookback : int, default 30
        Number of days to look back for LSTM input
        
    Returns:
    --------
    X : numpy.ndarray
        Input features for LSTM
    y : numpy.ndarray
        Target values (next day's close price)
    """
    # Make a copy of the original data
    df_with_indicators = df.copy()
    
    # Calculate all technical indicators one by one and handle NaN values
    print("Calculating technical indicators...")
    
    # Calculate ADV15
    print("1. Adding ADV15...")
    adv15_df = ADV15.calculate_adv15(df)
    df_with_indicators = pd.concat([df_with_indicators, adv15_df], axis=1)
    print(f"   - NaN values in ADV15: {adv15_df.isna().sum().sum()}")
    
    # Calculate Bollinger Bands
    print("2. Adding Bollinger Bands...")
    bb_df = BollingerBands.calculate_bollinger_bands(df)
    df_with_indicators = pd.concat([df_with_indicators, bb_df], axis=1)
    print(f"   - NaN values in Bollinger Bands: {bb_df.isna().sum().sum()}")
    
    # Calculate MACD
    print("3. Adding MACD...")
    macd_df = MACD.calculate_macd(df)
    df_with_indicators = pd.concat([df_with_indicators, macd_df], axis=1)
    print(f"   - NaN values in MACD: {macd_df.isna().sum().sum()}")
    
    # Calculate RSI
    print("4. Adding RSI...")
    rsi_df = RSI.calculate_rsi(df)
    df_with_indicators = pd.concat([df_with_indicators, rsi_df], axis=1)
    print(f"   - NaN values in RSI: {rsi_df.isna().sum().sum()}")
    
    # Calculate SMAs
    print("5. Adding SMA...")
    sma20_df = MovingAverages.calculate_sma(df, window=20)
    sma50_df = MovingAverages.calculate_sma(df, window=50)
    df_with_indicators = pd.concat([df_with_indicators, sma20_df, sma50_df], axis=1)
    print(f"   - NaN values in SMA20: {sma20_df.isna().sum().sum()}")
    print(f"   - NaN values in SMA50: {sma50_df.isna().sum().sum()}")
    
    # Calculate EMAs
    print("6. Adding EMA...")
    ema9_df = MovingAverages.calculate_ema(df, span=9)
    ema21_df = MovingAverages.calculate_ema(df, span=21)
    df_with_indicators = pd.concat([df_with_indicators, ema9_df, ema21_df], axis=1)
    print(f"   - NaN values in EMA9: {ema9_df.isna().sum().sum()}")
    print(f"   - NaN values in EMA21: {ema21_df.isna().sum().sum()}")
    
    # Calculate ATR
    print("7. Adding ATR...")
    atr_df = ATR.calculate_atr(df)
    df_with_indicators = pd.concat([df_with_indicators, atr_df], axis=1)
    print(f"   - NaN values in ATR: {atr_df.isna().sum().sum()}")
    
    # Calculate OBV
    print("8. Adding OBV...")
    obv_df = OBV.calculate_obv(df)
    df_with_indicators = pd.concat([df_with_indicators, obv_df], axis=1)
    print(f"   - NaN values in OBV: {obv_df.isna().sum().sum()}")
    
    # Calculate Stochastic
    print("9. Adding Stochastic...")
    stoch_df = Stochastic.calculate_stochastic(df)
    df_with_indicators = pd.concat([df_with_indicators, stoch_df], axis=1)
    print(f"   - NaN values in Stochastic: {stoch_df.isna().sum().sum()}")
    
    # Check for NaN values
    print("\nNaN values by column before handling:")
    na_counts = df_with_indicators.isna().sum()
    print(na_counts[na_counts > 0])  # Only show columns with NaN values
    
    # Find the number of valid rows that have no NaNs
    valid_rows = df_with_indicators.dropna().shape[0]
    print(f"\nRows with no NaN values: {valid_rows} out of {df_with_indicators.shape[0]}")
    
    # Only use data after first 50 days, which should have valid values for all indicators
    min_periods = max(50, lookback)  # At least 50 days or the lookback period, whichever is more
    print(f"\nSkipping first {min_periods} rows to avoid NaN values...")
    df_clean = df_with_indicators.iloc[min_periods:].copy()
    
    # Check for any remaining NaN values
    if df_clean.isna().sum().sum() > 0:
        print("\nRemaining NaN values after skipping initial periods:")
        print(df_clean.isna().sum()[df_clean.isna().sum() > 0])
        
        # Zero out any remaining NaN values
        df_clean = df_clean.fillna(0)
        print("Filled remaining NaN values with zeros")
    
    # Normalize the data
    print("\nNormalizing data...")
    feature_columns = df_clean.columns.drop(['open', 'high', 'low', 'volume'])
    
    # Create a simple min-max scaler, but avoid division by zero
    min_values = df_clean[feature_columns].min()
    max_values = df_clean[feature_columns].max()
    range_values = max_values - min_values
    
    # Replace any zero ranges with 1 to avoid division by zero
    range_values = range_values.replace(0, 1)
    
    # Normalize
    df_normalized = (df_clean[feature_columns] - min_values) / range_values
    
    # Show the normalized data
    print("\nNormalized data shape:", df_normalized.shape)
    if not df_normalized.empty:
        print("Normalized data sample (first 5 rows):")
        print(df_normalized.head())
    
    # Prepare X and y for LSTM
    X, y = [], []
    if len(df_normalized) > lookback:
        for i in range(lookback, len(df_normalized)):
            X.append(df_normalized.iloc[i-lookback:i].values)
            y.append(df_normalized['close'].iloc[i])
        
        X = np.array(X)
        y = np.array(y)
    else:
        print(f"\nWARNING: Not enough data points ({len(df_normalized)}) after handling NaN values. Need at least {lookback+1} points for LSTM.")
        X = np.array([])
        y = np.array([])
    
    return X, y, df_clean

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
    
    print("\nSummary Statistics:")
    print(df.describe().T)
    
    print("\nMemory Usage:")
    memory_usage = df.memory_usage(deep=True).sum() / (1024 * 1024)  # Convert to MB
    print(f"Total: {memory_usage:.2f} MB")

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
    print(f"Original data shape: {df.shape}")
    
    # Prepare data with indicators for LSTM
    X, y, df_with_indicators = prepare_data_with_indicators(df, lookback=30)
    
    # Print the shape of the prepared data
    print(f"\nPrepared data shape: X: {X.shape}, y: {y.shape}")
    
    # Print detailed information about the DataFrame
    print_dataframe_info(df_with_indicators)
    
    # Print all the data points in the DataFrame
    print("\n===== FULL DATAFRAME WITH ALL INDICATORS =====")
    pd.set_option('display.max_columns', None)  # Show all columns
    pd.set_option('display.width', 1000)  # Wider display
    pd.set_option('display.max_rows', None)  # Show all rows
    print(df_with_indicators)
    
    # Reset display options to defaults
    pd.reset_option('display.max_columns')
    pd.reset_option('display.width')
    pd.reset_option('display.max_rows')
    
    print("\nReady for LSTM model training!")
    
    return X, y, df_with_indicators

if __name__ == "__main__":
    print("Starting LSTM example with technical indicators for ACE.csv...")
    X, y, df_with_indicators = main()
    print("Data preparation completed.") 