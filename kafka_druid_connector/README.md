# Kafka-TimescaleDB Connector

This project demonstrates how to:
1. Generate real-time stock market data
2. Send the data to Apache Kafka
3. Consume and store the data in TimescaleDB (a PostgreSQL extension for time-series data)
4. Query historical stock data with specialized time-series functions
5. Visualize the time-series data with matplotlib

## Components

- **Apache Kafka**: High-throughput distributed messaging system
- **Apache ZooKeeper**: Coordination service required by Kafka
- **TimescaleDB**: PostgreSQL extension optimized for time-series data
- **Kafka Connect**: Framework for connecting Kafka with external systems

## Prerequisites

- Docker and Docker Compose
- Python 3.7+
- pip (Python package manager)
- PostgreSQL client (psql command-line tool)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd kafka_druid_connector  # (directory name unchanged for compatibility)
   ```

2. Install required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Start the Docker containers:
   ```
   docker-compose up -d
   ```

   This will start:
   - ZooKeeper on port 22181
   - Kafka on ports 29092 and 29093
   - TimescaleDB on port 5432
   - Kafka Connect on port 28083

4. Wait for all services to start (typically 1-2 minutes)

## Usage

### Test Kafka Only:

```
python verify_kafka.py
```

This will generate sample stock market data and send it to a Kafka topic.

### Test TimescaleDB Only:

```
python verify_timescaledb.py
```

This script will:
1. Set up the TimescaleDB table structure
2. Insert a few sample records
3. Run some sample queries to test functionality

### Run the full pipeline:

```
python kafka_to_timescaledb.py
```

This script will:
1. Generate stock market data
2. Send it to Kafka
3. Set up TimescaleDB for time-series data
4. Consume from Kafka and store in TimescaleDB
5. Run sample queries on the stored data

### Visualize the data:

```
python visualize_stock_data.py
```

This script will:
1. Connect to TimescaleDB and retrieve the stored stock data
2. Generate three visualizations:
   - Stock price over time for all symbols
   - Total trading volume by symbol
   - Hourly average price for each symbol
3. Save the visualizations as PNG files

## TimescaleDB Queries

The connector includes examples of time-series queries such as:

- Time-bucketing data into intervals
- Average price by symbol over time windows
- Latest stock prices by symbol
- Aggregating volume data

You can connect to TimescaleDB directly using any PostgreSQL client:

```
psql -h localhost -p 5432 -U postgres -d stock_data
```

Password: `password`

Sample query to get average price by hour for each symbol:

```sql
SELECT 
  symbol,
  time_bucket('1 hour', time) AS hour,
  AVG(price) AS avg_price,
  SUM(volume) AS total_volume
FROM stock_market_data
GROUP BY symbol, hour
ORDER BY hour DESC, symbol
LIMIT 10;
```

## Advantages of TimescaleDB for Stock Data

- **High ingestion rates**: Handles millions of data points per second
- **Optimized time-series queries**: Specialized functions for time-based analysis
- **SQL interface**: Use familiar SQL syntax with time-series extensions
- **Hypertables**: Automatic partitioning for time-series data
- **Continuous aggregates**: Pre-compute and incrementally update aggregations
- **Data retention policies**: Automatically drop or downsample old data
- **PostgreSQL compatibility**: Use with any PostgreSQL client or tool
- **ARM compatibility**: Works well on M1/M2 Macs (better than Apache Druid)
- **Lower resource usage**: Requires less memory and CPU than Apache Druid

## Troubleshooting

- If TimescaleDB fails to start, check the logs:
  ```
  docker logs timescaledb
  ```

- If Kafka Connect fails to connect to Kafka, ensure Kafka is healthy:
  ```
  docker logs kafka
  ```

- To verify Kafka topics:
  ```
  docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
  ```

- If you get PostgreSQL connection errors on macOS:
  1. Ensure you have the PostgreSQL client installed:
     ```
     brew install postgresql
     ```
  2. Verify you can connect to TimescaleDB:
     ```
     psql -h localhost -p 5432 -U postgres -d stock_data
     ```

## Script Details

- **kafka_to_timescaledb.py**: Full pipeline connecting Kafka to TimescaleDB
- **verify_kafka.py**: Test script for Kafka functionality only
- **verify_timescaledb.py**: Test script for TimescaleDB functionality only
- **visualize_stock_data.py**: Generates visualizations of the stored stock data
- **setup.sh**: Helper script to set up the environment
- **kafka_druid_connector.py**: Legacy connector for Druid (no longer used)
- **verify_druid.py**: Legacy script for Druid (no longer used) 