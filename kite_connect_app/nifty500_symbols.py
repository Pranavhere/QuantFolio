#!/usr/bin/env python
import csv

def get_nifty500_symbols():
    # Load CSV file and extract symbols from 3rd column (index 2)
    csv_path = "/Users/pranavlakhotia/Downloads/ind_nifty500list.csv"
    symbols = []
    
    with open(csv_path, 'r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header row
        for row in reader:
            if len(row) > 2 and row[2]:  # Check if the 3rd column exists and is not empty
                symbols.append(row[2].strip().upper())
    
    # Return the list of symbols
    return symbols

if __name__ == "__main__":
    symbols = get_nifty500_symbols()
    print(symbols)
