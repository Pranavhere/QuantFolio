#!/usr/bin/env python
import json
import logging
from kite_client import KiteClient

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

def display_results(name, data):
    """Displays results in a formatted way"""
    print(f"\n{name}:")
    print(json.dumps(data, indent=2) if data else "No data available")
    print("-" * 50)

def main():
    """Main function to demonstrate KiteClient functionality"""
    print("Kite Connect API Demo")
    print("=====================")
    
    # Create client
    client = KiteClient()
    
    try:
        # Get profile
        try:
            profile = client.get_profile()
            display_results("User Profile", profile)
        except Exception as e:
            print(f"Error getting profile: {e}")
            print("You may need to generate a new session using generate_session.py")
            return
            
        # Get holdings
        try:
            holdings = client.get_holdings()
            display_results("Holdings", holdings)
        except Exception as e:
            print(f"Error getting holdings: {e}")
            
        # Get positions
        try:
            positions = client.get_positions()
            display_results("Positions", positions)
        except Exception as e:
            print(f"Error getting positions: {e}")
            
        # Get margins
        try:
            margins = client.get_margins()
            display_results("Margins", margins)
        except Exception as e:
            print(f"Error getting margins: {e}")
            
        # Get orders
        try:
            orders = client.get_orders()
            display_results("Orders", orders)
        except Exception as e:
            print(f"Error getting orders: {e}")
            
    except Exception as e:
        print(f"Error accessing Kite Connect API: {e}")
        print("You may need to generate a new session using generate_session.py")

if __name__ == "__main__":
    main() 