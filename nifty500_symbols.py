#!/usr/bin/env python
import pandas as pd
from kite_client import KiteClient

# Initialize KiteClient
client = KiteClient()

# Load CSV file and extract symbols from 3rd column (index 2)
csv_path = "/Users/pranavlakhotia/Downloads/ind_nifty500list.csv"
csv_df = pd.read_csv(csv_path)
csv_symbols = csv_df.iloc[:, 2].dropna().astype(str).str.upper()

# Fetch instruments data from Kite API
instruments_data = client.kite.instruments("NSE")
kite_df = pd.DataFrame(instruments_data)
kite_symbols = kite_df['tradingsymbol'].astype(str).str.upper()

# Find intersection: symbols present in both CSV and Kite
common_symbols = csv_symbols[csv_symbols.isin(kite_symbols)].reset_index(drop=True)

# Find difference: symbols in CSV but not in Kite
missing_symbols = csv_symbols[~csv_symbols.isin(kite_symbols)].reset_index(drop=True)

# Convert to DataFrames
common_df = pd.DataFrame(common_symbols, columns=["Common Symbols"])
missing_df = pd.DataFrame(missing_symbols, columns=["Missing Symbols (in CSV but not in Kite)"])

# Display results
print("✅ Symbols found in both CSV and Kite:")
print(common_df)

print("\n❌ Symbols in CSV but NOT found in Kite:")
print(missing_df)

# Save to CSV files
common_df.to_csv("nifty500_common_symbols.csv", index=False)
missing_df.to_csv("nifty500_missing_symbols.csv", index=False)
print("\nResults saved to CSV files: nifty500_common_symbols.csv and nifty500_missing_symbols.csv") 