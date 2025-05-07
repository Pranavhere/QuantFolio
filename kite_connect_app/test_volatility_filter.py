#!/usr/bin/env python
import sys
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add volatilitymodelling to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'volatilitymodelling'))

# Import the volume filter function
from volumeFilter import get_top_200_symbols

# Import the volatility filter function
from volatility_analysis import get_top50_volatility_symbols

def main():
    # Test volume filter
    logger.info("Testing volume filter - getting top 200 symbols with ADV15 values...")
    try:
        volume_result = get_top_200_symbols()
        volume_symbols = volume_result["symbols"]
        volume_adv15 = volume_result["adv15"]
        
        logger.info(f"Successfully retrieved {len(volume_symbols)} volume-filtered symbols")
        logger.info(f"First 5 volume symbols: {volume_symbols[:5]}")
        
        # Print some ADV15 values
        logger.info("Sample ADV15 values for volume-filtered symbols:")
        for symbol in volume_symbols[:5]:
            logger.info(f"{symbol}: {volume_adv15[symbol]:,.0f}")
            
    except Exception as e:
        logger.error(f"Error in volume filter: {e}")
        return False
    
    # Test volatility filter
    logger.info("Testing volatility filter - getting top 50 symbols with ADV15 values...")
    try:
        volatility_result = get_top50_volatility_symbols()
        volatility_symbols = volatility_result["symbols"]
        volatility_adv15 = volatility_result.get("adv15", {})
        
        logger.info(f"Successfully retrieved {len(volatility_symbols)} volatility-filtered symbols")
        logger.info(f"First 5 volatility symbols: {volatility_symbols[:5]}")
        
        # Print some ADV15 values if available
        if volatility_adv15:
            logger.info("Sample ADV15 values for volatility-filtered symbols:")
            for symbol in volatility_symbols[:5]:
                if symbol in volatility_adv15:
                    logger.info(f"{symbol}: {volatility_adv15[symbol]:,.0f}")
                
    except Exception as e:
        logger.error(f"Error in volatility filter: {e}")
        return False
    
    # Return both sets of results for comparison
    return volume_result, volatility_result

if __name__ == "__main__":
    logger.info("Starting test of volatility filter functions...")
    result = main()
    
    if result:
        volume_result, volatility_result = result
        
        # Extract symbols lists
        volume_symbols = volume_result["symbols"]
        volatility_symbols = volatility_result["symbols"]
        
        # Check how many volume symbols made it to the volatility filter
        common = set(volume_symbols) & set(volatility_symbols)
        logger.info(f"Number of volume symbols that made it to top volatility: {len(common)}")
        logger.info(f"First 5 common symbols: {list(common)[:5] if common else 'None'}")
        
        # Check if the ADV15 values were preserved correctly
        if "adv15" in volume_result and "adv15" in volatility_result:
            matching = True
            for symbol in list(common)[:5]:
                vol_adv15 = volume_result["adv15"].get(symbol)
                volat_adv15 = volatility_result["adv15"].get(symbol)
                
                if vol_adv15 != volat_adv15:
                    logger.warning(f"ADV15 mismatch for {symbol}: Volume: {vol_adv15}, Volatility: {volat_adv15}")
                    matching = False
                    
            if matching:
                logger.info("ADV15 values were correctly preserved in the pipeline")
        
        # Generate timestamp for report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        logger.info(f"Test completed successfully at {timestamp}")
    else:
        logger.error("Test failed") 