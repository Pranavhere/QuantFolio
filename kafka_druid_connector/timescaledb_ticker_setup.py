#!/usr/bin/env python
"""
Set up TimescaleDB for storing stock ticker data with different time intervals
"""

import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5432'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

def setup_timescaledb_ticker_tables():
    """Set up TimescaleDB tables for storing ticker data at different intervals."""
    try:
        logger.info("Setting up TimescaleDB ticker data tables...")

        # Create tables for each time interval
        intervals = ['minutely', 'hourly', 'daily', 'weekly']
        
        for interval in intervals:
            # Create table
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS ticker_{interval} (
                time TIMESTAMPTZ NOT NULL,
                symbol TEXT NOT NULL,
                open DOUBLE PRECISION NOT NULL,
                high DOUBLE PRECISION NOT NULL,
                low DOUBLE PRECISION NOT NULL,
                close DOUBLE PRECISION NOT NULL,
                volume BIGINT NOT NULL,
                CONSTRAINT ticker_{interval}_pkey PRIMARY KEY (time, symbol)
            );
            """
            
            # Convert to hypertable
            hypertable_sql = f"""
            SELECT create_hypertable('ticker_{interval}', 'time', if_not_exists => TRUE);
            """
            
            # Create index on symbol for faster queries
            symbol_index_sql = f"""
            CREATE INDEX IF NOT EXISTS idx_{interval}_symbol ON ticker_{interval}(symbol);
            """
            
            # Time index is already created by the hypertable conversion,
            # so we don't need a separate index for time
            
            # Execute SQL commands using psql
            psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
            
            logger.info(f"Creating {interval} ticker table and indexes...")
            subprocess.run(f"{psql_cmd} \"{create_table_sql}\"", shell=True)
            subprocess.run(f"{psql_cmd} \"{hypertable_sql}\"", shell=True)
            subprocess.run(f"{psql_cmd} \"{symbol_index_sql}\"", shell=True)
        
        # Create a symbols table to store metadata about each symbol
        symbols_table_sql = """
        CREATE TABLE IF NOT EXISTS ticker_symbols (
            symbol TEXT PRIMARY KEY,
            company_name TEXT,
            sector TEXT,
            is_nifty50 BOOLEAN DEFAULT FALSE,
            is_nifty100 BOOLEAN DEFAULT FALSE,
            is_nifty500 BOOLEAN DEFAULT FALSE,
            last_updated TIMESTAMPTZ DEFAULT NOW()
        );
        """
        
        logger.info("Creating symbols metadata table...")
        subprocess.run(f"{psql_cmd} \"{symbols_table_sql}\"", shell=True)
        
        logger.info("TimescaleDB ticker tables setup completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error setting up TimescaleDB: {e}")
        return False

def main():
    """Main function to set up TimescaleDB for ticker data."""
    logger.info("\nSetting up TimescaleDB for NSE500 ticker data...\n")
    
    if setup_timescaledb_ticker_tables():
        logger.info("Successfully set up TimescaleDB for ticker data.")
        logger.info("Created tables:")
        logger.info("  - ticker_minutely - for 1-minute interval data")
        logger.info("  - ticker_hourly - for 1-hour interval data")
        logger.info("  - ticker_daily - for 1-day interval data")
        logger.info("  - ticker_weekly - for 1-week interval data")
        logger.info("  - ticker_symbols - for storing symbol metadata")
    else:
        logger.error("Failed to set up TimescaleDB ticker tables.")

if __name__ == "__main__":
    main() 