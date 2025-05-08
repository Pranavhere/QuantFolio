#!/usr/bin/env python
"""
Technical Analysis Module for Stock Data
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path to import TechIndicators
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from TechIndicators import CombinedIndicators

def prepare_dataframe(data):
    """Convert list of dictionaries to pandas DataFrame."""
    df = pd.DataFrame(data)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.set_index('timestamp')
    df = df.sort_index()
    return df

def calculate_technical_indicators(data):
    """Calculate technical indicators for the given data."""
    try:
        # Convert data to DataFrame
        df = prepare_dataframe(data)
        
        # Calculate all indicators
        df_with_indicators = CombinedIndicators.calculate_all_indicators(df)
        
        # Select important indicators
        selected_indicators = [
            'close', 'volume',
            'rsi_14', 'macd', 'macd_signal', 'macd_hist',
            'sma_20', 'sma_50', 'sma_200',
            'bollinger_upper', 'bollinger_lower',
            'atr', 'adx', 'diplus', 'diminus',
            'stoch_k', 'stoch_d'
        ]
        
        # Filter DataFrame to include only selected indicators
        df_selected = df_with_indicators[selected_indicators].copy()
        
        # Reset index to include timestamp as a column
        df_selected = df_selected.reset_index()
        
        # Convert to list of dictionaries
        result = df_selected.to_dict('records')
        
        return result
    
    except Exception as e:
        print(f"Error calculating technical indicators: {e}")
        return data

def get_indicator_signals(data):
    """Generate trading signals based on technical indicators."""
    try:
        df = prepare_dataframe(data)
        signals = {}
        
        # RSI signals
        signals['rsi'] = {
            'overbought': df['rsi_14'] > 70,
            'oversold': df['rsi_14'] < 30
        }
        
        # MACD signals
        signals['macd'] = {
            'bullish': df['macd'] > df['macd_signal'],
            'bearish': df['macd'] < df['macd_signal']
        }
        
        # Moving Average signals
        signals['ma'] = {
            'golden_cross': df['sma_20'] > df['sma_50'],
            'death_cross': df['sma_20'] < df['sma_50']
        }
        
        # Bollinger Bands signals
        signals['bollinger'] = {
            'upper_break': df['close'] > df['bollinger_upper'],
            'lower_break': df['close'] < df['bollinger_lower']
        }
        
        # ADX signals
        signals['adx'] = {
            'strong_trend': df['adx'] > 25,
            'trend_direction': df['diplus'] > df['diminus']
        }
        
        # Stochastic signals
        signals['stochastic'] = {
            'overbought': df['stoch_k'] > 80,
            'oversold': df['stoch_k'] < 20
        }
        
        return signals
    
    except Exception as e:
        print(f"Error generating signals: {e}")
        return {}

def get_summary_signals(data):
    """Get a summary of all technical signals."""
    signals = get_indicator_signals(data)
    summary = {
        'timestamp': datetime.now().isoformat(),
        'signals': {
            'trend': 'neutral',
            'strength': 'weak',
            'recommendation': 'hold'
        }
    }
    
    try:
        # Determine trend
        if signals['ma']['golden_cross'].iloc[-1]:
            summary['signals']['trend'] = 'bullish'
        elif signals['ma']['death_cross'].iloc[-1]:
            summary['signals']['trend'] = 'bearish'
        
        # Determine strength
        if signals['adx']['strong_trend'].iloc[-1]:
            summary['signals']['strength'] = 'strong'
        
        # Generate recommendation
        if (signals['rsi']['oversold'].iloc[-1] and 
            signals['stochastic']['oversold'].iloc[-1] and 
            signals['bollinger']['lower_break'].iloc[-1]):
            summary['signals']['recommendation'] = 'buy'
        elif (signals['rsi']['overbought'].iloc[-1] and 
              signals['stochastic']['overbought'].iloc[-1] and 
              signals['bollinger']['upper_break'].iloc[-1]):
            summary['signals']['recommendation'] = 'sell'
        
        return summary
    
    except Exception as e:
        print(f"Error generating summary: {e}")
        return summary 