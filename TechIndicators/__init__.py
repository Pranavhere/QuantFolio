"""
TechIndicators package for calculating various technical indicators for stock market data.
Each indicator is implemented in its own file and returns DataFrame with that indicator's column.
"""

# Import all indicators for easy importing
# Original indicators
from .ADV15 import calculate_adv15
from .BollingerBands import calculate_bollinger_bands
from .MACD import calculate_macd
from .RSI import calculate_rsi
from .MovingAverages import calculate_sma, calculate_ema
from .ATR import calculate_atr
from .OBV import calculate_obv
from .Stochastic import calculate_stochastic

# New indicators
from .AboveMA import calculate_above_ma
from .DirectionalMovement import calculate_adx
from .CandlePatterns import calculate_candle_patterns
from .NetMovement import calculate_net_movement, calculate_roi
from .RangeIndicators import calculate_range_indicators
from .RangeRatio import calculate_range_ratios
from .MultiRSI import calculate_multi_rsi
from .Separation import calculate_separation
from .MADelta import calculate_ma_delta
from .VolumeIndicators import calculate_volume_indicators
from .VolatilityIndicators import calculate_volatility_indicators

# Combined indicators
from .CombinedIndicators import calculate_all_indicators, get_all_indicator_columns

__all__ = [
    # Original indicators
    'calculate_adv15',
    'calculate_bollinger_bands',
    'calculate_macd',
    'calculate_rsi',
    'calculate_sma',
    'calculate_ema',
    'calculate_atr',
    'calculate_obv',
    'calculate_stochastic',
    
    # New indicators
    'calculate_above_ma',
    'calculate_adx',
    'calculate_candle_patterns',
    'calculate_net_movement',
    'calculate_roi',
    'calculate_range_indicators',
    'calculate_range_ratios',
    'calculate_multi_rsi',
    'calculate_separation',
    'calculate_ma_delta',
    'calculate_volume_indicators',
    'calculate_volatility_indicators',
    
    # Combined indicators
    'calculate_all_indicators',
    'get_all_indicator_columns'
] 