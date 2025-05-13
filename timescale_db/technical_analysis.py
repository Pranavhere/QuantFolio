#!/usr/bin/env python
"""
Technical Analysis Module for NSE500 Data
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from datetime import datetime, timedelta

# TimescaleDB Configuration
db_params = {
    'dbname': 'stock_data',
    'user': 'postgres',
    'password': 'password',
    'host': 'localhost',
    'port': '5433'
}
connection_string = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"

def fetch_symbol_data(symbol, days_back=90):
    """Fetch data for a symbol from TimescaleDB."""
    try:
        engine = create_engine(connection_string)
        query = """
        SELECT date, open, high, low, close, volume
        FROM nse500_data
        WHERE symbol = %s
        AND date >= %s
        ORDER BY date ASC;
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        df = pd.read_sql_query(query, engine, params=(symbol, start_date.strftime('%Y-%m-%d')))
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df = df.sort_index()
        engine.dispose()
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

def calculate_rsi(data, periods=14):
    """Calculate Relative Strength Index."""
    delta = data['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(data, slow=26, fast=12, signal=9):
    """Calculate MACD and Signal Line."""
    exp1 = data['close'].ewm(span=fast, adjust=False).mean()
    exp2 = data['close'].ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd, signal_line, macd - signal_line

def calculate_technical_indicators(symbol, days_back=90):
    """Calculate technical indicators for the given symbol."""
    try:
        df = fetch_symbol_data(symbol, days_back)
        if df.empty:
            print(f"No data for {symbol}")
            return []

        # Calculate indicators
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['rsi_14'] = calculate_rsi(df, 14)
        df['macd'], df['macd_signal'], df['macd_hist'] = calculate_macd(df)
        df['bollinger_upper'] = df['close'].rolling(window=20).mean() + 2 * df['close'].rolling(window=20).std()
        df['bollinger_lower'] = df['close'].rolling(window=20).mean() - 2 * df['close'].rolling(window=20).std()

        # Select indicators
        selected_indicators = [
            'close', 'volume', 'rsi_14', 'macd', 'macd_signal', 'macd_hist',
            'sma_20', 'sma_50', 'bollinger_upper', 'bollinger_lower'
        ]
        df_selected = df[selected_indicators].copy()
        df_selected = df_selected.reset_index()
        result = df_selected.to_dict('records')
        return result
    
    except Exception as e:
        print(f"Error calculating technical indicators: {e}")
        return []

def get_indicator_signals(symbol, days_back=90):
    """Generate trading signals based on technical indicators."""
    try:
        df = fetch_symbol_data(symbol, days_back)
        if df.empty:
            print(f"No data for {symbol}")
            return {}

        df['rsi_14'] = calculate_rsi(df, 14)
        df['macd'], df['macd_signal'], _ = calculate_macd(df)
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['bollinger_upper'] = df['close'].rolling(window=20).mean() + 2 * df['close'].rolling(window=20).std()
        df['bollinger_lower'] = df['close'].rolling(window=20).mean() - 2 * df['close'].rolling(window=20).std()

        signals = {
            'rsi': {
                'overbought': df['rsi_14'] > 70,
                'oversold': df['rsi_14'] < 30
            },
            'macd': {
                'bullish': df['macd'] > df['macd_signal'],
                'bearish': df['macd'] < df['macd_signal']
            },
            'ma': {
                'golden_cross': df['sma_20'] > df['sma_50'],
                'death_cross': df['sma_20'] < df['sma_50']
            },
            'bollinger': {
                'upper_break': df['close'] > df['bollinger_upper'],
                'lower_break': df['close'] < df['bollinger_lower']
            }
        }
        return signals
    
    except Exception as e:
        print(f"Error generating signals: {e}")
        return {}

def get_summary_signals(symbol, days_back=90):
    """Get a summary of all technical signals."""
    signals = get_indicator_signals(symbol, days_back)
    summary = {
        'timestamp': datetime.now().isoformat(),
        'symbol': symbol,
        'signals': {
            'trend': 'neutral',
            'strength': 'weak',
            'recommendation': 'hold'
        }
    }
    
    try:
        if not signals:
            return summary

        # Determine trend
        if signals['ma']['golden_cross'].iloc[-1]:
            summary['signals']['trend'] = 'bullish'
        elif signals['ma']['death_cross'].iloc[-1]:
            summary['signals']['trend'] = 'bearish'
        
        # Determine strength (simplified, no ADX)
        if signals['rsi']['overbought'].iloc[-1] or signals['rsi']['oversold'].iloc[-1]:
            summary['signals']['strength'] = 'strong'
        
        # Generate recommendation
        if signals['rsi']['oversold'].iloc[-1] and signals['bollinger']['lower_break'].iloc[-1]:
            summary['signals']['recommendation'] = 'buy'
        elif signals['rsi']['overbought'].iloc[-1] and signals['bollinger']['upper_break'].iloc[-1]:
            summary['signals']['recommendation'] = 'sell'
        
        return summary
    
    except Exception as e:
        print(f"Error generating summary: {e}")
        return summary

def main():
    """Main function to perform technical analysis."""
    symbols = ['TCS', 'TECHM', 'IDEA', 'YESBANK', 'SUZLON']  # Example symbols
    for symbol in symbols:
        print(f"\nAnalyzing {symbol}...")
        indicators = calculate_technical_indicators(symbol)
        if indicators:
            print(f"Indicators for {symbol} (last 5):")
            for record in indicators[-5:]:
                print(record)
        signals = get_summary_signals(symbol)
        print(f"Signals for {symbol}:")
        print(signals)

if __name__ == "__main__":
    main()