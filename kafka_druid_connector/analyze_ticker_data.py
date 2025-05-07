#!/usr/bin/env python
"""
Query and analyze NSE500 ticker data from TimescaleDB
"""

import subprocess
import logging
import pandas as pd
import json
from datetime import datetime, timedelta, timezone
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5432'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

def execute_query(query):
    """Execute a SQL query and return the result as a pandas DataFrame."""
    try:
        # Format for CSV output
        csv_query = f"COPY ({query}) TO STDOUT WITH CSV HEADER"
        
        # Execute SQL command using psql
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        result = subprocess.run(f"{psql_cmd} \"{csv_query}\"", shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Error executing query: {result.stderr}")
            return pd.DataFrame()
        
        # Parse CSV output to DataFrame
        df = pd.read_csv(pd.io.common.StringIO(result.stdout))
        return df
        
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        return pd.DataFrame()

def get_available_symbols():
    """Get list of available symbols from the database."""
    query = """
    SELECT symbol, count(*) as record_count
    FROM ticker_daily
    GROUP BY symbol
    ORDER BY record_count DESC
    LIMIT 500;
    """
    
    df = execute_query(query)
    if df.empty:
        logger.warning("No symbols found in the database")
        return []
    
    return df['symbol'].tolist()

def get_symbol_data(symbol, interval='daily', days_back=30):
    """Get ticker data for a specific symbol and interval."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    query = f"""
    SELECT time, open, high, low, close, volume
    FROM ticker_{interval}
    WHERE symbol = '{symbol}'
    AND time >= '{start_date.isoformat()}'
    AND time <= '{end_date.isoformat()}'
    ORDER BY time ASC;
    """
    
    df = execute_query(query)
    if df.empty:
        logger.warning(f"No data found for {symbol} ({interval})")
        return pd.DataFrame()
    
    # Convert time column to datetime
    df['time'] = pd.to_datetime(df['time'])
    
    return df

def calculate_moving_averages(df, short_window=20, long_window=50):
    """Calculate moving averages for a DataFrame."""
    if len(df) < long_window:
        logger.warning(f"Not enough data for moving averages. Need at least {long_window} points.")
        return df
    
    # Calculate moving averages
    df['ma_short'] = df['close'].rolling(window=short_window).mean()
    df['ma_long'] = df['close'].rolling(window=long_window).mean()
    
    return df

def plot_price_chart(symbol, interval='daily', days_back=90):
    """Plot price chart with moving averages for a symbol."""
    df = get_symbol_data(symbol, interval, days_back)
    if df.empty:
        return
    
    # Calculate moving averages
    df = calculate_moving_averages(df)
    
    # Create figure and axis
    fig, ax1 = plt.subplots(figsize=(12, 6))
    
    # Plot price
    ax1.plot(df['time'], df['close'], label='Close Price', color='black')
    
    # Plot moving averages if we have enough data
    if 'ma_short' in df.columns and not df['ma_short'].isna().all():
        ax1.plot(df['time'], df['ma_short'], label='20-day MA', color='blue')
    
    if 'ma_long' in df.columns and not df['ma_long'].isna().all():
        ax1.plot(df['time'], df['ma_long'], label='50-day MA', color='red')
    
    # Set up the first y-axis (price)
    ax1.set_xlabel('Date')
    ax1.set_ylabel('Price')
    ax1.tick_params(axis='y')
    
    # Create second y-axis (volume)
    ax2 = ax1.twinx()
    ax2.bar(df['time'], df['volume'], alpha=0.3, color='gray', label='Volume')
    ax2.set_ylabel('Volume')
    ax2.tick_params(axis='y')
    
    # Title and grid
    plt.title(f"{symbol} - {interval.capitalize()} Chart")
    ax1.grid(True, alpha=0.3)
    
    # Set date formatter
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    fig.autofmt_xdate()
    
    # Create combined legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
    
    plt.tight_layout()
    
    # Save the chart
    plt.savefig(f"{symbol}_{interval}_chart.png")
    logger.info(f"Chart saved as {symbol}_{interval}_chart.png")
    
    return fig

def analyze_top_performers(interval='daily', days_back=30, top_n=10):
    """Analyze and display top performing stocks."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    query = f"""
    WITH starting_prices AS (
        SELECT symbol, time, close
        FROM (
            SELECT symbol, time, close,
                   ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY time ASC) as rn
            FROM ticker_{interval}
            WHERE time >= '{start_date.isoformat()}'
        ) t
        WHERE rn = 1
    ),
    ending_prices AS (
        SELECT symbol, time, close
        FROM (
            SELECT symbol, time, close,
                   ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY time DESC) as rn
            FROM ticker_{interval}
            WHERE time <= '{end_date.isoformat()}'
        ) t
        WHERE rn = 1
    )
    SELECT e.symbol, 
           s.close as start_price, 
           e.close as end_price,
           ((e.close - s.close) / s.close * 100.0) as percent_change,
           s.time as start_time,
           e.time as end_time
    FROM starting_prices s
    JOIN ending_prices e ON s.symbol = e.symbol
    WHERE s.time < e.time  -- Ensure we have data spanning the period
    ORDER BY percent_change DESC
    LIMIT {top_n};
    """
    
    df = execute_query(query)
    if df.empty:
        logger.warning(f"No data found to analyze top performers")
        return pd.DataFrame()
    
    # Format output for display
    df['start_time'] = pd.to_datetime(df['start_time']).dt.strftime('%Y-%m-%d')
    df['end_time'] = pd.to_datetime(df['end_time']).dt.strftime('%Y-%m-%d')
    df['percent_change'] = df['percent_change'].round(2)
    
    logger.info(f"\nTop {top_n} performers ({interval}) from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}:")
    logger.info(df.to_string(index=False))
    
    # Plot top performers
    plt.figure(figsize=(12, 6))
    bars = plt.barh(df['symbol'], df['percent_change'])
    
    # Add value labels
    for bar in bars:
        width = bar.get_width()
        label_x_pos = width if width > 0 else width - 5
        plt.text(label_x_pos, bar.get_y() + bar.get_height()/2, f"{width:.1f}%", 
                 va='center', ha='left' if width > 0 else 'right')
    
    plt.xlabel('Percent Change (%)')
    plt.ylabel('Symbol')
    plt.title(f'Top {top_n} Performers - {days_back} Days')
    plt.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    
    # Save chart
    plt.savefig(f"top_{top_n}_performers_{interval}_{days_back}days.png")
    logger.info(f"Chart saved as top_{top_n}_performers_{interval}_{days_back}days.png")
    
    return df

def calculate_volatility(interval='daily', days_back=30, top_n=10):
    """Calculate and display most volatile stocks."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    query = f"""
    SELECT symbol,
           AVG(close) as avg_price,
           STDDEV(close) as std_dev,
           (STDDEV(close) / AVG(close) * 100.0) as volatility,
           COUNT(*) as data_points
    FROM ticker_{interval}
    WHERE time >= '{start_date.isoformat()}'
    AND time <= '{end_date.isoformat()}'
    GROUP BY symbol
    HAVING COUNT(*) > {days_back / 2}  -- Ensure sufficient data points
    ORDER BY volatility DESC
    LIMIT {top_n};
    """
    
    df = execute_query(query)
    if df.empty:
        logger.warning(f"No data found to calculate volatility")
        return pd.DataFrame()
    
    # Format output for display
    df['avg_price'] = df['avg_price'].round(2)
    df['std_dev'] = df['std_dev'].round(2)
    df['volatility'] = df['volatility'].round(2)
    
    logger.info(f"\nTop {top_n} volatile stocks ({interval}) from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}:")
    logger.info(df.to_string(index=False))
    
    # Plot volatility
    plt.figure(figsize=(12, 6))
    bars = plt.barh(df['symbol'], df['volatility'])
    
    # Add value labels
    for bar in bars:
        width = bar.get_width()
        plt.text(width, bar.get_y() + bar.get_height()/2, f"{width:.1f}%", 
                 va='center', ha='left')
    
    plt.xlabel('Volatility (Coefficient of Variation %)')
    plt.ylabel('Symbol')
    plt.title(f'Top {top_n} Most Volatile Stocks - {days_back} Days')
    plt.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    
    # Save chart
    plt.savefig(f"top_{top_n}_volatile_{interval}_{days_back}days.png")
    logger.info(f"Chart saved as top_{top_n}_volatile_{interval}_{days_back}days.png")
    
    return df

def main():
    """Main function to analyze NSE500 ticker data."""
    logger.info("\nAnalyzing NSE500 ticker data in TimescaleDB...\n")
    
    # Get available symbols
    symbols = get_available_symbols()
    if not symbols:
        logger.error("No data found in the database. Please run the data fetch script first.")
        return
    
    logger.info(f"Found {len(symbols)} symbols with data in the database")
    
    # Analyze top performers for different periods
    analyze_top_performers(interval='daily', days_back=30, top_n=10)
    analyze_top_performers(interval='daily', days_back=90, top_n=10)
    
    # Calculate volatility
    calculate_volatility(interval='daily', days_back=30, top_n=10)
    
    # Plot charts for top 5 symbols by record count
    for symbol in symbols[:5]:
        plot_price_chart(symbol, interval='daily', days_back=90)
        plot_price_chart(symbol, interval='weekly', days_back=365)
    
    logger.info("\nAnalysis completed!")

if __name__ == "__main__":
    main() 