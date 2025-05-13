import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

def load_ticker_summary(data_dir, db_params):
    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()
    file_path = f"{data_dir}/ticker_summary.csv"
    try:
        df = pd.read_csv(file_path)
        required_columns = ['symbol', 'days_of_data', 'date_from', 'date_to', 'avg_volume', 'avg_close']
        if not all(col in df.columns for col in required_columns):
            print(f"Error: {file_path} is missing required columns {required_columns}")
            return
        records = df[['symbol', 'days_of_data', 'date_from', 'date_to', 'avg_volume', 'avg_close']].values.tolist()
        insert_query = """
            INSERT INTO ticker_summary (symbol, days_of_data, date_from, date_to, avg_volume, avg_close)
            VALUES %s
            ON CONFLICT (symbol) DO NOTHING;
        """
        execute_values(cur, insert_query, records)
        conn.commit()
        print(f"Loaded {len(records)} records into ticker_summary")
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
    finally:
        cur.close()
        conn.close()

db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}

data_dir = "../kite_connect_app/nifty500_1day_ticker"
load_ticker_summary(data_dir, db_params)