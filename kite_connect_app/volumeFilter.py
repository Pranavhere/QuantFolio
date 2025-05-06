#!/usr/bin/env python
import datetime
import time
import pandas as pd
import subprocess
import os
from nifty500_symbols import get_nifty500_symbols

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
            print(f"Error executing query: {result.stderr}")
            return pd.DataFrame()
        
        # Parse CSV output to DataFrame
        df = pd.read_csv(pd.io.common.StringIO(result.stdout))
        return df
        
    except Exception as e:
        print(f"Error executing query: {e}")
        return pd.DataFrame()

def execute_sql(sql):
    """Execute a SQL statement that doesn't return results."""
    try:
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        result = subprocess.run(f"{psql_cmd} \"{sql}\"", shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error executing SQL: {result.stderr}")
            return False
        return True
        
    except Exception as e:
        print(f"Error executing SQL: {e}")
        return False

def load_market_cap_data(file_path):
    """Load market cap data from the provided CSV file"""
    try:
        market_cap_df = pd.read_csv(file_path)
        print(f"Loaded market cap data for {len(market_cap_df)} companies")
        
        # Create a dictionary with symbol as key and market cap as value
        market_cap_dict = {}
        for _, row in market_cap_df.iterrows():
            symbol = row.iloc[0]  # First column is symbol
            market_cap = row.iloc[1]  # Second column is market cap
            market_cap_dict[symbol] = market_cap
            
        return market_cap_dict
    except Exception as e:
        print(f"Error loading market cap data: {e}")
        return {}

def fetch_data_from_timescaledb(symbols, market_cap_dict, from_date, to_date):
    print(f"Fetching price and volume data for {len(symbols)} symbols from {from_date} to {to_date}...")
    
    results = {}
    count = 0
    skipped_symbols = []
    
    for symbol in symbols:
        try:
            # Skip if market cap data is not available
            if symbol not in market_cap_dict:
                print(f"Skipping {symbol}: Market cap data not available")
                skipped_symbols.append(symbol)
                continue
                
            market_cap = market_cap_dict[symbol]
            
            # Skip if market cap is zero to avoid division by zero
            if market_cap <= 0:
                print(f"Skipping {symbol}: Invalid market cap value ({market_cap})")
                skipped_symbols.append(symbol)
                continue
                
            print(f"Fetching data for {symbol} ({count+1}/{len(symbols)})")
            
            # Query to fetch data for this symbol in the date range
            query = f"""
            SELECT 
                time::date as date,
                symbol,
                close,
                volume
            FROM ticker_daily
            WHERE symbol = '{symbol}'
            AND time BETWEEN '{from_date}' AND '{to_date}'
            ORDER BY time
            """
            
            # Execute query
            df = execute_query(query)
            
            if df.empty:
                print(f"No data found for {symbol}")
                skipped_symbols.append(symbol)
                continue
            
            # Calculate value (close * volume) and value/market cap ratio for each day
            processed_data = []
            for _, row in df.iterrows():
                date_str = row['date']
                close = row['close']
                volume = row['volume']
                
                # FORMULA: close * volume / market_cap
                value_to_mcap_ratio = (close * volume) / market_cap
                
                processed_data.append({
                    "date": date_str,
                    "close": close,
                    "volume": volume,
                    "value_to_mcap_ratio": value_to_mcap_ratio
                })
            
            results[symbol] = processed_data
            count += 1
                
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            skipped_symbols.append(symbol)
    
    print(f"Successfully processed data for {count} symbols.")
    print(f"Skipped {len(skipped_symbols)} symbols due to missing market cap data or database errors.")
    
    return results

def create_top200_table():
    """Create the top200volume table if it doesn't exist."""
    sql = """
    CREATE TABLE IF NOT EXISTS top200volume (
        time TIMESTAMPTZ NOT NULL,
        symbol TEXT NOT NULL,
        open DOUBLE PRECISION,
        high DOUBLE PRECISION,
        low DOUBLE PRECISION,
        close DOUBLE PRECISION,
        volume DOUBLE PRECISION,
        rank INTEGER,
        avg_daily_volume DOUBLE PRECISION,
        avg_value_to_mcap_ratio DOUBLE PRECISION,
        market_cap DOUBLE PRECISION,
        PRIMARY KEY (time, symbol)
    );
    
    -- Add hypertable if not already
    SELECT create_hypertable('top200volume', 'time', if_not_exists => TRUE);
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_top200volume_symbol ON top200volume (symbol);
    CREATE INDEX IF NOT EXISTS idx_top200volume_rank ON top200volume (rank);
    """
    
    if execute_sql(sql):
        print("Successfully created/verified top200volume table")
    else:
        print("Failed to create top200volume table")

def store_top200_data(top_symbols, summary_df):
    """Store data for top 200 symbols in the top200volume table."""
    print(f"Storing data for top {len(top_symbols)} symbols in top200volume table...")
    
    # First, clear existing data in the table
    clear_sql = "TRUNCATE TABLE top200volume;"
    execute_sql(clear_sql)
    
    # For each symbol, fetch its data and insert into the top200volume table
    insert_count = 0
    
    # Create a rank mapping from summary_df
    summary_dict = {}
    for i, row in summary_df.iterrows():
        symbol = row['symbol']
        summary_dict[symbol] = {
            'rank': i + 1,  # 1-based rank
            'avg_daily_volume': row['avg_daily_volume'],
            'avg_value_to_mcap_ratio': row['avg_value_to_mcap_ratio'],
            'market_cap': row['market_cap']
        }
    
    # Batch size for inserts
    batch_size = 1000
    all_values = []
    
    for symbol in top_symbols:
        # Get the rank and other summary data for this symbol
        rank = summary_dict[symbol]['rank']
        avg_daily_volume = summary_dict[symbol]['avg_daily_volume']
        avg_value_to_mcap_ratio = summary_dict[symbol]['avg_value_to_mcap_ratio']
        market_cap = summary_dict[symbol]['market_cap']
        
        # Fetch the historical data for this symbol
        query = f"""
        SELECT 
            time,
            symbol,
            open,
            high,
            low,
            close,
            volume
        FROM ticker_daily
        WHERE symbol = '{symbol}'
        ORDER BY time
        """
        
        df = execute_query(query)
        
        if df.empty:
            print(f"No data found for {symbol} to store in top200volume")
            continue
        
        # Add values to the batch
        for _, row in df.iterrows():
            # Format timestamp for SQL
            time_str = row['time']
            
            # Format values for SQL insertion
            value = f"('{time_str}', '{symbol}', {row['open']}, {row['high']}, {row['low']}, {row['close']}, {row['volume']}, {rank}, {avg_daily_volume}, {avg_value_to_mcap_ratio}, {market_cap})"
            all_values.append(value)
        
        # Insert in batches
        if len(all_values) >= batch_size:
            values_str = ", ".join(all_values[:batch_size])
            
            insert_sql = f"""
            INSERT INTO top200volume (time, symbol, open, high, low, close, volume, rank, avg_daily_volume, avg_value_to_mcap_ratio, market_cap)
            VALUES {values_str}
            ON CONFLICT (time, symbol) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume,
            rank = EXCLUDED.rank,
            avg_daily_volume = EXCLUDED.avg_daily_volume,
            avg_value_to_mcap_ratio = EXCLUDED.avg_value_to_mcap_ratio,
            market_cap = EXCLUDED.market_cap;
            """
            
            success = execute_sql(insert_sql)
            if success:
                insert_count += len(all_values[:batch_size])
            
            # Reset the batch
            all_values = all_values[batch_size:]
    
    # Insert any remaining values
    if all_values:
        values_str = ", ".join(all_values)
        
        insert_sql = f"""
        INSERT INTO top200volume (time, symbol, open, high, low, close, volume, rank, avg_daily_volume, avg_value_to_mcap_ratio, market_cap)
        VALUES {values_str}
        ON CONFLICT (time, symbol) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        rank = EXCLUDED.rank,
        avg_daily_volume = EXCLUDED.avg_daily_volume,
        avg_value_to_mcap_ratio = EXCLUDED.avg_value_to_mcap_ratio,
        market_cap = EXCLUDED.market_cap;
        """
        
        success = execute_sql(insert_sql)
        if success:
            insert_count += len(all_values)
    
    print(f"Successfully stored {insert_count} records in top200volume table")
    return insert_count

def get_top_200_symbols():
    """Function that can be imported by other scripts to get the top 200 symbols
    
    Returns:
        dict: A dictionary containing two keys:
            - 'symbols': List of top 200 symbols
            - 'adv15': Dictionary mapping symbols to their 15-day Average Daily Volume
    """
    return main()

def main():
    # Get Nifty 500 symbols
    symbols = get_nifty500_symbols()
    print(f"Fetched {len(symbols)} symbols from Nifty 500")
    
    # Load market cap data
    market_cap_dict = load_market_cap_data("/Users/pranavlakhotia/marketcap_data.csv")
    
    # Set date range - past 15 days
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=15)
    
    # Fetch data from TimescaleDB and calculate value-to-market-cap ratios
    results = fetch_data_from_timescaledb(symbols, market_cap_dict, start_date, end_date)
    
    # Calculate averages for each symbol
    summary = []
    adv15_dict = {}  # Dictionary to store ADV15 values
    
    for symbol, data in results.items():
        if data and len(data) > 0:  # Check if data exists
            # Calculate averages over the 15-day period
            avg_volume = sum(item["volume"] for item in data) / len(data)
            avg_close = sum(item["close"] for item in data) / len(data)
            
            # FORMULA: Average of (close * volume / market_cap) over 15 days
            avg_value_to_mcap_ratio = sum(item["value_to_mcap_ratio"] for item in data) / len(data)
            
            # Store ADV15 value in dictionary (still keeping this for compatibility)
            adv15_dict[symbol] = avg_volume
            
            summary.append({
                "symbol": symbol,
                "avg_daily_volume": avg_volume,
                "avg_close": avg_close,
                "avg_value_to_mcap_ratio": avg_value_to_mcap_ratio,
                "market_cap": market_cap_dict.get(symbol, 0),
                "days_of_data": len(data)
            })
    
    # Convert to DataFrame and sort by value_to_mcap_ratio (the key ranking metric)
    summary_df = pd.DataFrame(summary)
    summary_df.sort_values("avg_value_to_mcap_ratio", ascending=False, inplace=True)
    
    # Print the formula being used for clarity
    print("\nRanking Formula: Average of (close * volume / market_cap) over 15 days")
    
    # Get top 200 symbols by value_to_mcap_ratio
    top_200_df = summary_df.head(200)
    top_200_symbols = top_200_df["symbol"].tolist()
    
    # Create filtered ADV15 dictionary with only the top 200 symbols
    top_200_adv15 = {symbol: adv15_dict[symbol] for symbol in top_200_symbols}
    
    print(f"\nGenerated list of top 200 symbols based on value-to-market-cap ratio")
    print(f"First 10 symbols: {top_200_symbols[:10]}")
    
    # Display top 10 with their value_to_mcap_ratio values
    print("\nTop 10 symbols with their value-to-market-cap ratios:")
    for i, (_, row) in enumerate(top_200_df.head(10).iterrows(), 1):
        print(f"{i}. {row['symbol']}: {row['avg_value_to_mcap_ratio']:.6f}")
    
    # Create top200volume table
    create_top200_table()
    
    # Store data for top 200 symbols
    store_top200_data(top_200_symbols, top_200_df)
    
    # Return both the list of symbols and the ADV15 dictionary
    return {
        "symbols": top_200_symbols,
        "adv15": top_200_adv15
    }

if __name__ == "__main__":
    result = main()
    # Print a sample of the ADV15 values (still keeping this for compatibility)
    print("\nSample ADV15 values (first 5 symbols):")
    for i, symbol in enumerate(result["symbols"][:5]):
        print(f"{symbol}: {result['adv15'][symbol]:,.0f}") 