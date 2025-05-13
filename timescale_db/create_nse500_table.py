import psycopg2
from psycopg2 import Error

def create_nse500_table(db_params):
    try:
        conn = psycopg2.connect(**db_params)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE nse500_data (
                date DATE NOT NULL,
                symbol VARCHAR(50) NOT NULL,
                open DOUBLE PRECISION,
                high DOUBLE PRECISION,
                low DOUBLE PRECISION,
                close DOUBLE PRECISION,
                volume BIGINT,
                PRIMARY KEY (date, symbol)
            );
        """)
        cur.execute("SELECT create_hypertable('nse500_data', 'date', chunk_time_interval => INTERVAL '1 month');")
        print("Table nse500_data created and converted to hypertable successfully.")
        cur.execute("""
            ALTER TABLE nse500_data SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'symbol',
                timescaledb.compress_orderby = 'date'
            );
            SELECT add_compression_policy('nse500_data', INTERVAL '1 month');
        """)
        print("Compression enabled for nse500_data.")
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

create_nse500_table(db_params)