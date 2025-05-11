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