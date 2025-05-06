"""
Volatility Modelling Package

This package provides tools for analyzing stock volatility using GARCH and Value at Risk models.
It can be used to filter stocks based on their risk/reward profiles.

Main modules:
- garch_model: GARCH volatility modeling
- var_model: Value at Risk (VaR) modeling
- filter_stocks: Stock filtering based on risk/reward metrics
"""

from .garch_model import analyze_stocks_with_garch, calculate_garch_metrics
from .var_model import analyze_stocks_with_var, calculate_var_metrics
from .filter_stocks import main as filter_top_stocks

__all__ = [
    'analyze_stocks_with_garch',
    'calculate_garch_metrics',
    'analyze_stocks_with_var',
    'calculate_var_metrics',
    'filter_top_stocks'
] 