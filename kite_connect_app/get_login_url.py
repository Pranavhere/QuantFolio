#!/usr/bin/env python
import logging
from kiteconnect import KiteConnect

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Initialize KiteConnect with your API key
kite = KiteConnect(api_key="c253hsmchp0j4jhz")

# Get the login URL
url = kite.login_url()
print("Login URL:", url)
print("\nInstructions:")
print("1. Open this URL in your browser")
print("2. Login with your Zerodha credentials")
print("3. You will be redirected to a URL containing request_token")
print("4. Copy the request_token from the URL and use it in generate_session.py") 