#!/usr/bin/env python
import logging
import os
import json
from kiteconnect import KiteConnect

class KiteClient:
    """
    A utility class to handle Kite Connect operations
    """
    
    def __init__(self, api_key="c253hsmchp0j4jhz", access_token_file="access_token.txt"):
        """
        Initialize KiteClient with API key and optional access token
        """
        self.api_key = api_key
        self.access_token_file = access_token_file
        self.kite = KiteConnect(api_key=self.api_key)
        
        # Set access token if available
        try:
            if os.path.exists(access_token_file):
                with open(access_token_file, "r") as f:
                    access_token = f.read().strip()
                    if access_token:
                        self.kite.set_access_token(access_token)
                        print(f"Access token loaded from {access_token_file}")
        except Exception as e:
            print(f"Error loading access token: {e}")
    
    def get_login_url(self):
        """
        Get the login URL for Kite Connect
        """
        return self.kite.login_url()
    
    def generate_session(self, request_token, api_secret):
        """
        Generate a session with request token and API secret
        """
        data = self.kite.generate_session(request_token, api_secret)
        self.kite.set_access_token(data["access_token"])
        
        # Save access token for future use
        with open(self.access_token_file, "w") as f:
            f.write(data["access_token"])
        
        return data
    
    def get_profile(self):
        """
        Get user profile information
        """
        return self.kite.profile()
    
    def get_holdings(self):
        """
        Get user holdings
        """
        return self.kite.holdings()
    
    def get_positions(self):
        """
        Get user positions
        """
        return self.kite.positions()
    
    def get_instruments(self, exchange=None):
        """
        Get instruments list
        """
        return self.kite.instruments(exchange=exchange)
    
    def get_margins(self):
        """
        Get user margins
        """
        return self.kite.margins()
    
    def get_orders(self):
        """
        Get order history
        """
        return self.kite.orders()

# Example usage
if __name__ == "__main__":
    # Enable debug logging
    logging.basicConfig(level=logging.DEBUG)
    
    # Create client
    client = KiteClient()
    
    try:
        # Get profile if access token is loaded
        profile = client.get_profile()
        print("\nUser Profile:")
        print(json.dumps(profile, indent=2))
    except Exception as e:
        print(f"Error accessing Kite Connect API: {e}")
        print("You may need to generate a new session using generate_session.py") 