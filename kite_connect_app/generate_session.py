#!/usr/bin/env python
import logging
import os
from kiteconnect import KiteConnect
import json

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Initialize KiteConnect with your API key
kite = KiteConnect(api_key="c253hsmchp0j4jhz")

# Replace this with your request token from the redirect URL
request_token = "HFE37C8WOffPlq44f7bTyHq50rxuNHg0"  # Update this with your token
api_secret = "pslp3vm30gppz6xo4i6qnf97uqe8ri6w"

try:
    # Generate session and retrieve access token
    data = kite.generate_session(request_token, api_secret)
    
    # Set access token
    kite.set_access_token(data["access_token"])
    
    # Save the access token to a file for future use
    with open("access_token.txt", "w") as f:
        f.write(data["access_token"])
    
    print("\nAccess token generated and saved to access_token.txt")
    print(f"Access Token: {data['access_token']}")
    
    # Get profile
    profile = kite.profile()
    print("\nUser Profile:")
    print(json.dumps(profile, indent=2))
    
except Exception as e:
    print(f"Error: {e}")
    print("\nPossible causes:")
    print("1. Request token has expired (they are valid for only a few minutes)")
    print("2. API secret or request token is incorrect")
    print("3. Already generated a session using this request token")
    print("\nSolution: Run get_login_url.py again to get a fresh request token") 