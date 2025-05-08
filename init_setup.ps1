# Stop any existing containers and remove volumes
Write-Host "Cleaning up existing containers..."
cd kafka_druid_connector
docker-compose down -v

# Create necessary directories
Write-Host "Creating necessary directories..."
New-Item -ItemType Directory -Force -Path "zookeeper-data"
New-Item -ItemType Directory -Force -Path "zookeeper-logs"
New-Item -ItemType Directory -Force -Path "kafka-data"
New-Item -ItemType Directory -Force -Path "connectors"

# Start services in order
Write-Host "Starting Zookeeper..."
docker-compose up -d zookeeper
Start-Sleep -Seconds 10

Write-Host "Starting Kafka..."
docker-compose up -d kafka
Start-Sleep -Seconds 30

Write-Host "Starting TimescaleDB..."
docker-compose up -d timescaledb
Start-Sleep -Seconds 10

Write-Host "Starting Kafka Connect..."
docker-compose up -d kafka-connect
Start-Sleep -Seconds 10

# Initialize TimescaleDB
Write-Host "Initializing TimescaleDB..."
Get-Content .\init_timescaledb.sql | docker exec -i timescaledb psql -U postgres -d stock_data

# Create Kafka topics
Write-Host "Creating Kafka topics..."
docker exec kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic nse-market-data --partitions 1 --replication-factor 1
docker exec kafka kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic technical-indicators --partitions 1 --replication-factor 1

# Verify setup
Write-Host "Verifying setup..."
Write-Host "`nKafka Topics:"
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

Write-Host "`nTimescaleDB Tables:"
docker exec timescaledb psql -U postgres -d stock_data -c "\dt"

Write-Host "`nSetup complete! You can now run the NSE data pipeline."
cd .. 