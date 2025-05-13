import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

def load_csv_to_timescaledb(data_dir, db_params):
    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()
    csv_files = [f for f in os.listdir(data_dir) if f.endswith('.csv') and f != 'ticker_summary.csv']
    for csv_file in csv_files:
        symbol = csv_file.replace('.csv', '')
        print(f"Loading data for {symbol}")
        try:
            df = pd.read_csv(f"{data_dir}/{csv_file}")
            df['symbol'] = symbol
            required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
            if not all(col in df.columns for col in required_columns):
                print(f"Skipping {csv_file}: Missing required columns {required_columns}")
                continue
            records = df[['date', 'symbol', 'open', 'high', 'low', 'close', 'volume']].values.tolist()
            insert_query = """
                INSERT INTO nse500_data (date, symbol, open, high, low, close, volume)
                VALUES %s
                ON CONFLICT (date, symbol) DO NOTHING;
            """
            execute_values(cur, insert_query, records)
            conn.commit()
            print(f"Loaded {len(records)} records for {symbol}")
        except Exception as e:
            print(f"Error loading {csv_file}: {e}")
    cur.close()
    conn.close()
    print("All data loaded successfully.")

db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}

data_dir = "../kite_connect_app/nifty500_1day_ticker"
load_csv_to_timescaledb(data_dir, db_params)