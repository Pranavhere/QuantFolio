#!/usr/bin/env python
"""
Fetch NSE500 ticker data and store in TimescaleDB for different time intervals
"""

import datetime
import time
import logging
import subprocess
import sys
import os
import json
from pathlib import Path

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
            
            # Store data in TimescaleDB
            records_stored = store_ticker_data(symbol, interval, historical_data)
            stored_count += records_stored
            
            results[symbol] = len(historical_data)
            count += 1
            
            # Sleep to avoid hitting rate limits
            if count % 10 == 0:
                time.sleep(3)
                
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
    
    logger.info(f"Successfully fetched data for {count} symbols. Stored {stored_count} records in TimescaleDB.")
    return results

def fetch_and_store_all_intervals(symbols):
    """Fetch and store data for all time intervals."""
    # Initialize KiteClient
    client = KiteClient()
    
    # Get instrument tokens
    token_map = get_instrument_tokens(client, symbols)
    
    # Store symbol metadata
    store_symbol_metadata(symbols)
    
    # Set date ranges for different intervals
    end_date = datetime.datetime.now()
    
    # Define intervals and their date ranges
    intervals = [
        {
            "interval": "minute",
            "days_back": 7,  # Last 7 days for minute data
            "name": "minutely"
        },
        {
            "interval": "hour",
            "days_back": 60,  # Last 60 days for hourly data
            "name": "hourly"
        },
        {
            "interval": "day",
            "days_back": 365,  # Last 365 days for daily data
            "name": "daily"
        },
        {
            "interval": "week",
            "days_back": 500,  # Last 500 days for weekly data
            "name": "weekly"
        }
    ]
    
    # Fetch data for each interval
    for interval_config in intervals:
        interval = interval_config["interval"]
        days_back = interval_config["days_back"]
        name = interval_config["name"]
        
        logger.info(f"Processing {name} data (last {days_back} days)...")
        
        start_date = end_date - datetime.timedelta(days=days_back)
        
        # Fetch and store data
        results = fetch_historical_data(client, token_map, start_date, end_date, interval)
        
        logger.info(f"Completed {name} data. Processed {len(results)} symbols.")
        
        # Sleep between intervals to avoid rate limiting
        time.sleep(5)

def main():
    """Main function to fetch NSE500 ticker data and store in TimescaleDB."""
    logger.info("\nFetching and storing NSE500 ticker data in TimescaleDB...\n")
    
    # Get Nifty 500 symbols
    symbols = get_nifty500_symbols()
    logger.info(f"Fetched {len(symbols)} symbols from Nifty 500")
    
    # Fetch and store data for all intervals
    fetch_and_store_all_intervals(symbols)
    
    logger.info("\nData fetch and storage completed!")

if __name__ == "__main__":
    main() 