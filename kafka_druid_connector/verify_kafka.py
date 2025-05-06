#!/usr/bin/env python
"""
Simple script to verify Kafka connection and produce sample data
"""

import json
import time
import random
import datetime
from confluent_kafka import Producer

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = 'localhost:29092'
KAFKA_TOPIC = 'stock_market_data'

def generate_stock_data(num_records=20):
    """Generate sample stock market data."""
    data = []
    current_time = datetime.datetime.now()
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
    
    for i in range(num_records):
        timestamp = current_time - datetime.timedelta(minutes=i)
        symbol = random.choice(symbols)
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
    
    print(f"Producing {len(data)} messages to topic {topic}")
    
    for record in data:
        # Use symbol as key for partitioning
        key = record['symbol']
        value = json.dumps(record)
        
        try:
            producer.produce(topic, key=key, value=value)
            producer.poll(0)  # Non-blocking poll
            produced_messages += 1
            print(f"Produced message for {key}: {value[:30]}...")
        except Exception as e:
            print(f"Message delivery failed: {e}")
    
    # Make sure all messages are delivered
    producer.flush()
    print(f"All {produced_messages} messages produced successfully!")
    
    return produced_messages

def main():
    """Main function to verify Kafka connection."""
    print("\nStarting Kafka verification...\n")
    
    # Generate sample data
    print("Generating sample stock market data...")
    stock_data = generate_stock_data(20)
    print(f"Generated {len(stock_data)} records\n")
    
    # Produce data to Kafka
    print("Producing data to Kafka...")
    produce_to_kafka(stock_data)
    print("\nVerification completed!")

if __name__ == "__main__":
    main() 