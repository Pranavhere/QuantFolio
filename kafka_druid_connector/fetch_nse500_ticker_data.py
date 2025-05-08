#!/usr/bin/env python
"""
Fetch NSE500 ticker data using Kite Connect
"""

import os
import sys
import logging
import json
from datetime import datetime, timedelta
import pandas as pd
from confluent_kafka import Producer

# Add parent directory to path to import kite_client
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
from kite_connect_app.kite_client import KiteClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = 'localhost:29092'
KAFKA_TOPIC = 'nse-market-data'

def get_kafka_producer():
    """Create and return a Kafka producer."""
    producer_conf = {
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
        'client.id': 'nse_data_producer'
    }
    return Producer(producer_conf)

def fetch_nse_data(client, symbols, interval='1day', duration='1month'):
    """Fetch historical data for NSE symbols."""
    try:
        data = []
        for symbol in symbols:
            try:
                # Fetch historical data
                historical_data = client.kite.historical_data(
                    instrument_token=symbol['instrument_token'],
                    from_date=datetime.now() - timedelta(days=30),
                    to_date=datetime.now(),
                    interval=interval
                )
                
                # Process and format data
                for candle in historical_data:
                    data.append({
                        'timestamp': candle['date'].isoformat(),
                        'symbol': symbol['tradingsymbol'],
                        'price': candle['close'],
                        'volume': candle['volume'],
                        'exchange': 'NSE',
                        'change_percent': ((candle['close'] - candle['open']) / candle['open']) * 100
                    })
                
                logger.info(f"Fetched data for {symbol['tradingsymbol']}")
                
            except Exception as e:
                logger.error(f"Error fetching data for {symbol['tradingsymbol']}: {e}")
                continue
        
        return data
        
    except Exception as e:
        logger.error(f"Error in fetch_nse_data: {e}")
        return []

def produce_to_kafka(producer, data):
    """Produce data to Kafka topic."""
    try:
        for record in data:
            # Use symbol as key for partitioning
            key = record['symbol']
            value = json.dumps(record)
            
            producer.produce(
                KAFKA_TOPIC,
                key=key,
                value=value,
                callback=lambda err, msg: logger.error(f"Delivery failed: {err}") if err else None
            )
            producer.poll(0)  # Non-blocking poll
        
        # Make sure all messages are delivered
        producer.flush()
        logger.info(f"Produced {len(data)} messages to Kafka")
        
    except Exception as e:
        logger.error(f"Error producing to Kafka: {e}")

def main():
    """Main function to fetch and produce NSE data."""
    try:
        # Initialize Kite Connect client
    client = KiteClient()
    
        # Get NSE instruments
        instruments = client.get_instruments(exchange='NSE')
        nse_symbols = [i for i in instruments if i['segment'] == 'NSE']
    
        # Initialize Kafka producer
        producer = get_kafka_producer()
        
        # Fetch and produce data
        data = fetch_nse_data(client, nse_symbols)
        if data:
            produce_to_kafka(producer, data)
            logger.info("Successfully completed data fetch and production")
        else:
            logger.error("No data fetched")
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 