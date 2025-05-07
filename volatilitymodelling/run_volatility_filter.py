#!/usr/bin/env python
import os
import sys
import logging
from datetime import datetime

# Import volatility analysis functions
from volatility_analysis import get_top50_volatility_symbols, main as run_volatility_analysis
from db_utils import create_volatility_models_table

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_database():
    """Setup database tables for volatility modeling"""
    logger.info("Setting up database tables for volatility modeling...")
    
    # Create volatility_models table
    if create_volatility_models_table():
        logger.info("Database setup completed successfully")
        return True
    else:
        logger.error("Database setup failed")
        return False

def run_volatility_filter():
    """Run the complete volatility filter pipeline"""
    start_time = datetime.now()
    logger.info(f"Starting volatility filter pipeline at {start_time}")
    
    # Setup database tables if needed
    setup_database()
    
    # Run volatility analysis
    try:
        result = run_volatility_analysis()
        
        if result and len(result) > 0:
            logger.info(f"Successfully identified top {len(result)} stocks with optimal volatility metrics")
        else:
            logger.warning("No stocks met the volatility filter criteria")
            
    except Exception as e:
        logger.error(f"Error running volatility filter: {e}")
        return False
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"Volatility filter pipeline completed in {duration:.2f} seconds")
    
    return True

if __name__ == "__main__":
    logger.info("Volatility Filter Runner - Starting pipeline")
    success = run_volatility_filter()
    
    if success:
        logger.info("Volatility Filter Runner - Pipeline completed successfully")
        sys.exit(0)
    else:
        logger.error("Volatility Filter Runner - Pipeline failed")
        sys.exit(1) 