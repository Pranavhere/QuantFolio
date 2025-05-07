#!/usr/bin/env python
"""
Fetch 500 trading days of NSE500 ticker data and display sample data
"""

import datetime
import time
import logging
import subprocess
import sys
import os
import json
from pathlib import Path
import pandas as pd

# Add the path to the kite_connect_app directory to import modules
sys.path.append(str(Path(__file__).resolve().parent.parent))
from kite_connect_app.kite_client import KiteClient
from kite_connect_app.nifty500_symbols import get_nifty500_symbols

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5432'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

def get_instrument_tokens(client, symbols):
    """Get instrument tokens for the given symbols."""
    logger.info(f"Fetching instrument tokens for {len(symbols)} symbols...")
    instruments = client.kite.instruments("NSE")
    
    # Create a dictionary mapping symbol to instrument token
    token_map = {}
    for instrument in instruments:
        if instrument["tradingsymbol"] in symbols:
            token_map[instrument["tradingsymbol"]] = instrument["instrument_token"]
    
    logger.info(f"Found tokens for {len(token_map)} out of {len(symbols)} symbols")
    return token_map

def store_ticker_data(symbol, interval, data):
    """Store ticker data in TimescaleDB."""
    try:
        if not data:
            logger.warning(f"No data to store for {symbol} ({interval})")
            return 0
        
        # Map Kite intervals to our table names
        interval_map = {
            "minute": "minutely",
            "hour": "hourly", 
            "day": "daily",
            "week": "weekly"
        }
        
        table_name = f"ticker_{interval_map.get(interval, interval)}"
        
        # Prepare values for insertion
        values_list = []
        for candle in data:
            # Format the timestamp
            if isinstance(candle["date"], datetime.datetime):
                timestamp = candle["date"].strftime("%Y-%m-%d %H:%M:%S%z")
            else:
                # Parse string date/time
                timestamp = candle["date"]
            
            # Format values for SQL insertion
            values = f"('{timestamp}', '{symbol}', {candle['open']}, {candle['high']}, {candle['low']}, {candle['close']}, {candle['volume']})"
            values_list.append(values)
        
        # Batch insert to improve performance
        batch_size = 100
        inserted_count = 0
        
        for i in range(0, len(values_list), batch_size):
            batch_values = ", ".join(values_list[i:i+batch_size])
            
            insert_sql = f"""
            INSERT INTO {table_name} (time, symbol, open, high, low, close, volume)
            VALUES {batch_values}
            ON CONFLICT (time, symbol) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume;
            """
            
            psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
            result = subprocess.run(f"{psql_cmd} \"{insert_sql}\"", shell=True, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Error inserting data: {result.stderr}")
                return inserted_count
            
            inserted_count += min(batch_size, len(values_list) - i)
        
        logger.info(f"Inserted {inserted_count} records for {symbol} ({interval})")
        return inserted_count
        
    except Exception as e:
        logger.error(f"Error storing data for {symbol} ({interval}): {e}")
        return 0

def store_symbol_metadata(symbols):
    """Store symbol metadata in TimescaleDB."""
    try:
        logger.info(f"Storing metadata for {len(symbols)} symbols...")
        
        # Prepare values for insertion
        values_list = []
        for symbol in symbols:
            values = f"('{symbol}', NULL, NULL, FALSE, FALSE, TRUE, NOW())"
            values_list.append(values)
        
        # Batch insert
        batch_size = 100
        inserted_count = 0
        
        for i in range(0, len(values_list), batch_size):
            batch_values = ", ".join(values_list[i:i+batch_size])
            
            insert_sql = f"""
            INSERT INTO ticker_symbols (symbol, company_name, sector, is_nifty50, is_nifty100, is_nifty500, last_updated)
            VALUES {batch_values}
            ON CONFLICT (symbol) DO UPDATE SET
            is_nifty500 = TRUE,
            last_updated = NOW();
            """
            
            psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
            result = subprocess.run(f"{psql_cmd} \"{insert_sql}\"", shell=True, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Error inserting symbol metadata: {result.stderr}")
                return inserted_count
            
            inserted_count += min(batch_size, len(values_list) - i)
        
        logger.info(f"Inserted/updated metadata for {inserted_count} symbols")
        return inserted_count
        
    except Exception as e:
        logger.error(f"Error storing symbol metadata: {e}")
        return 0

def fetch_historical_data(client, token_map, from_date, to_date, interval="day"):
    """Fetch historical data and store in TimescaleDB."""
    logger.info(f"Fetching {interval} historical data for {len(token_map)} symbols from {from_date} to {to_date}...")
    
    results = {}
    count = 0
    stored_count = 0
    data_samples = {}
    
    for symbol, token in token_map.items():
        try:
            logger.info(f"Fetching {interval} data for {symbol} ({count+1}/{len(token_map)})")
            historical_data = client.kite.historical_data(
                token, 
                from_date, 
                to_date, 
                interval, 
                oi=False
            )
            
            # Store first 5 data points as sample
            if historical_data and len(historical_data) > 0:
                data_samples[symbol] = historical_data[:5]
            
            # Store data in TimescaleDB
            records_stored = store_ticker_data(symbol, interval, historical_data)
            stored_count += records_stored
            
            results[symbol] = len(historical_data)
            count += 1
            
            # Sleep to avoid hitting rate limits
            if count % 5 == 0:
                time.sleep(2)
                
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
    
    logger.info(f"Successfully fetched data for {count} symbols. Stored {stored_count} records in TimescaleDB.")
    return results, data_samples

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

def display_sample_data(interval):
    """Display sample data from TimescaleDB."""
    table_name = f"ticker_{interval}"
    
    query = f"""
    SELECT symbol, 
           MIN(time) as first_date,
           MAX(time) as last_date,
           COUNT(*) as num_records
    FROM {table_name}
    GROUP BY symbol
    ORDER BY num_records DESC
    LIMIT 10;
    """
    
    summary_df = execute_query(query)
    logger.info(f"\nSummary of {table_name} data:")
    logger.info(f"\n{summary_df}")
    
    # Display sample data for top symbol
    if not summary_df.empty:
        top_symbol = summary_df.iloc[0]['symbol']
        
        query = f"""
        SELECT *
        FROM {table_name}
        WHERE symbol = '{top_symbol}'
        ORDER BY time DESC
        LIMIT 5;
        """
        
        sample_df = execute_query(query)
        logger.info(f"\nSample data for {top_symbol} from {table_name}:")
        logger.info(f"\n{sample_df}")
        
        # Display summary statistics
        query = f"""
        SELECT 
            symbol,
            COUNT(*) as data_points,
            MIN(close) as min_price,
            MAX(close) as max_price,
            AVG(close) as avg_price,
            STDDEV(close) as std_dev,
            SUM(volume) as total_volume
        FROM {table_name}
        WHERE symbol = '{top_symbol}'
        GROUP BY symbol;
        """
        
        stats_df = execute_query(query)
        logger.info(f"\nSummary statistics for {top_symbol}:")
        logger.info(f"\n{stats_df}")

def main():
    """Main function to fetch NSE500 ticker data and display samples."""
    logger.info("\nFetching 500 trading days of NSE500 ticker data and storing in TimescaleDB...\n")
    
    # Get Nifty 500 symbols
    symbols = get_nifty500_symbols()
    logger.info(f"Fetched {len(symbols)} symbols from Nifty 500")
    
    # Initialize KiteClient
    logger.info("Current working directory: " + os.getcwd())
    access_token_file_path = str(Path(os.getcwd()).parent / "kite_connect_app" / "access_token.txt")
    logger.info(f"Looking for access token file at: {access_token_file_path}")
    
    if os.path.exists(access_token_file_path):
        with open(access_token_file_path, "r") as f:
            access_token = f.read().strip()
            logger.info(f"Access token from file (first 5 chars): {access_token[:5]}...")
    else:
        logger.error(f"Access token file not found at {access_token_file_path}")
    
    # Initialize with custom path to access token file
    client = KiteClient(access_token_file=access_token_file_path)
    
    # Debug - Print API key and access token
    logger.info(f"API Key: {client.api_key}")
    logger.info(f"Access Token Set: {'Yes' if hasattr(client.kite, 'access_token') else 'No'}")
    logger.info(f"Access Token Value: {client.kite.access_token}")
    
    # Get instrument tokens
    token_map = get_instrument_tokens(client, symbols)
    
    # Store symbol metadata
    store_symbol_metadata(symbols)
    
    # Set date range for 500 trading days
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=500 * 1.4)  # Adding buffer for weekends/holidays
    
    # Fetch and store data for daily interval
    logger.info(f"Fetching daily data for past 500 trading days...")
    results, data_samples = fetch_historical_data(client, token_map, start_date, end_date, "day")
    
    # Display sample data directly from API response
    for symbol, samples in list(data_samples.items())[:5]:  # Show samples for first 5 symbols
        logger.info(f"\nSample data for {symbol} (from API):")
        for i, candle in enumerate(samples):
            logger.info(f"  {i+1}. Date: {candle['date']}, Open: {candle['open']}, High: {candle['high']}, "
                       f"Low: {candle['low']}, Close: {candle['close']}, Volume: {candle['volume']}")
    
    # Display sample data from TimescaleDB
    logger.info("\nFetching sample data from TimescaleDB...")
    display_sample_data("daily")
    
    logger.info("\nData fetch and storage completed!")

if __name__ == "__main__":
    main() 