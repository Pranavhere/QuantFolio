#!/usr/bin/env python
"""
Visualize NSE500 stock data from TimescaleDB
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import psycopg2

# TimescaleDB Configuration
db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}

def get_stock_data_by_symbol(symbol):
    """Get all data for a specific stock symbol."""
    try:
        conn = psycopg2.connect(**db_params)
        query = """
        SELECT date, symbol, close, volume
        FROM nse500_data
        WHERE symbol = %s
        ORDER BY date ASC;
        """
        df = pd.read_sql_query(query, conn, params=(symbol,))
        df['date'] = pd.to_datetime(df['date'])
        conn.close()
        return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return pd.DataFrame(columns=['date', 'symbol', 'close', 'volume'])

def get_available_symbols():
    """Get a list of all available stock symbols in the database."""
    try:
        conn = psycopg2.connect(**db_params)
        query = """
        SELECT DISTINCT symbol
        FROM nse500_data
        ORDER BY symbol;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df['symbol'].tolist()
    except Exception as e:
        print(f"Error fetching symbols: {e}")
        return []

def plot_stock_price(symbol=None):
    """Plot the stock price over time."""
    if symbol is None:
        symbols = get_available_symbols()[:5]  # Limit to 5 for clarity
    else:
        symbols = [symbol]
    
    print(f"Plotting symbols: {symbols}")
    
    plt.figure(figsize=(12, 8))
    
    for symbol in symbols:
        df = get_stock_data_by_symbol(symbol)
        if df.empty:
            print(f"No data found for symbol: {symbol}")
            continue
        plt.plot(df['date'], df['close'], label=symbol)
    
    plt.title('Stock Price Over Time')
    plt.xlabel('Date')
    plt.ylabel('Close Price')
    plt.grid(True)
    plt.legend()
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gcf().autofmt_xdate()
    plt.tight_layout()
    plt.savefig('stock_prices.png')
    print("Plot saved as stock_prices.png")
    plt.close()

def plot_volume_by_symbol():
    """Plot the total trading volume by symbol."""
    try:
        conn = psycopg2.connect(**db_params)
        query = """
        SELECT symbol, SUM(volume) as total_volume
        FROM nse500_data
        GROUP BY symbol
        ORDER BY total_volume DESC
        LIMIT 10;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            print("No volume data available.")
            return
        
        plt.figure(figsize=(10, 6))
        bars = plt.bar(df['symbol'], df['total_volume'])
        
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                     f'{int(height):,}',
                     ha='center', va='bottom')
        
        plt.title('Top 10 Total Trading Volume by Symbol')
        plt.xlabel('Symbol')
        plt.ylabel('Total Volume')
        plt.grid(axis='y')
        plt.tight_layout()
        plt.savefig('volume_by_symbol.png')
        print("Plot saved as volume_by_symbol.png")
        plt.close()
    
    except Exception as e:
        print(f"Error plotting volume: {e}")

def plot_daily_average():
    """Plot the daily average close price for each symbol."""
    try:
        conn = psycopg2.connect(**db_params)
        query = """
        SELECT symbol, date, AVG(close) as avg_close
        FROM nse500_data
        GROUP BY symbol, date
        ORDER BY date, symbol;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            print("No data available for daily averages.")
            return
        
        df['date'] = pd.to_datetime(df['date'])
        
        plt.figure(figsize=(12, 8))
        symbols = df['symbol'].unique()[:5]  # Limit to 5 for clarity
        
        for symbol in symbols:
            symbol_data = df[df['symbol'] == symbol]
            plt.plot(symbol_data['date'], symbol_data['avg_close'], label=symbol, marker='o')
        
        plt.title('Daily Average Close Price by Symbol')
        plt.xlabel('Date')
        plt.ylabel('Average Close Price')
        plt.grid(True)
        plt.legend()
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        plt.gcf().autofmt_xdate()
        plt.tight_layout()
        plt.savefig('daily_averages.png')
        print("Plot saved as daily_averages.png")
        plt.close()
    
    except Exception as e:
        print(f"Error plotting daily averages: {e}")

def main():
    """Main function to visualize stock data."""
    print("\nStock Data Visualization\n")
    
    print("Generating price over time plot...")
    plot_stock_price()
    
    print("\nGenerating volume by symbol plot...")
    plot_volume_by_symbol()
    
    print("\nGenerating daily average price plot...")
    plot_daily_average()
    
    print("\nVisualizations completed!")

if __name__ == "__main__":
    main()