#!/usr/bin/env python
"""
Kafka to TimescaleDB Connector Script (Using Subprocess for PostgreSQL)

This script demonstrates how to:
1. Produce financial data to a Kafka topic
2. Consume data from Kafka and write to TimescaleDB using psql subprocess
3. Query the ingested data from TimescaleDB
"""

import json
import time
import random
import datetime
import logging
import subprocess
from confluent_kafka import Producer, Consumer, KafkaError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = 'localhost:29092'
KAFKA_TOPIC = 'stock_market_data'
KAFKA_GROUP_ID = 'stock_data_consumer'

# TimescaleDB Configuration
TIMESCALE_HOST = 'localhost'
TIMESCALE_PORT = '5432'
TIMESCALE_USER = 'postgres'
TIMESCALE_PASSWORD = 'password'
TIMESCALE_DB = 'stock_data'

# Sample data generation parameters
NUM_RECORDS = 100
SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'FB', 'NFLX', 'NVDA']

def generate_stock_data(num_records=100):
    """Generate sample stock market data."""
    data = []
    current_time = datetime.datetime.now()
    
    for i in range(num_records):
        timestamp = current_time - datetime.timedelta(minutes=i)
        symbol = random.choice(SYMBOLS)
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

def produce_to_kafka(data, topic=KAFKA_TOPIC):
    """Produce data to Kafka topic."""
    producer_conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'client.id': 'stock_market_producer'
    }
    
    producer = Producer(producer_conf)
    produced_messages = 0
    
    logger.info(f"Producing {len(data)} messages to topic {topic}")
    
    for record in data:
        # Use symbol as key for partitioning
        key = record['symbol']
        value = json.dumps(record)
        
        try:
            producer.produce(topic, key=key, value=value)
            producer.poll(0)  # Non-blocking poll
            produced_messages += 1
        except Exception as e:
            logger.error(f"Message delivery failed: {e}")
    
    # Make sure all messages are delivered
    producer.flush()
    logger.info("All messages produced successfully!")
    
    return produced_messages

def setup_timescaledb_via_psql():
    """Set up TimescaleDB tables for stock data using psql command."""
    try:
        logger.info("Setting up TimescaleDB using psql...")

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
        
        logger.info("TimescaleDB setup completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error setting up TimescaleDB: {e}")
        return False

def consume_from_kafka_and_store():
    """Consume data from Kafka and store in TimescaleDB using psql."""
    consumer_conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'group.id': KAFKA_GROUP_ID,
        'auto.offset.reset': 'earliest'
    }
    
    consumer = Consumer(consumer_conf)
    consumer.subscribe([KAFKA_TOPIC])
    
    logger.info(f"Consuming messages from topic {KAFKA_TOPIC}")
    
    try:
        # Read messages for a specified duration or count
        msg_count = 0
        start_time = time.time()
        
        while time.time() - start_time < 30:  # Run for 30 seconds
            msg = consumer.poll(1.0)
            
            if msg is None:
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    logger.info(f"Reached end of partition {msg.topic()}/{msg.partition()}")
                else:
                    logger.error(f"Error while consuming: {msg.error()}")
            else:
                try:
                    record = json.loads(msg.value())
                    
                    # Insert the record into TimescaleDB using psql
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
                    subprocess.run(f"{psql_cmd} \"{insert_sql}\"", shell=True, capture_output=True)
                    
                    msg_count += 1
                    if msg_count % 10 == 0:
                        logger.info(f"Stored {msg_count} messages in TimescaleDB")
                        
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
    
    except KeyboardInterrupt:
        pass
    
    finally:
        consumer.close()
        
    logger.info(f"Consumed and stored {msg_count} messages in TimescaleDB")
    return msg_count

def query_timescaledb():
    """Query data from TimescaleDB using psql."""
    try:
        logger.info("Querying data from TimescaleDB...")
        
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
        
        psql_cmd = f"PGPASSWORD={TIMESCALE_PASSWORD} psql -h {TIMESCALE_HOST} -p {TIMESCALE_PORT} -U {TIMESCALE_USER} -d {TIMESCALE_DB} -c"
        result = subprocess.run(f"{psql_cmd} \"{avg_query}\"", shell=True, capture_output=True, text=True)
        
        logger.info("Query results:")
        logger.info(result.stdout)
        
        # Query to get the latest price for each symbol
        latest_query = """
        SELECT DISTINCT ON (symbol)
            symbol,
            time,
            price,
            volume,
            exchange,
            change_percent
        FROM stock_market_data
        ORDER BY symbol, time DESC;
        """
        
        result = subprocess.run(f"{psql_cmd} \"{latest_query}\"", shell=True, capture_output=True, text=True)
        
        logger.info("\nLatest prices:")
        logger.info(result.stdout)
        
        return True
    except Exception as e:
        logger.error(f"Error querying TimescaleDB: {e}")
        return False

def main():
    """Main function to demonstrate Kafka to TimescaleDB connector."""
    logger.info("\nStarting Kafka to TimescaleDB connector demo...\n")
    
    # Step 1: Generate sample data
    logger.info("Step 1: Generating sample stock market data...")
    stock_data = generate_stock_data(NUM_RECORDS)
    logger.info(f"Generated {len(stock_data)} records\n")
    
    # Step 2: Produce data to Kafka
    logger.info("Step 2: Producing data to Kafka...")
    produce_to_kafka(stock_data)
    logger.info("\n")
    
    # Step 3: Set up TimescaleDB
    logger.info("Step 3: Setting up TimescaleDB...")
    if not setup_timescaledb_via_psql():
        logger.error("Failed to set up TimescaleDB. Exiting.")
        return
    
    # Step 4: Consume from Kafka and store in TimescaleDB
    logger.info("Step 4: Consuming data from Kafka and storing in TimescaleDB...")
    consume_from_kafka_and_store()
    
    # Step 5: Query the data
    logger.info("Step 5: Querying data from TimescaleDB...")
    query_timescaledb()
    
    logger.info("\nDemo completed!")

if __name__ == "__main__":
    main() 