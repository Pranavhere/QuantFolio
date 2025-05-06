#!/usr/bin/env python
import os
import pandas as pd
import numpy as np
import logging
import glob
from datetime import datetime
import matplotlib.pyplot as plt
from garch_model import analyze_stocks_with_garch
from var_model import analyze_stocks_with_var

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"volatility_filter_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_available_symbols(data_dir):
    """Get list of available stock symbols from CSV files in the directory"""
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    symbols = [os.path.basename(f).replace('.csv', '') for f in csv_files]
    return symbols

def combine_metrics(garch_df, var_df):
    """Combine metrics from GARCH and VaR analyses"""
    if garch_df.empty or var_df.empty:
        logger.error("One or both analysis dataframes are empty")
        return pd.DataFrame()
    
    # Merge on symbol
    combined_df = pd.merge(garch_df, var_df, on='symbol', how='inner', suffixes=('_garch', '_var'))
    
    return combined_df

def calculate_risk_reward_score(df):
    """
    Calculate a risk/reward score for each stock
    Higher score means better risk-adjusted return potential
    """
    if df.empty:
        return df
    
    try:
        # Copy DataFrame to avoid modifying the original
        result_df = df.copy()
        
        # 1. Calculate Volatility Score (lower is better)
        # Normalize forecast volatility (lower is better)
        result_df['volatility_score'] = 1 - (result_df['forecast_volatility'] / result_df['forecast_volatility'].max())
        
        # 2. Calculate Return Score (higher is better)
        # Normalize average return (higher is better)
        result_df['return_score'] = (result_df['average_return'] - result_df['average_return'].min()) / \
                                  (result_df['average_return'].max() - result_df['average_return'].min())
        
        # 3. Calculate VaR Score (lower VaR is better)
        # Normalize historical VaR (lower is better)
        result_df['var_score'] = 1 - (result_df['historical_var_95'] / result_df['historical_var_95'].max())
        
        # 4. Calculate Sharpe-like scores
        # Already normalized by definition
        result_df['sharpe_score'] = result_df['sharpe_ratio'].clip(lower=0)  # Clip negative values to 0
        result_df['return_var_score'] = result_df['return_to_var_ratio'].clip(lower=0)  # Clip negative values to 0
        
        # 5. GARCH model stability (persistence closer to but less than 1 is better)
        result_df['stability_score'] = 1 - abs(0.9 - result_df['persistence'])  # 0.9 is considered optimal
        
        # Add more components for a comprehensive score
        
        # 6. Combined Risk/Reward Score (customize weights based on your strategy)
        # Higher score means better risk-adjusted return
        result_df['risk_reward_score'] = (
            0.25 * result_df['return_score'] +          # Reward component
            0.15 * result_df['volatility_score'] +      # Volatility component
            0.20 * result_df['var_score'] +             # VaR risk component
            0.20 * result_df['sharpe_score'] +          # Sharpe ratio component
            0.10 * result_df['return_var_score'] +      # Return/VaR ratio component
            0.10 * result_df['stability_score']         # GARCH stability component
        )
        
        # Sort by risk/reward score in descending order (higher is better)
        result_df = result_df.sort_values('risk_reward_score', ascending=False)
        
        return result_df
        
    except Exception as e:
        logger.error(f"Error calculating risk-reward score: {e}")
        return df

def filter_top_stocks(df, top_n=50):
    """Filter top N stocks by risk/reward score"""
    if df.empty or len(df) <= top_n:
        return df
    
    return df.head(top_n)

def plot_risk_reward(df, output_file='risk_reward_plot.png'):
    """Generate a risk vs reward scatter plot with the top stocks highlighted"""
    if df.empty:
        logger.warning("Cannot create plot: DataFrame is empty")
        return
    
    plt.figure(figsize=(12, 8))
    
    # Use historical volatility for X-axis (risk)
    x = df['volatility']
    # Use average return for Y-axis (reward)
    y = df['average_return']
    
    # Scatter plot with color based on risk/reward score
    scatter = plt.scatter(x, y, c=df['risk_reward_score'], cmap='viridis', 
                         alpha=0.7, s=50, edgecolors='k', linewidths=0.5)
    
    # Add colorbar
    cbar = plt.colorbar(scatter)
    cbar.set_label('Risk/Reward Score')
    
    # Highlight top 10 stocks
    top_10 = df.head(10)
    plt.scatter(top_10['volatility'], top_10['average_return'], 
               color='red', s=100, alpha=0.8, marker='*', label='Top 10')
    
    # Add labels for top 10 stocks
    for i, row in top_10.iterrows():
        plt.annotate(row['symbol'], 
                    (row['volatility'], row['average_return']),
                    xytext=(5, 5), textcoords='offset points',
                    fontsize=8, fontweight='bold')
    
    # Add labels and title
    plt.xlabel('Volatility (Risk)')
    plt.ylabel('Average Return (Reward)')
    plt.title('Risk vs Reward Analysis with Top Stocks Highlighted')
    plt.grid(True, alpha=0.3)
    plt.legend()
    
    # Save plot
    plt.tight_layout()
    plt.savefig(output_file)
    logger.info(f"Plot saved to {output_file}")
    
    plt.close()

def main():
    """Main function to run the stock filtering analysis"""
    # Directory containing stock price data
    data_dir = "../nifty500_1day_ticker"
    output_dir = "."
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Get list of available stock symbols
    symbols = get_available_symbols(data_dir)
    logger.info(f"Found {len(symbols)} stock symbols for analysis")
    
    # Run GARCH analysis (120 days lookback for GARCH is reasonable)
    logger.info("Running GARCH analysis...")
    garch_results = analyze_stocks_with_garch(symbols, data_dir, lookback_days=120)
    logger.info(f"GARCH analysis completed for {len(garch_results)} stocks")
    
    # Run VaR analysis (60 days for VaR is common)
    logger.info("Running VaR analysis...")
    var_results = analyze_stocks_with_var(symbols, data_dir, lookback_days=60)
    logger.info(f"VaR analysis completed for {len(var_results)} stocks")
    
    # Combine metrics
    logger.info("Combining metrics...")
    combined_results = combine_metrics(garch_results, var_results)
    logger.info(f"Combined metrics for {len(combined_results)} stocks")
    
    # Calculate risk/reward score
    logger.info("Calculating risk/reward scores...")
    scored_results = calculate_risk_reward_score(combined_results)
    
    # Filter top 50 stocks
    logger.info("Filtering top 50 stocks...")
    top_stocks = filter_top_stocks(scored_results, top_n=50)
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    full_results_file = os.path.join(output_dir, f"volatility_analysis_full_{timestamp}.csv")
    top_stocks_file = os.path.join(output_dir, f"top50_volatility_stocks_{timestamp}.csv")
    
    scored_results.to_csv(full_results_file, index=False)
    top_stocks.to_csv(top_stocks_file, index=False)
    
    logger.info(f"Full results saved to {full_results_file}")
    logger.info(f"Top 50 stocks saved to {top_stocks_file}")
    
    # Save just the list of top 50 symbols
    top_symbols_file = os.path.join(output_dir, f"top50_symbols_{timestamp}.txt")
    with open(top_symbols_file, 'w') as f:
        f.write('\n'.join(top_stocks['symbol'].tolist()))
    logger.info(f"Top 50 symbols list saved to {top_symbols_file}")
    
    # Generate visualization
    logger.info("Generating risk-reward visualization...")
    plot_file = os.path.join(output_dir, f"risk_reward_plot_{timestamp}.png")
    plot_risk_reward(top_stocks, output_file=plot_file)
    
    # Display top 10 stocks
    logger.info("\nTop 10 stocks by risk/reward score:")
    for i, (_, row) in enumerate(top_stocks.head(10).iterrows(), 1):
        logger.info(f"{i}. {row['symbol']} - Score: {row['risk_reward_score']:.4f}, "
                   f"Return: {row['average_return']:.4f}, Volatility: {row['volatility']:.4f}, "
                   f"VaR(95%): {row['historical_var_95']:.4f}")
    
    return top_stocks['symbol'].tolist()

if __name__ == "__main__":
    logger.info("Starting volatility-based stock filtering...")
    top_50_symbols = main()
    logger.info("Analysis completed.") 