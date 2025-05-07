#!/bin/bash

# Script to set up Kafka-TimescaleDB connector

echo "Setting up Kafka-TimescaleDB connector..."

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down -v

# Start containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start (this may take a minute)..."
sleep 30

# Check if services are running
echo "Checking if services are running..."
docker-compose ps

# Create test topic
echo "Creating test topic..."
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test_topic --partitions 1 --replication-factor 1 || true

echo "Setup complete! You can now run the connector script:"
echo "python kafka_timescaledb_connector.py"

echo "Or test the Kafka connection only:"
echo "python verify_kafka.py"

echo "To access TimescaleDB:"
echo "psql -h localhost -p 5432 -U postgres -d stock_data"
echo "Password: password" 