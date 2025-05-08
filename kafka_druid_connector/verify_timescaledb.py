#!/usr/bin/env python
"""
Simple script to verify TimescaleDB connection
"""

import os
import subprocess
import json
import random
import datetime
import time

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5433'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

def generate_stock_data(num_records=5):
    """Generate sample stock market data."""
    data = []
    current_time = datetime.datetime.now()
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
    
    for i in range(num_records):
        timestamp = current_time - datetime.timedelta(minutes=i)
        symbol = random.choice(symbols)
        price = round(random.uniform(100, 1000), 2)
        volume = int(random.uniform(1000, 10000))
        
        data.append({
            'timestamp': timestamp.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            'symbol': symbol,
            'price': price,
            'volume': volume,
            'exchange': random.choice(['NYSE', 'NASDAQ']),
            'change_percent': round(random.uniform(-5, 5), 2)
        })
    
    return data

def setup_timescaledb_via_psql():
    """Set up TimescaleDB tables for stock data using psql command."""
    try:
        print("Setting up TimescaleDB using psql...")

        # Create the table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS stock_market_data (
            time TIMESTAMPTZ NOT NULL,
            symbol TEXT NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            volume INTEGER NOT NULL,
            exchange TEXT NOT NULL,
            change_percent DOUBLE PRECISION
        );
        """
        
        # Convert to hypertable
        hypertable_sql = """
        SELECT create_hypertable('stock_market_data', 'time', if_not_exists => TRUE);
        """
        
        # Create index
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_market_data(symbol);
        """
        
        # Execute SQL commands using psql
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        
        subprocess.run(f"{psql_cmd} \"{create_table_sql}\"", shell=True)
        subprocess.run(f"{psql_cmd} \"{hypertable_sql}\"", shell=True)
        subprocess.run(f"{psql_cmd} \"{index_sql}\"", shell=True)
        
        print("TimescaleDB setup completed successfully")
        return True
    except Exception as e:
        print(f"Error setting up TimescaleDB: {e}")
        return False

def insert_sample_data_to_timescaledb(data):
    """Insert sample data into TimescaleDB using psql."""
    try:
        print(f"Inserting {len(data)} records into TimescaleDB...")
        
        for record in data:
            insert_sql = f"""
            INSERT INTO stock_market_data (time, symbol, price, volume, exchange, change_percent)
            VALUES (
                '{record['timestamp']}', 
                '{record['symbol']}', 
                {record['price']}, 
                {record['volume']}, 
                '{record['exchange']}', 
                {record['change_percent']}
            );
            """
            
            psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
            subprocess.run(f"{psql_cmd} \"{insert_sql}\"", shell=True)
        
        print("Sample data inserted successfully")
        return True
    except Exception as e:
        print(f"Error inserting data: {e}")
        return False

def query_timescaledb():
    """Query data from TimescaleDB using psql."""
    try:
        print("Querying data from TimescaleDB...")
        
        # Query to get all data
        query_sql = "SELECT * FROM stock_market_data LIMIT 10;"
        
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        subprocess.run(f"{psql_cmd} \"{query_sql}\"", shell=True)
        
        # Query to get average price by symbol
        avg_query = """
        SELECT 
            symbol, 
            time_bucket('1 hour', time) AS hour,
            AVG(price) AS avg_price,
            SUM(volume) AS total_volume
        FROM stock_market_data
        GROUP BY symbol, hour
        ORDER BY hour DESC, symbol
        LIMIT 10;
        """
        
        print("\nAverage price by symbol:")
        subprocess.run(f"{psql_cmd} \"{avg_query}\"", shell=True)
        
        return True
    except Exception as e:
        print(f"Error querying data: {e}")
        return False

def main():
    """Main function to test TimescaleDB connection."""
    print("\nTimescaleDB Connection Test\n")
    
    # Set up TimescaleDB
    if not setup_timescaledb_via_psql():
        print("Failed to set up TimescaleDB. Exiting.")
        return
    
    # Generate sample data
    stock_data = generate_stock_data(5)
    
    # Insert data into TimescaleDB
    if not insert_sample_data_to_timescaledb(stock_data):
        print("Failed to insert data. Exiting.")
        return
    
    # Query the data
    query_timescaledb()
    
    print("\nTest completed!")

if __name__ == "__main__":
    main() 