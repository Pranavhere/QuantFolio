# Kite Connect Integration

This project demonstrates how to integrate with Zerodha's Kite Connect API in Python.

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Set up your Kite Connect app on [https://developers.kite.trade/](https://developers.kite.trade/)
   - The API key and secret are already configured in the code

## Usage

### Step 1: Get the Login URL

Run the following script to get the login URL:

```bash
python3 get_login_url.py
```

This will print a URL that you need to open in your browser. Login with your Zerodha credentials.

After successful login, you'll be redirected to a URL containing a `request_token` parameter. Copy this token.

### Step 2: Generate a Session

Update the `request_token` variable in `generate_session.py` with the token you copied.

```python
request_token = "YOUR_REQUEST_TOKEN_HERE"  # Update this line
```

Then run:

```bash
python3 generate_session.py
```

This will:
- Generate an access token
- Save it to `access_token.txt`
- Fetch and display your user profile

### Step 3: Use the Kite Client

Now you can use the `KiteClient` class for various Kite Connect operations:

```python
from kite_client import KiteClient

client = KiteClient()

# Get profile
profile = client.get_profile()
print(profile)

# Get holdings
holdings = client.get_holdings()
print(holdings)

# Get positions
positions = client.get_positions()
print(positions)
```

You can also run the kite_client.py directly to test your connection:

```bash
python3 kite_client.py
```

## Important Notes

- The request token is only valid for a few minutes
- Each request token can only be used once
- The access token is valid for one day (until 6 AM the next day)
- If your access token expires, you'll need to repeat the login process

## Available Methods

The `KiteClient` class provides the following methods:

- `get_login_url()` - Get the login URL
- `generate_session(request_token, api_secret)` - Generate a session
- `get_profile()` - Get user profile
- `get_holdings()` - Get user holdings
- `get_positions()` - Get user positions
- `get_instruments()` - Get instruments list
- `get_margins()` - Get user margins
- `get_orders()` - Get order history 