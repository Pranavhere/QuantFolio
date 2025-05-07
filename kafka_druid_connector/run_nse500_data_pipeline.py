#!/usr/bin/env python
"""
Run the entire NSE500 ticker data pipeline:
1. Set up TimescaleDB tables
2. Fetch NSE500 ticker data for different intervals
3. Analyze the data
"""

import subprocess
import logging
import time
import os
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("nse500_pipeline.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_script(script_name, description):
    """Run a Python script and log the output."""
    logger.info(f"Running {description}...")
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"Error running {script_name}: {result.stderr}")
            logger.error(f"Command output: {result.stdout}")
            return False
        
        # Log the script output
        for line in result.stdout.splitlines():
            if line.strip():
                logger.info(f"  {line.strip()}")
        
        logger.info(f"Successfully completed {description}")
        return True
        
    except Exception as e:
        logger.error(f"Exception running {script_name}: {e}")
        return False

def main():
    """Main function to run the entire NSE500 data pipeline."""
    logger.info("\nStarting NSE500 ticker data pipeline...\n")
    
    start_time = time.time()
    
    # Step 1: Set up TimescaleDB tables
    if not run_script("timescaledb_ticker_setup.py", "TimescaleDB setup"):
        logger.error("Failed to set up TimescaleDB tables. Exiting.")
        return
    
    # Step 2: Fetch NSE500 ticker data
    if not run_script("fetch_nse500_ticker_data.py", "NSE500 ticker data fetch"):
        logger.error("Failed to fetch NSE500 ticker data. Exiting.")
        return
    
    # Step 3: Analyze the data
    if not run_script("analyze_ticker_data.py", "Ticker data analysis"):
        logger.error("Failed to analyze ticker data.")
        # Continue even if analysis fails
    
    end_time = time.time()
    duration = end_time - start_time
    
    logger.info(f"\nNSE500 data pipeline completed in {duration:.2f} seconds ({duration/60:.2f} minutes).")
    logger.info("Output files and visualizations are saved in the current directory.")

if __name__ == "__main__":
    main() 