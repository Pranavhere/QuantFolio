import psycopg2
from psycopg2 import Error

def create_ticker_summary_table(db_params):
    try:
        conn = psycopg2.connect(**db_params)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE ticker_summary (
                symbol VARCHAR(50) PRIMARY KEY,
                days_of_data INTEGER,
                date_from DATE,
                date_to DATE,
                avg_volume DOUBLE PRECISION,
                avg_close DOUBLE PRECISION
            );
        """)
        print("Table ticker_summary created successfully.")
    except Error as e:
        print(f"Error: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}

create_ticker_summary_table(db_params)