import psycopg2

def verify_data():
    try:
        # Connect to TimescaleDB
        conn = psycopg2.connect(
            dbname='stock_data',
            user='postgres',
            password='password',
            host='localhost',
            port='5433'
        )
        cur = conn.cursor()
        
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'nse500_data'
            );
        """)
        table_exists = cur.fetchone()[0]
        print(f"Table exists: {table_exists}")
        
        if table_exists:
            # Count total records
            cur.execute("SELECT COUNT(*) FROM nse500_data;")
            total_records = cur.fetchone()[0]
            print(f"Total records: {total_records}")
            
            # Count unique symbols
            cur.execute("SELECT COUNT(DISTINCT symbol) FROM nse500_data;")
            unique_symbols = cur.fetchone()[0]
            print(f"Unique symbols: {unique_symbols}")
            
            # Get date range
            cur.execute("""
                SELECT MIN(date), MAX(date) 
                FROM nse500_data;
            """)
            min_date, max_date = cur.fetchone()
            print(f"Date range: {min_date} to {max_date}")
            
            # Sample of data
            cur.execute("""
                SELECT symbol, date, close 
                FROM nse500_data 
                LIMIT 5;
            """)
            sample_data = cur.fetchall()
            print("\nSample data:")
            for row in sample_data:
                print(row)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_data() 