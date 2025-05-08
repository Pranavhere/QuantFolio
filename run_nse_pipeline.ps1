# Set environment variables
$env:KAFKA_BOOTSTRAP_SERVERS = "localhost:29092"
$env:TIMESCALE_URI = "postgres://postgres:password@localhost:5432/stock_data"
$env:KITE_API_KEY = "c253hsmchp0j4jhz"
$env:KITE_ACCESS_TOKEN = Get-Content -Path "access_token.txt" -Raw

# Run the NSE data fetcher
Write-Host "Starting NSE data fetcher..."
Start-Process python -ArgumentList "kafka_druid_connector/fetch_nse500_ticker_data.py" -NoNewWindow

# Run the technical analysis processor
Write-Host "Starting technical analysis processor..."
Start-Process python -ArgumentList "kafka_druid_connector/technical_analysis.py" -NoNewWindow

# Run the TimescaleDB writer
Write-Host "Starting TimescaleDB writer..."
Start-Process python -ArgumentList "kafka_druid_connector/kafka_timescaledb_connector.py" -NoNewWindow

# Run the visualization
Write-Host "Starting visualization..."
Start-Process python -ArgumentList "kafka_druid_connector/visualize_stock_data.py" -NoNewWindow

Write-Host "All processes started. Press Ctrl+C to stop."
while ($true) { Start-Sleep -Seconds 1 } 