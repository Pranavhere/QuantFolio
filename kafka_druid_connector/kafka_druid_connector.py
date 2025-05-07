#!/usr/bin/env python
"""
Kafka to Druid Connector Script

This script demonstrates how to:
1. Produce financial data to a Kafka topic
2. Set up a Druid ingestion spec to consume from Kafka
3. Query the ingested data from Druid

Dependencies:
- confluent-kafka
- requests
- pandas
- numpy
"""

import json
import time
import random
import datetime
import requests
import logging
from confluent_kafka import Producer, Consumer, KafkaError
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = 'localhost:29092'  # Using the external port
KAFKA_TOPIC = 'stock_market_data'
KAFKA_GROUP_ID = 'stock_data_consumer'

# Druid Configuration
DRUID_ROUTER_URL = 'http://localhost:28888'  # Using the modified router port
DRUID_COORDINATOR_URL = 'http://localhost:28081'  # Using the modified coordinator port
DRUID_DATASOURCE = 'stock_market_data'

# Sample data generation parameters
NUM_RECORDS = 200
SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'FB', 'NFLX', 'NVDA']

def generate_stock_data(num_records=200):
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

def check_druid_status():
    """Check if Druid services are available."""
    max_retries = 10
    retry_interval = 30  # seconds
    
    for i in range(max_retries):
        try:
            # Try to access router status endpoint instead of coordinator
            response = requests.get(f"{DRUID_ROUTER_URL}/status", timeout=5)
            if response.status_code == 200:
                logger.info("Druid router is healthy")
                # Parse response to extract version info
                status_data = response.json()
                logger.info(f"Druid version: {status_data.get('version', 'unknown')}")
                logger.info(f"Loaded modules: {len(status_data.get('modules', []))} modules")
                return True
        except Exception as e:
            logger.warning(f"Attempt {i+1}/{max_retries} - Druid not ready yet: {e}")
        
        if i < max_retries - 1:
            logger.info(f"Waiting {retry_interval} seconds before retry...")
            time.sleep(retry_interval)
    
    logger.error("Failed to connect to Druid after maximum retries")
    return False

def create_druid_ingestion_spec():
    """Create Druid ingestion spec for Kafka data."""
    spec = {
        "type": "kafka",
        "spec": {
            "ioConfig": {
                "type": "kafka",
                "consumerProperties": {
                    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS
                },
                "topic": KAFKA_TOPIC,
                "inputFormat": {
                    "type": "json"
                },
                "useEarliestOffset": True
            },
            "tuningConfig": {
                "type": "kafka"
            },
            "dataSchema": {
                "dataSource": DRUID_DATASOURCE,
                "granularitySpec": {
                    "type": "uniform",
                    "segmentGranularity": "HOUR",
                    "queryGranularity": "MINUTE"
                },
                "timestampSpec": {
                    "column": "timestamp",
                    "format": "iso"
                },
                "dimensionsSpec": {
                    "dimensions": [
                        "symbol",
                        "exchange"
                    ]
                },
                "metricsSpec": [
                    {
                        "type": "doubleSum",
                        "name": "price",
                        "field": "price"
                    },
                    {
                        "type": "longSum",
                        "name": "volume",
                        "field": "volume"
                    },
                    {
                        "type": "doubleSum",
                        "name": "change_percent",
                        "field": "change_percent"
                    }
                ]
            }
        }
    }
    return spec

def submit_druid_ingestion(spec):
    """Submit ingestion spec to Druid."""
    max_retries = 5
    retry_interval = 15  # seconds
    
    for i in range(max_retries):
        try:
            logger.info(f"Attempt {i+1}/{max_retries} - Submitting ingestion spec to Druid")
            response = requests.post(
                f"{DRUID_ROUTER_URL}/druid/indexer/v1/supervisor",
                json=spec,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"Error creating Druid ingestion: {e}")
            if i < max_retries - 1:
                logger.info(f"Waiting {retry_interval} seconds before retry...")
                time.sleep(retry_interval)
    
    logger.error("Failed to submit ingestion spec after maximum retries")
    return None

def query_druid_data():
    """Query data from Druid."""
    max_retries = 5
    retry_interval = 15  # seconds
    
    for i in range(max_retries):
        try:
            logger.info(f"Attempt {i+1}/{max_retries} - Querying data from Druid")
            response = requests.post(
                f"{DRUID_ROUTER_URL}/druid/v2/sql",
                json={"query": "SELECT symbol, exchange, SUM(volume) as volume, AVG(price) as avg_price FROM stock_market_data GROUP BY symbol, exchange"},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"Error querying Druid: {e}")
            if i < max_retries - 1:
                logger.info(f"Waiting {retry_interval} seconds before retry...")
                time.sleep(retry_interval)
    
    logger.error("Failed to query data after maximum retries")
    return None

def main():
    """Main function to demonstrate Kafka to Druid connector."""
    logger.info("\nStarting Kafka to Druid connector demo...\n")
    
    # Step 1: Generate sample data
    logger.info("Step 1: Generating sample stock market data...")
    stock_data = generate_stock_data(NUM_RECORDS)
    logger.info(f"Generated {len(stock_data)} records\n")
    
    # Step 2: Produce data to Kafka
    logger.info("Step 2: Producing data to Kafka...")
    produce_to_kafka(stock_data)
    logger.info("\n")
    
    # Step 3: Check if Druid is ready
    logger.info("Step 3: Checking if Druid services are ready...")
    if not check_druid_status():
        logger.error("Druid services are not available. Exiting.")
        return
    
    # Step 4: Create Druid ingestion
    logger.info("Step 4: Setting up Druid ingestion from Kafka...")
    ingestion_spec = create_druid_ingestion_spec()
    result = submit_druid_ingestion(ingestion_spec)
    if result:
        logger.info(f"Druid ingestion created successfully: {result}\n")
    
    # Step 5: Wait for data to be ingested
    wait_time = 60  # Increased wait time
    logger.info(f"Step 5: Waiting for data to be ingested into Druid ({wait_time} seconds)...")
    time.sleep(wait_time)  # Wait for data to be ingested
    logger.info("\n")
    
    # Step 6: Query the data
    logger.info("Step 6: Querying data from Druid...")
    query_result = query_druid_data()
    if query_result:
        logger.info("Query results:")
        for row in query_result:
            logger.info(row)
    
    logger.info("\nDemo completed!")

if __name__ == "__main__":
    main() 