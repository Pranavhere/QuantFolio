#!/usr/bin/env python
import pandas as pd
import subprocess
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5433'
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

def execute_sql(sql):
    """Execute a SQL statement that doesn't return results."""
    try:
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        result = subprocess.run(f"{psql_cmd} \"{sql}\"", shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Error executing SQL: {result.stderr}")
            return False
        return True
        
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return False

def fetch_stock_data(symbol, start_date, end_date=None):
    """
    Fetch stock data from TimescaleDB
    
    Parameters:
    - symbol: Stock symbol
    - start_date: Start date for data (YYYY-MM-DD)
    - end_date: End date for data (YYYY-MM-DD), defaults to current date if None
    
    Returns:
    - DataFrame with stock data
    """
    try:
        end_date_condition = f"AND time <= '{end_date}'" if end_date else ""
        
        query = f"""
        SELECT 
            time::date as date,
            symbol,
            open,
            high,
            low,
            close,
            volume
        FROM ticker_daily
        WHERE symbol = '{symbol}'
        AND time >= '{start_date}'
        {end_date_condition}
        ORDER BY time
        """
        
        df = execute_query(query)
        
        if df.empty:
            logger.warning(f"No data found for {symbol}")
            return pd.DataFrame()
            
        # Set date as index
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date')
            
        return df
        
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return pd.DataFrame()

def fetch_top200_volume_data(start_date, end_date=None):
    """
    Fetch data for stocks in the top200volume table
    
    Parameters:
    - start_date: Start date for data (YYYY-MM-DD)
    - end_date: End date for data (YYYY-MM-DD), defaults to current date if None
    
    Returns:
    - DataFrame with stock data for top200 by volume
    """
    try:
        end_date_condition = f"AND time <= '{end_date}'" if end_date else ""
        
        query = f"""
        SELECT DISTINCT symbol, rank, avg_value_to_mcap_ratio
        FROM top200volume
        ORDER BY rank
        """
        
        df = execute_query(query)
        
        if df.empty:
            logger.warning("No symbols found in top200volume table")
            return []
            
        return df['symbol'].unique().tolist(), df
        
    except Exception as e:
        logger.error(f"Error fetching top200volume data: {e}")
        return [], pd.DataFrame()

def create_volatility_models_table():
    """Create the volatility_models table if it doesn't exist."""
    sql = """
    CREATE TABLE IF NOT EXISTS volatility_models (
        symbol TEXT NOT NULL,
        calculation_date TIMESTAMPTZ NOT NULL,
        avg_return DOUBLE PRECISION,
        volatility DOUBLE PRECISION,
        historical_var_95 DOUBLE PRECISION,
        persistence DOUBLE PRECISION,
        forecast_volatility DOUBLE PRECISION,
        implied_volatility DOUBLE PRECISION,
        vol_ratio DOUBLE PRECISION,
        sharpe_ratio DOUBLE PRECISION,
        return_to_var_ratio DOUBLE PRECISION,
        risk_reward_score DOUBLE PRECISION,
        rank INTEGER,
        PRIMARY KEY (symbol, calculation_date)
    );
    
    -- Create index on rank
    CREATE INDEX IF NOT EXISTS idx_vol_models_rank ON volatility_models (rank);
    """
    
    if execute_sql(sql):
        logger.info("Successfully created/verified volatility_models table")
        return True
    else:
        logger.error("Failed to create volatility_models table")
        return False

def store_volatility_models(models_df):
    """
    Store volatility models data in TimescaleDB
    
    Parameters:
    - models_df: DataFrame with volatility model results
    
    Returns:
    - Number of records inserted
    """
    if models_df.empty:
        logger.warning("No data to store in volatility_models table")
        return 0
        
    # First, clear existing data in the table
    clear_sql = "TRUNCATE TABLE volatility_models;"
    execute_sql(clear_sql)
    
    # Prepare current timestamp
    now = pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Batch insert
    batch_size = 50
    all_values = []
    insert_count = 0
    
    for i, row in models_df.iterrows():
        # Handle missing values
        values = {}
        for col in models_df.columns:
            if col in row and pd.notna(row[col]):
                values[col] = row[col]
            else:
                values[col] = 'NULL'
        
        # Format values string
        value_str = f"('{values['symbol']}', '{now}', {values['avg_return']}, "
        value_str += f"{values['volatility']}, {values['historical_var_95']}, "
        value_str += f"{values['persistence']}, {values['forecast_volatility']}, "
        value_str += f"{values['implied_volatility']}, {values['vol_ratio']}, "
        value_str += f"{values['sharpe_ratio']}, {values['return_to_var_ratio']}, "
        value_str += f"{values['risk_reward_score']}, {i + 1})"
        
        all_values.append(value_str)
        
        # Insert in batches
        if len(all_values) >= batch_size:
            values_str = ", ".join(all_values)
            
            insert_sql = f"""
            INSERT INTO volatility_models 
            (symbol, calculation_date, avg_return, volatility, historical_var_95, 
             persistence, forecast_volatility, implied_volatility, vol_ratio, 
             sharpe_ratio, return_to_var_ratio, risk_reward_score, rank)
            VALUES {values_str}
            ON CONFLICT (symbol, calculation_date) DO UPDATE SET
            avg_return = EXCLUDED.avg_return,
            volatility = EXCLUDED.volatility,
            historical_var_95 = EXCLUDED.historical_var_95,
            persistence = EXCLUDED.persistence,
            forecast_volatility = EXCLUDED.forecast_volatility,
            implied_volatility = EXCLUDED.implied_volatility,
            vol_ratio = EXCLUDED.vol_ratio,
            sharpe_ratio = EXCLUDED.sharpe_ratio,
            return_to_var_ratio = EXCLUDED.return_to_var_ratio,
            risk_reward_score = EXCLUDED.risk_reward_score,
            rank = EXCLUDED.rank;
            """
            
            success = execute_sql(insert_sql)
            if success:
                insert_count += len(all_values)
            
            # Reset the batch
            all_values = []
    
    # Insert any remaining values
    if all_values:
        values_str = ", ".join(all_values)
        
        insert_sql = f"""
        INSERT INTO volatility_models 
        (symbol, calculation_date, avg_return, volatility, historical_var_95, 
         persistence, forecast_volatility, implied_volatility, vol_ratio, 
         sharpe_ratio, return_to_var_ratio, risk_reward_score, rank)
        VALUES {values_str}
        ON CONFLICT (symbol, calculation_date) DO UPDATE SET
        avg_return = EXCLUDED.avg_return,
        volatility = EXCLUDED.volatility,
        historical_var_95 = EXCLUDED.historical_var_95,
        persistence = EXCLUDED.persistence,
        forecast_volatility = EXCLUDED.forecast_volatility,
        implied_volatility = EXCLUDED.implied_volatility,
        vol_ratio = EXCLUDED.vol_ratio,
        sharpe_ratio = EXCLUDED.sharpe_ratio,
        return_to_var_ratio = EXCLUDED.return_to_var_ratio,
        risk_reward_score = EXCLUDED.risk_reward_score,
        rank = EXCLUDED.rank;
        """
        
        success = execute_sql(insert_sql)
        if success:
            insert_count += len(all_values)
    
    logger.info(f"Successfully stored {insert_count} records in volatility_models table")
    return insert_count 