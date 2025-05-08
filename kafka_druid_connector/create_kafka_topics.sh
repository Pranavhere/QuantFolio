#!/bin/bash

# Create Kafka topics
echo "Creating Kafka topics..."

# Create nse-market-data topic
docker exec kafka kafka-topics --create --if-not-exists \
    --bootstrap-server kafka:29092 \
    --topic nse-market-data \
    --partitions 1 \
    --replication-factor 1

# Create technical-indicators topic
docker exec kafka kafka-topics --create --if-not-exists \
    --bootstrap-server kafka:29092 \
    --topic technical-indicators \
    --partitions 1 \
    --replication-factor 1

echo "Kafka topics created successfully!" 