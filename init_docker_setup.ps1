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
