#!/usr/bin/env python
"""
Analyze and visualize ticker_summary data from TimescaleDB
"""

import pandas as pd
import matplotlib.pyplot as plt
import psycopg2
import seaborn as sns

# TimescaleDB Configuration
db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}

def fetch_ticker_summary():
    """Fetch all data from ticker_summary table."""
    try:
        conn = psycopg2.connect(**db_params)
        query = """
        SELECT symbol, days_of_data, date_from, date_to, avg_volume, avg_close
        FROM ticker_summary
        ORDER BY symbol;
        """
        df = pd.read_sql_query(query, conn)
        df['date_from'] = pd.to_datetime(df['date_from'])
        df['date_to'] = pd.to_datetime(df['date_to'])
        conn.close()
        return df
    except Exception as e:
        print(f"Error fetching ticker_summary data: {e}")
        return pd.DataFrame()

def plot_top_volume(df, top_n=10):
    """Plot top N symbols by average volume."""
    top_volume = df.nlargest(top_n, 'avg_volume')[['symbol', 'avg_volume']]
    plt.figure(figsize=(12, 6))
    bars = plt.bar(top_volume['symbol'], top_volume['avg_volume'])
    
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01*height,
                 f'{int(height):,}', ha='center', va='bottom')
    
    plt.title(f'Top {top_n} Symbols by Average Daily Volume')
    plt.xlabel('Symbol')
    plt.ylabel('Average Volume')
    plt.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig('top_volume.png')
    plt.close()
    print("Saved plot: top_volume.png")

def plot_top_close(df, top_n=10):
    """Plot top N symbols by average closing price."""
    top_close = df.nlargest(top_n, 'avg_close')[['symbol', 'avg_close']]
    plt.figure(figsize=(12, 6))
    bars = plt.bar(top_close['symbol'], top_close['avg_close'])
    
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.01*height,
                 f'{height:.2f}', ha='center', va='bottom')
    
    plt.title(f'Top {top_n} Symbols by Average Closing Price')
    plt.xlabel('Symbol')
    plt.ylabel('Average Close Price')
    plt.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig('top_close.png')
    plt.close()
    print("Saved plot: top_close.png")

def plot_distributions(df):
    """Plot histograms of average volume and closing price."""
    plt.figure(figsize=(12, 8))
    
    plt.subplot(2, 1, 1)
    plt.hist(df['avg_volume'], bins=30, edgecolor='black')
    plt.title('Distribution of Average Daily Volume')
    plt.xlabel('Average Volume')
    plt.ylabel('Frequency')
    plt.grid(axis='y', alpha=0.3)
    
    plt.subplot(2, 1, 2)
    plt.hist(df['avg_close'], bins=30, edgecolor='black')
    plt.title('Distribution of Average Closing Price')
    plt.xlabel('Average Close Price')
    plt.ylabel('Frequency')
    plt.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('distributions.png')
    plt.close()
    print("Saved plot: distributions.png")

def plot_volume_vs_close(df):
    """Plot scatter of average volume vs. average closing price."""
    plt.figure(figsize=(10, 6))
    plt.scatter(df['avg_volume'], df['avg_close'], alpha=0.5)
    
    # Label top 5 symbols by volume
    top_5_volume = df.nlargest(5, 'avg_volume')
    for i, row in top_5_volume.iterrows():
        plt.annotate(row['symbol'], (row['avg_volume'], row['avg_close']))
    
    plt.title('Average Volume vs. Average Closing Price')
    plt.xlabel('Average Volume')
    plt.ylabel('Average Close Price')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('volume_vs_close.png')
    plt.close()
    print("Saved plot: volume_vs_close.png")

def print_insights(df):
    """Print important insights from ticker_summary data."""
    print("\n=== Insights from ticker_summary Data ===\n")
    
    # Summary statistics
    print("Summary Statistics:")
    print(df[['avg_volume', 'avg_close', 'days_of_data']].describe().round(2))
    
    # Top and bottom symbols by volume
    print("\nTop 5 Symbols by Average Volume:")
    print(df.nlargest(5, 'avg_volume')[['symbol', 'avg_volume']].to_string(index=False))
    print("\nBottom 5 Symbols by Average Volume:")
    print(df.nsmallest(5, 'avg_volume')[['symbol', 'avg_volume']].to_string(index=False))
    
    # Top and bottom symbols by closing price
    print("\nTop 5 Symbols by Average Closing Price:")
    print(df.nlargest(5, 'avg_close')[['symbol', 'avg_close']].to_string(index=False))
    print("\nBottom 5 Symbols by Average Closing Price:")
    print(df.nsmallest(5, 'avg_close')[['symbol', 'avg_close']].to_string(index=False))
    
    # Data coverage
    print("\nData Coverage:")
    print(f"Total symbols: {len(df)}")
    print(f"Average days of data: {df['days_of_data'].mean():.2f}")
    incomplete = df[df['days_of_data'] < df['days_of_data'].max()]
    if not incomplete.empty:
        print(f"Symbols with incomplete data (< {df['days_of_data'].max()} days):")
        print(incomplete[['symbol', 'days_of_data']].to_string(index=False))

def main():
    """Main function to analyze and visualize ticker_summary data."""
    print("\nAnalyzing and Visualizing ticker_summary Data\n")
    
    # Fetch data
    df = fetch_ticker_summary()
    if df.empty:
        print("No data found in ticker_summary table.")
        return
    
    # Generate plots
    plot_top_volume(df)
    plot_top_close(df)
    plot_distributions(df)
    plot_volume_vs_close(df)
    
    # Print insights
    print_insights(df)
    
    print("\nAnalysis and visualization completed!")

if __name__ == "__main__":
    main()