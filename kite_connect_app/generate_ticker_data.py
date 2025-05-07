#!/usr/bin/env python
import datetime
import os
import json
import time
import pandas as pd
from kite_client import KiteClient
from nifty500_symbols import get_nifty500_symbols

def get_instrument_tokens(client, symbols):
    print(f"Fetching instrument tokens for {len(symbols)} symbols...")
    instruments = client.kite.instruments("NSE")
    
    # Create a dictionary mapping symbol to instrument token
    token_map = {}
    for instrument in instruments:
        if instrument["tradingsymbol"] in symbols:
            token_map[instrument["tradingsymbol"]] = instrument["instrument_token"]
    
    print(f"Found tokens for {len(token_map)} out of {len(symbols)} symbols")
    return token_map

def fetch_historical_data(client, token_map, from_date, to_date, interval="day"):
    data_dir = "nifty500_1day_ticker"
    os.makedirs(data_dir, exist_ok=True)
    
    print(f"Fetching historical data for {len(token_map)} symbols from {from_date} to {to_date}...")
    
    results = {}
    count = 0
    
    for symbol, token in token_map.items():
        try:
            print(f"Fetching data for {symbol} ({count+1}/{len(token_map)})")
            historical_data = client.kite.historical_data(
                token, 
                from_date, 
                to_date, 
                interval, 
                oi=False
            )
            
            # Process the data
            for candle in historical_data:
                # Convert timezone-aware datetime to naive datetime in local time
                if isinstance(candle["date"], datetime.datetime):
                    candle["date"] = candle["date"].astimezone(
                        datetime.timezone(datetime.timedelta(hours=5, minutes=30))  # IST
                    ).replace(tzinfo=None).strftime("%Y-%m-%d")
            
            # Convert to DataFrame and save as CSV
            df = pd.DataFrame(historical_data)
            df.to_csv(f"{data_dir}/{symbol}.csv", index=False)
            
            results[symbol] = historical_data
            count += 1
            
            # Sleep to avoid hitting rate limits
            if count % 10 == 0:
                time.sleep(1)
                
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
    
    print(f"Successfully fetched data for {count} symbols. Data saved to {data_dir}/ directory.")
    return results, data_dir

def main():
    # Get Nifty 500 symbols
    symbols = get_nifty500_symbols()
    print(f"Fetched {len(symbols)} symbols from Nifty 500")
    
    # Initialize KiteClient
    client = KiteClient()
    
    # Get instrument tokens
    token_map = get_instrument_tokens(client, symbols)
    
    # Set date range - historical data from past 500 days
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=500)
    
    # Fetch historical data
    results, data_dir = fetch_historical_data(client, token_map, start_date, end_date)
    
    # Create a summary file
    summary = []
    for symbol, data in results.items():
        if data:
            summary.append({
                "symbol": symbol,
                "days_of_data": len(data),
                "date_from": data[0]["date"] if data else None,
                "date_to": data[-1]["date"] if data else None,
                "avg_volume": sum(candle["volume"] for candle in data) / len(data) if data else 0,
                "avg_close": sum(candle["close"] for candle in data) / len(data) if data else 0
            })
    
    # Save summary as CSV
    summary_df = pd.DataFrame(summary)
    summary_df.sort_values("avg_volume", ascending=False, inplace=True)
    summary_df.to_csv(f"{data_dir}/ticker_summary.csv", index=False)
    
    print("Sample data for first symbol:")
    first_symbol = list(results.keys())[0] if results else None
    if first_symbol:
        print(f"Symbol: {first_symbol}")
        for candle in results[first_symbol][:5]:
            print(f"Date: {candle['date']}, Open: {candle['open']}, High: {candle['high']}, "
                  f"Low: {candle['low']}, Close: {candle['close']}, Volume: {candle['volume']}")

if __name__ == "__main__":
    main() 