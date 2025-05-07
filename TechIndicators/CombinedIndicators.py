#!/usr/bin/env python
import pandas as pd
import numpy as np

# Import all technical indicator calculation functions
from . import AboveMA
from . import DirectionalMovement
from . import CandlePatterns
from . import NetMovement
from . import RangeIndicators
from . import RangeRatio
from . import MultiRSI
from . import Separation
from . import MADelta
from . import VolumeIndicators
from . import VolatilityIndicators

# Also import existing indicators for completeness
from . import ATR
from . import BollingerBands
from . import MACD
from . import MovingAverages
from . import OBV
from . import RSI
from . import Stochastic

def calculate_all_indicators(df):
    """
    Calculate all technical indicators
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing stock price data with 'open', 'high', 'low', 'close', 'volume' columns
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame with all technical indicators
    """
    # Start with a copy of the input data
    result = df.copy()
    
    # Calculate indicators in groups
    # Some indicators depend on others, so order matters
    
    # Basic price pattern indicators
    candle_patterns = CandlePatterns.calculate_candle_patterns(df)
    result = pd.concat([result, candle_patterns], axis=1)
    
    # Movement indicators
    net_movement = NetMovement.calculate_net_movement(df)
    result = pd.concat([result, net_movement], axis=1)
    
    # Range indicators
    range_indicators = RangeIndicators.calculate_range_indicators(df)
    result = pd.concat([result, range_indicators], axis=1)
    
    # Range ratios
    range_ratios = RangeRatio.calculate_range_ratios(df)
    result = pd.concat([result, range_ratios], axis=1)
    
    # Volume indicators
    volume_indicators = VolumeIndicators.calculate_volume_indicators(df)
    result = pd.concat([result, volume_indicators], axis=1)
    
    # ATR indicators (reuse the one we already have)
    atr = ATR.calculate_atr(df)
    result = pd.concat([result, atr], axis=1)
    
    # Volatility indicators
    volatility = VolatilityIndicators.calculate_volatility_indicators(df)
    result = pd.concat([result, volatility], axis=1)
    
    # Separation indicators (needs range ratios)
    separation = Separation.calculate_separation(result)  # Pass result because it needs rrover
    result = pd.concat([result, separation], axis=1)
    
    # MA-based indicators
    above_ma = AboveMA.calculate_above_ma(df)
    result = pd.concat([result, above_ma], axis=1)
    
    ma_delta = MADelta.calculate_ma_delta(df)
    result = pd.concat([result, ma_delta], axis=1)
    
    # RSI indicators
    multi_rsi = MultiRSI.calculate_multi_rsi(df)
    result = pd.concat([result, multi_rsi], axis=1)
    
    # Directional movement indicators
    adx = DirectionalMovement.calculate_adx(df)
    result = pd.concat([result, adx], axis=1)
    
    # ROI calculations
    roi = NetMovement.calculate_roi(df)
    result = pd.concat([result, roi], axis=1)
    
    # Update big move indicators which need multiple other indicators
    if all(x in result.columns for x in ['rrover', 'sephigh', 'netup', 'netdown']):
        # Convert to boolean type before using boolean operations
        rrover_bool = result['rrover'].astype(bool)
        sephigh_bool = result['sephigh'].astype(bool)
        netup_bool = result['netup'].astype(bool)
        netdown_bool = result['netdown'].astype(bool)
        
        result['bigup'] = (rrover_bool & sephigh_bool & netup_bool).astype(int)
        result['bigdown'] = (rrover_bool & sephigh_bool & netdown_bool).astype(int)
    
    return result

def get_all_indicator_columns():
    """
    Get a list of all indicator column names
    
    Returns:
    --------
    list
        List of all indicator column names
    """
    return [
        # From AboveMA
        'abovema_3', 'abovema_5', 'abovema_10', 'abovema_20', 'abovema_50',
        
        # From DirectionalMovement
        'adx', 'diplus', 'diminus',
        
        # From CandlePatterns
        'doji', 'inside', 'outside', 'hookdown', 'hookup',
        'hh', 'hl', 'ho', 'hc', 'lh', 'll', 'lo', 'lc',
        'gap', 'gapup', 'gapdown', 'gapbaup', 'gapbadown',
        'bigup', 'bigdown',
        
        # From NetMovement and ROI
        'net', 'netup', 'netdown',
        'roi', 'roi_2', 'roi_3', 'roi_4', 'roi_5', 'roi_10', 'roi_20',
        
        # From RangeIndicators
        'nr_3', 'nr_4', 'nr_5', 'nr_7', 'nr_8', 'nr_10', 'nr_18',
        'wr', 'wr_2', 'wr_3', 'wr_5', 'wr_6', 'wr_7', 'wr_10',
        
        # From RangeRatio
        'rr_1_4', 'rr_1_7', 'rr_1_10', 'rr_2_5', 'rr_2_7', 'rr_2_10',
        'rr_3_8', 'rr_3_14', 'rr_4_10', 'rr_4_20', 'rr_5_10', 'rr_5_20',
        'rr_5_30', 'rr_6_14', 'rr_6_25', 'rr_7_14', 'rr_7_35', 'rr_8_22',
        'rrover', 'rrunder', 'rrhigh', 'rrlow',
        
        # From MultiRSI
        'rsi', 'rsi_3', 'rsi_4', 'rsi_5', 'rsi_6', 'rsi_8', 'rsi_10', 'rsi_14',
        
        # From Separation
        'sep', 'rixc_1', 'rixo_1',
        'sep_3_3', 'sep_5_5', 'sep_8_8', 'sep_10_10', 'sep_14_14', 'sep_21_21', 'sep_30_30', 'sep_40_40',
        'sepdoji', 'sephigh', 'seplow', 'trend',
        
        # From MADelta
        'madelta', 'madelta_3', 'madelta_5', 'madelta_7', 'madelta_10',
        'madelta_12', 'madelta_15', 'madelta_18', 'madelta_20',
        
        # From VolumeIndicators
        'vma', 'vmratio', 'vmover', 'vmunder',
        
        # From VolatilityIndicators
        'volatility', 'volatility_3', 'volatility_5', 'volatility_20',
        
        # From ATR
        'atr',
        
        # From other modules
        'bollinger_upper', 'bollinger_middle', 'bollinger_lower',
        'macd_line', 'macd_signal', 'macd_histogram',
        'sma_20', 'sma_50', 'ema_9', 'ema_21',
        'obv', 'stoch_k', 'stoch_d'
    ] 