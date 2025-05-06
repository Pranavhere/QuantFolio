#!/usr/bin/env python
"""
Visualize stock market data from TimescaleDB
"""

import subprocess
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import io

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5432'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

def get_stock_data_by_symbol(symbol):
    """Get all data for a specific stock symbol."""
    
    query = f"""
    SELECT 
        time, 
        symbol, 
        price, 
        volume, 
        exchange, 
        change_percent
    FROM stock_market_data
    WHERE symbol = '{symbol}'
    ORDER BY time ASC;
    """
    
    # Use standard format output and capture the data
    psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
    cmd = psql_cmd + f" \"{query}\""
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Create an empty DataFrame with the expected columns
    df = pd.DataFrame(columns=['time', 'symbol', 'price', 'volume', 'exchange', 'change_percent'])
    
    # Parse output line by line
    output_lines = result.stdout.strip().split('\n')
    
    # Check if we have any data (at least header line, separator line, one data row)
    if len(output_lines) < 4:
        print(f"No data found for symbol: {symbol}")
        return df
    
    # Find the header line and separator line
    header_idx = -1
    data_start_idx = -1
    
    for i, line in enumerate(output_lines):
        if 'time' in line and 'symbol' in line and 'price' in line:
            header_idx = i
            data_start_idx = i + 2  # Skip header and separator line
            break
    
    if header_idx == -1 or data_start_idx >= len(output_lines):
        print(f"Unexpected format for symbol: {symbol}")
        return df
    
    # Process header to get column positions
    header = output_lines[header_idx]
    header_items = []
    columns = ['time', 'symbol', 'price', 'volume', 'exchange', 'change_percent']
    
    # Extract data rows, stopping at summary line (contains word "row" or "rows")
    data_rows = []
    for i in range(data_start_idx, len(output_lines)):
        line = output_lines[i]
        if "row" in line or "rows" in line:
            break
        
        # Split by | and strip whitespace
        values = [val.strip() for val in line.split('|')]
        if len(values) == 6:  # Expected number of columns
            data_rows.append(values)
    
    # Create DataFrame from data rows
    if data_rows:
        df = pd.DataFrame(data_rows, columns=columns)
        
        # Convert data types
        df['time'] = pd.to_datetime(df['time'])
        df['price'] = pd.to_numeric(df['price'])
        df['volume'] = pd.to_numeric(df['volume'])
        df['change_percent'] = pd.to_numeric(df['change_percent'])
    
    return df

def get_available_symbols():
    """Get a list of all available stock symbols in the database."""
    
    query = """
    SELECT DISTINCT symbol 
    FROM stock_market_data 
    ORDER BY symbol;
    """
    
    psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
    cmd = psql_cmd + f" \"{query}\""
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Parse output to get symbols
    lines = result.stdout.strip().split('\n')
    
    # Check if we have any data (at least header, separator, one symbol, row count)
    if len(lines) < 4:
        return []
    
    # Symbols start after header and separator line (index 2) and continue until the row count line
    symbols = []
    for i in range(2, len(lines)):
        line = lines[i].strip()
        if "row" in line or "rows" in line:
            break
        symbols.append(line)
    
    return symbols

def plot_stock_price(symbol=None):
    """Plot the stock price over time."""
    
    if symbol is None:
        # Get all available symbols
        symbols = get_available_symbols()
        if not symbols:
            print("No stock data available in the database.")
            return
    else:
        symbols = [symbol]
    
    print(f"Found symbols: {symbols}")
    
    plt.figure(figsize=(12, 8))
    
    for symbol in symbols:
        # Get data for this symbol
        df = get_stock_data_by_symbol(symbol)
        
        if df.empty:
            print(f"No data found for symbol: {symbol}")
            continue
            
        # Plot the price
        plt.plot(df['time'], df['price'], label=symbol)
    
    plt.title('Stock Price Over Time')
    plt.xlabel('Time')
    plt.ylabel('Price')
    plt.grid(True)
    plt.legend()
    
    # Format the x-axis to show dates nicely
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
    plt.gcf().autofmt_xdate()
    
    plt.tight_layout()
    plt.savefig('stock_prices.png')
    print(f"Plot saved as stock_prices.png")
    plt.show()

def plot_volume_by_symbol():
    """Plot the total trading volume by symbol."""
    
    query = """
    SELECT 
        symbol, 
        SUM(volume) as total_volume
    FROM stock_market_data
    GROUP BY symbol
    ORDER BY total_volume DESC;
    """
    
    psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
    cmd = psql_cmd + f" \"{query}\""
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Create an empty DataFrame
    df = pd.DataFrame(columns=['symbol', 'total_volume'])
    
    # Parse output line by line
    output_lines = result.stdout.strip().split('\n')
    
    # Check if we have any data
    if len(output_lines) < 4:
        print("No volume data available in the database.")
        return
    
    # Find the header line and separator line
    header_idx = -1
    data_start_idx = -1
    
    for i, line in enumerate(output_lines):
        if 'symbol' in line and 'total_volume' in line:
            header_idx = i
            data_start_idx = i + 2  # Skip header and separator line
            break
    
    if header_idx == -1 or data_start_idx >= len(output_lines):
        print("Unexpected format for volume data")
        return
    
    # Extract data rows
    data_rows = []
    for i in range(data_start_idx, len(output_lines)):
        line = output_lines[i]
        if "row" in line or "rows" in line:
            break
        
        # Split by | and strip whitespace
        values = [val.strip() for val in line.split('|')]
        if len(values) == 2:  # Expected number of columns
            data_rows.append(values)
    
    # Create DataFrame from data rows
    if data_rows:
        df = pd.DataFrame(data_rows, columns=['symbol', 'total_volume'])
        df['total_volume'] = pd.to_numeric(df['total_volume'])
    else:
        print("No volume data available in the database.")
        return
    
    plt.figure(figsize=(10, 6))
    bars = plt.bar(df['symbol'], df['total_volume'])
    
    # Add value labels on top of bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                 f'{int(height):,}',
                 ha='center', va='bottom', rotation=0)
    
    plt.title('Total Trading Volume by Symbol')
    plt.xlabel('Symbol')
    plt.ylabel('Total Volume')
    plt.grid(axis='y')
    plt.tight_layout()
    plt.savefig('volume_by_symbol.png')
    print(f"Plot saved as volume_by_symbol.png")
    plt.show()

def plot_hourly_average():
    """Plot the hourly average price for each symbol."""
    
    query = """
    SELECT 
        symbol, 
        time_bucket('1 hour', time) AS hour,
        AVG(price) AS avg_price
    FROM stock_market_data
    GROUP BY symbol, hour
    ORDER BY hour, symbol;
    """
    
    psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
    cmd = psql_cmd + f" \"{query}\""
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    # Create an empty DataFrame
    df = pd.DataFrame(columns=['symbol', 'hour', 'avg_price'])
    
    # Parse output line by line
    output_lines = result.stdout.strip().split('\n')
    
    # Check if we have any data
    if len(output_lines) < 4:
        print("No data available for hourly averages.")
        return
    
    # Find the header line and separator line
    header_idx = -1
    data_start_idx = -1
    
    for i, line in enumerate(output_lines):
        if 'symbol' in line and 'hour' in line and 'avg_price' in line:
            header_idx = i
            data_start_idx = i + 2  # Skip header and separator line
            break
    
    if header_idx == -1 or data_start_idx >= len(output_lines):
        print("Unexpected format for hourly average data")
        return
    
    # Extract data rows
    data_rows = []
    for i in range(data_start_idx, len(output_lines)):
        line = output_lines[i]
        if "row" in line or "rows" in line:
            break
        
        # Split by | and strip whitespace
        values = [val.strip() for val in line.split('|')]
        if len(values) == 3:  # Expected number of columns
            data_rows.append(values)
    
    # Create DataFrame from data rows
    if data_rows:
        df = pd.DataFrame(data_rows, columns=['symbol', 'hour', 'avg_price'])
        df['hour'] = pd.to_datetime(df['hour'])
        df['avg_price'] = pd.to_numeric(df['avg_price'])
    else:
        print("No data available for hourly averages.")
        return
    
    plt.figure(figsize=(12, 8))
    
    # Get unique symbols
    symbols = df['symbol'].unique()
    
    for symbol in symbols:
        symbol_data = df[df['symbol'] == symbol]
        plt.plot(symbol_data['hour'], symbol_data['avg_price'], label=symbol, marker='o')
    
    plt.title('Hourly Average Price by Symbol')
    plt.xlabel('Hour')
    plt.ylabel('Average Price')
    plt.grid(True)
    plt.legend()
    
    # Format the x-axis to show dates nicely
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
    plt.gcf().autofmt_xdate()
    
    plt.tight_layout()
    plt.savefig('hourly_averages.png')
    print(f"Plot saved as hourly_averages.png")
    plt.show()

def main():
    """Main function to visualize stock data."""
    print("\nStock Data Visualization\n")
    
    # Plot stock prices for all symbols
    print("Generating price over time plot...")
    plot_stock_price()
    
    # Plot volume by symbol
    print("\nGenerating volume by symbol plot...")
    plot_volume_by_symbol()
    
    # Plot hourly averages
    print("\nGenerating hourly average price plot...")
    plot_hourly_average()
    
    print("\nVisualizations completed!")

if __name__ == "__main__":
    main() 