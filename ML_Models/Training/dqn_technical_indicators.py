#!/usr/bin/env python
import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
import time
import random
from collections import deque
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, LSTM, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import TensorBoard
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import joblib
import warnings

# Suppress warnings
warnings.filterwarnings('ignore', category=UserWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, parent_dir)

# Import our modules
from Portfolio.portfolio import Portfolio
from TechIndicators import CombinedIndicators

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)
random.seed(42)

# Constants
STOCK_SYMBOL = "ACE"  # Stock to analyze
DATA_DIR = "/Users/pranavlakhotia/cursor_Quant/kite_connect_app/nifty500_1day_ticker"
EPISODES = 50  # Number of episodes to train (reduced from 100 to speed up)
BATCH_SIZE = 64  # Batch size for training
GAMMA = 0.95  # Discount factor
EPSILON = 1.0  # Initial exploration rate
EPSILON_MIN = 0.01  # Minimum exploration rate
EPSILON_DECAY = 0.995  # Decay rate for exploration
LEARNING_RATE = 0.001  # Learning rate for the optimizer
LOOKBACK_WINDOW = 10  # Number of previous days to consider (reduced from 20 to speed up)

# DQN Agent class
class DQNAgent:
    def __init__(self, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.memory = deque(maxlen=2000)
        self.gamma = GAMMA  # discount rate
        self.epsilon = EPSILON  # exploration rate
        self.epsilon_min = EPSILON_MIN
        self.epsilon_decay = EPSILON_DECAY
        self.learning_rate = LEARNING_RATE
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()

    def _build_model(self):
        """
        Neural Network for Deep Q-learning Model
        """
        model = Sequential()
        model.add(Dense(64, input_dim=self.state_size, activation='relu'))
        model.add(BatchNormalization())
        model.add(Dropout(0.2))
        
        model.add(Dense(128, activation='relu'))
        model.add(BatchNormalization())
        model.add(Dropout(0.2))
        
        model.add(Dense(64, activation='relu'))
        model.add(BatchNormalization())
        model.add(Dropout(0.2))
        
        model.add(Dense(self.action_size, activation='linear'))
        
        model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))
        return model

    def update_target_model(self):
        """
        Copy weights from model to target_model
        """
        self.target_model.set_weights(self.model.get_weights())

    def remember(self, state, action, reward, next_state, done):
        """
        Store experience in memory
        """
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state, training=True):
        """
        Return action based on epsilon-greedy policy
        """
        if training and np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        
        act_values = self.model.predict(state, verbose=0)
        return np.argmax(act_values[0])

    def replay(self, batch_size):
        """
        Train the model with experiences from memory
        """
        if len(self.memory) < batch_size:
            return
            
        minibatch = random.sample(self.memory, batch_size)
        
        states = np.array([experience[0][0] for experience in minibatch])
        actions = np.array([experience[1] for experience in minibatch])
        rewards = np.array([experience[2] for experience in minibatch])
        next_states = np.array([experience[3][0] for experience in minibatch])
        dones = np.array([experience[4] for experience in minibatch])
        
        targets = self.model.predict(states, verbose=0)
        target_vals = self.target_model.predict(next_states, verbose=0)
        
        for i in range(batch_size):
            if dones[i]:
                targets[i][actions[i]] = rewards[i]
            else:
                targets[i][actions[i]] = rewards[i] + self.gamma * np.amax(target_vals[i])
        
        history = self.model.fit(states, targets, epochs=1, verbose=0)
        
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
            
        return history.history['loss'][0]

    def load(self, name):
        """
        Load model weights
        """
        self.model.load_weights(name)
        self.target_model.load_weights(name)

    def save(self, name):
        """
        Save model weights
        """
        self.model.save_weights(name)

# TradingEnvironment class
class TradingEnvironment:
    def __init__(self, df, initial_balance=100000, commission=0.001, lookback_window=10):
        """
        Initialize the trading environment
        
        Parameters:
        -----------
        df : pandas.DataFrame
            DataFrame with price data and indicators
        initial_balance : float, default 100000
            Initial portfolio balance
        commission : float, default 0.001 (0.1%)
            Commission rate per trade
        lookback_window : int, default 10
            Number of previous days to consider for state
        """
        self.df = df
        self.initial_balance = initial_balance
        self.commission = commission
        self.lookback_window = lookback_window
        
        # Portfolio management
        self.portfolio = Portfolio(initial_capital=initial_balance, commission=commission)
        
        # Environment state
        self.current_step = lookback_window  # Start after lookback window
        self.steps_left = len(df) - lookback_window - 1
        self.position = 0  # 0 = no position, 1 = long
        
        # Track episode data
        self.trades = []
        self.portfolio_values = []
        self.rewards = []
        
        # State normalization
        self.state_features = self._select_features()
        self.scaler = MinMaxScaler(feature_range=(-1, 1))
        self._fit_scalers()
    
    def _select_features(self):
        """
        Select features to use in the state representation - 
        Now dynamically selects from available columns rather than hardcoding
        """
        # Always include basic price and volume data
        basic_features = ['open', 'high', 'low', 'close', 'volume']
        basic_available = [f for f in basic_features if f in self.df.columns]
        
        # Get all indicator column names from our library
        all_indicator_cols = []
        try:
            all_indicator_cols = CombinedIndicators.get_all_indicator_columns()
        except Exception as e:
            print(f"Warning: Could not get indicator columns from CombinedIndicators: {e}")
            all_indicator_cols = []
        
        # Check which indicators are available in our DataFrame
        tech_indicators_available = [col for col in all_indicator_cols if col in self.df.columns]
        
        # Select a subset of indicators for performance if we have too many
        # This helps prevent the model from getting overwhelmed
        selected_indicators = tech_indicators_available
        if len(tech_indicators_available) > 30:
            # If too many indicators are available, select key ones from different categories
            important_indicators = [
                'rsi', 'macd_line', 'macd_signal', 'bollinger_upper', 'bollinger_lower',
                'sma_20', 'ema_9', 'atr', 'adx', 'stoch_k', 'stoch_d', 'obv',
                'abovema_20', 'volatility', 'rrover', 'sephigh'
            ]
            
            # Get available important indicators
            primary_available = [ind for ind in important_indicators if ind in tech_indicators_available]
            
            # If we don't have enough primary indicators, add more from available ones
            if len(primary_available) < 15 and len(tech_indicators_available) > 0:
                # Add more indicators to reach at least 15 (if available)
                remaining_needed = 15 - len(primary_available)
                remaining_indicators = [ind for ind in tech_indicators_available if ind not in primary_available]
                additional_indicators = remaining_indicators[:remaining_needed]
                selected_indicators = primary_available + additional_indicators
            else:
                selected_indicators = primary_available
        
        # Combine basic features with selected indicators
        all_features = basic_available + selected_indicators
        
        print(f"Selected {len(all_features)} features for the trading model:")
        print(", ".join(all_features))
        
        return all_features
    
    def _fit_scalers(self):
        """
        Fit the scalers on training data - with improved error handling
        """
        try:
            # Create a subset with selected features, handling any missing columns
            available_features = [f for f in self.state_features if f in self.df.columns]
            
            if len(available_features) == 0:
                raise ValueError("No features available for scaling")
                
            # Check for NaN values and handle them
            feature_df = self.df[available_features].copy()
            nan_counts = feature_df.isna().sum()
            
            if nan_counts.sum() > 0:
                print(f"Warning: Found {nan_counts.sum()} NaN values in features. Filling with 0.")
                feature_df = feature_df.fillna(0)
            
            # Fit the scaler
            self.scaler.fit(feature_df)
            print(f"Scaler fitted successfully on {len(available_features)} features")
            
            # Update state_features with only available features
            self.state_features = available_features
            
        except Exception as e:
            print(f"Error in fitting scaler: {e}")
            # Fall back to basic features if there's an error
            basic_features = ['close', 'volume']
            available_basic = [f for f in basic_features if f in self.df.columns]
            
            if len(available_basic) > 0:
                print(f"Falling back to basic features: {available_basic}")
                self.state_features = available_basic
                self.scaler.fit(self.df[available_basic])
            else:
                raise ValueError("Cannot initialize environment: no features available")
    
    def reset(self):
        """
        Reset the environment for a new episode
        
        Returns:
        --------
        numpy.ndarray
            Initial state
        """
        # Reset portfolio
        self.portfolio = Portfolio(initial_capital=self.initial_balance, commission=self.commission)
        
        # Reset environment state
        self.current_step = self.lookback_window
        self.steps_left = len(self.df) - self.lookback_window - 1
        self.position = 0
        
        # Reset tracking
        self.trades = []
        self.portfolio_values = []
        self.rewards = []
        
        # Return initial state
        return self._get_state()
    
    def _get_state(self):
        """
        Get current state representation
        
        Returns:
        --------
        numpy.ndarray
            Current state
        """
        try:
            # Get data window
            data_window = self.df[self.current_step-self.lookback_window:self.current_step+1]
            
            # Extract features and normalize
            features = data_window[self.state_features].values
            normalized_features = self.scaler.transform(features)
            
            # Flatten for dense network
            flattened_state = normalized_features.flatten()
            
            # Add position information
            state_with_position = np.append(flattened_state, self.position)
            
            # Reshape for model input
            return np.reshape(state_with_position, [1, len(state_with_position)])
            
        except Exception as e:
            print(f"Error getting state: {e}")
            # Return fallback state if there's an error
            fallback_size = len(self.state_features) * self.lookback_window + 1
            return np.zeros((1, fallback_size))
    
    def step(self, action):
        """
        Take a step in the environment
        
        Parameters:
        -----------
        action : int
            Action to take (0: hold, 1: buy, 2: sell)
        
        Returns:
        --------
        tuple
            (next_state, reward, done, info)
        """
        # Get current price data
        current_price = self.df.iloc[self.current_step]['close']
        timestamp = self.df.index[self.current_step]
        
        # Dictionary for price data update
        price_data = {STOCK_SYMBOL: current_price}
        
        # Execute action
        reward = 0
        info = {}
        
        # Calculate reward based on action
        if action == 0:  # Hold
            pass  # No action needed
        elif action == 1:  # Buy
            if self.position == 0:  # Only buy if we don't have a position
                # Calculate quantity to buy (simplified: use all cash)
                cash = self.portfolio.cash
                quantity = int(cash * 0.95 / current_price)  # Use 95% of cash
                
                if quantity > 0:
                    success = self.portfolio.buy(STOCK_SYMBOL, current_price, quantity, timestamp)
                    if success:
                        self.position = 1
                        self.trades.append({
                            'timestamp': timestamp,
                            'action': 'BUY',
                            'price': current_price,
                            'quantity': quantity
                        })
        elif action == 2:  # Sell
            if self.position == 1:  # Only sell if we have a position
                # Sell all shares
                quantity = self.portfolio.positions.get(STOCK_SYMBOL, 0)
                if quantity > 0:
                    success = self.portfolio.sell(STOCK_SYMBOL, current_price, quantity, timestamp)
                    if success:
                        self.position = 0
                        self.trades.append({
                            'timestamp': timestamp,
                            'action': 'SELL',
                            'price': current_price,
                            'quantity': quantity
                        })
        
        # Update portfolio value
        self.portfolio.update_portfolio_value(price_data, timestamp)
        
        # Track portfolio value
        portfolio_value = self.portfolio.get_portfolio_state()['portfolio_value']
        self.portfolio_values.append(portfolio_value)
        
        # Calculate reward (change in portfolio value)
        if len(self.portfolio_values) > 1:
            pct_change = (self.portfolio_values[-1] / self.portfolio_values[-2]) - 1
            reward = pct_change * 100  # Scale for better training
        
        # Store reward for tracking
        self.rewards.append(reward)
        
        # Move to next step
        self.current_step += 1
        self.steps_left -= 1
        
        # Check if episode is done
        done = self.steps_left <= 0
        
        # Get next state
        next_state = self._get_state()
        
        # Add info for debugging
        info = {
            'portfolio_value': portfolio_value,
            'position': self.position,
            'step': self.current_step,
            'timestamp': timestamp
        }
        
        return next_state, reward, done, info
    
    def render(self, mode='human'):
        """
        Render the environment (plotting results)
        """
        if not self.portfolio_values:
            print("No data to render")
            return
        
        # Calculate metrics
        metrics = self.portfolio.calculate_metrics()
        
        # Create a figure
        fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(12, 15), gridspec_kw={'height_ratios': [3, 1, 1]})
        
        # Plot portfolio value
        timestamps = self.df.index[self.lookback_window:self.current_step+1]
        
        ax1.plot(timestamps, self.portfolio_values, label='Portfolio Value')
        ax1.set_title(f"Trading Performance\nTotal Return: {metrics['total_return']:.2%}, Sharpe: {metrics['sharpe_ratio']:.2f}")
        ax1.set_ylabel('Portfolio Value ($)')
        ax1.grid(True)
        
        # Plot stock price
        price_data = self.df.iloc[self.lookback_window:self.current_step+1]['close']
        ax1_twin = ax1.twinx()
        ax1_twin.plot(timestamps, price_data, 'r--', alpha=0.6, label=f'{STOCK_SYMBOL} Price')
        ax1_twin.set_ylabel('Stock Price ($)', color='r')
        
        # Combine legends
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax1_twin.get_legend_handles_labels()
        ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
        
        # Plot buy/sell signals
        for trade in self.trades:
            if trade['action'] == 'BUY':
                ax1.scatter(trade['timestamp'], self.portfolio_values[timestamps.get_loc(trade['timestamp']) - self.lookback_window], 
                           marker='^', color='g', s=100, label='_nolegend_')
            else:  # SELL
                ax1.scatter(trade['timestamp'], self.portfolio_values[timestamps.get_loc(trade['timestamp']) - self.lookback_window], 
                           marker='v', color='r', s=100, label='_nolegend_')
        
        # Plot rewards
        ax2.bar(timestamps, self.rewards)
        ax2.set_ylabel('Reward')
        ax2.set_xlabel('Date')
        ax2.grid(True)
        
        # Plot selected indicators (if available)
        indicator_to_plot = None
        for indicator in ['rsi', 'macd_line', 'adx']:
            if indicator in self.df.columns:
                indicator_to_plot = indicator
                break
                
        if indicator_to_plot:
            indicator_data = self.df.iloc[self.lookback_window:self.current_step+1][indicator_to_plot]
            ax3.plot(timestamps, indicator_data, label=indicator_to_plot.upper())
            if indicator_to_plot == 'rsi':
                ax3.axhline(y=70, color='r', linestyle='--', alpha=0.3)
                ax3.axhline(y=30, color='g', linestyle='--', alpha=0.3)
            ax3.set_ylabel(indicator_to_plot.upper())
            ax3.set_xlabel('Date')
            ax3.grid(True)
            ax3.legend()
        
        plt.tight_layout()
        plt.show()
        
        # Print performance metrics
        print("\nPerformance Metrics:")
        print(f"Total Return: {metrics['total_return']:.2%}")
        print(f"Annualized Return: {metrics['annualized_return']:.2%}")
        print(f"Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
        print(f"Maximum Drawdown: {metrics['max_drawdown']:.2%}")
        print(f"Win Rate: {metrics['win_rate']:.2%}")
        print(f"Total Trades: {len(self.trades)}")

# Helper Functions
def load_stock_data(symbol):
    """
    Load stock price data and calculate technical indicators
    
    Parameters:
    -----------
    symbol : str
        Stock symbol to load
    
    Returns:
    --------
    pandas.DataFrame
        DataFrame with price data and technical indicators
    """
    file_path = os.path.join(DATA_DIR, f"{symbol}.csv")
    
    try:
        print(f"Loading data from: {file_path}")
        df = pd.read_csv(file_path)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df.sort_index(inplace=True)
        
        print(f"Calculating technical indicators for {symbol}...")
        # Calculate all technical indicators
        df_with_indicators = CombinedIndicators.calculate_all_indicators(df)
        
        # Check for NaN values
        nan_count = df_with_indicators.isna().sum().sum()
        if nan_count > 0:
            print(f"Warning: Found {nan_count} NaN values. Filling with zeros.")
            df_with_indicators = df_with_indicators.fillna(0)
        
        return df_with_indicators
    except Exception as e:
        print(f"Error loading data for {symbol}: {e}")
        return None

def train_dqn(env, agent, episodes=50, batch_size=64, save_path=None):
    """
    Train the DQN agent
    
    Parameters:
    -----------
    env : TradingEnvironment
        Trading environment
    agent : DQNAgent
        DQN agent
    episodes : int, default 50
        Number of episodes to train
    batch_size : int, default 64
        Batch size for replay
    save_path : str, default None
        Path to save model weights
    
    Returns:
    --------
    dict
        Training history
    """
    # Initialize training metrics
    episode_rewards = []
    portfolio_returns = []
    losses = []
    epsilons = []
    
    # For timing and progress estimation
    start_time = time.time()
    episode_times = []
    
    # Progress bar formatting
    bar_length = 30
    
    for episode in range(episodes):
        try:
            # Time the episode start
            episode_start = time.time()
            
            # Reset environment
            state = env.reset()
            total_reward = 0
            episode_loss = []
            
            # Step counter for this episode
            step = 0
            total_steps = env.steps_left
            
            # Progress tracking within the episode
            last_progress = 0
            
            while True:
                # Get action from agent
                action = agent.act(state)
                
                # Take action in environment
                next_state, reward, done, info = env.step(action)
                
                # Store experience in memory
                agent.remember(state, action, reward, next_state, done)
                
                # Move to next state
                state = next_state
                total_reward += reward
                step += 1
                
                # Show step progress every 20 steps
                current_progress = int((step / total_steps) * 100)
                if current_progress % 10 == 0 and current_progress != last_progress:
                    progress_bar = '█' * int(bar_length * step / total_steps) + '░' * (bar_length - int(bar_length * step / total_steps))
                    print(f"\rEpisode {episode+1}/{episodes} progress: |{progress_bar}| {current_progress}% - Step {step}/{total_steps}", end='')
                    last_progress = current_progress
                
                # Train network
                if len(agent.memory) >= batch_size:
                    loss = agent.replay(batch_size)
                    if loss is not None:
                        episode_loss.append(loss)
                
                if done:
                    # Update target model every episode
                    agent.update_target_model()
                    break
            
            # Save training metrics
            if episode_loss:
                avg_loss = np.mean(episode_loss)
                losses.append(avg_loss)
            else:
                losses.append(0)
            
            epsilons.append(agent.epsilon)
            episode_rewards.append(total_reward)
            
            # Calculate portfolio return for this episode
            metrics = env.portfolio.calculate_metrics()
            portfolio_returns.append(metrics['total_return'])
            
            # Calculate episode duration
            episode_end = time.time()
            episode_duration = episode_end - episode_start
            episode_times.append(episode_duration)
            
            # Calculate average episode time and estimate remaining time
            avg_time = np.mean(episode_times)
            remaining_episodes = episodes - (episode + 1)
            est_remaining_time = remaining_episodes * avg_time
            
            # Convert to hours, minutes, seconds
            est_hours = int(est_remaining_time // 3600)
            est_minutes = int((est_remaining_time % 3600) // 60)
            est_seconds = int(est_remaining_time % 60)
            
            # Print progress with time estimates
            print(f"\rEpisode: {episode+1}/{episodes} - Return: {metrics['total_return']:.2%} - Loss: {losses[-1]:.4f} - Epsilon: {agent.epsilon:.4f}")
            print(f"Episode duration: {episode_duration:.2f}s - Est. remaining time: {est_hours}h {est_minutes}m {est_seconds}s")
            
            # Save model periodically
            if save_path and (episode + 1) % 10 == 0:
                agent.save(f"{save_path}_ep{episode+1}.h5")
                print(f"Model saved at episode {episode+1}")
                
        except KeyboardInterrupt:
            print("\nTraining interrupted by user")
            break
        except Exception as e:
            print(f"Error in episode {episode+1}: {e}")
            continue
    
    # Final save
    if save_path:
        agent.save(f"{save_path}_final.h5")
        print("Final model saved")
    
    # Calculate total training time
    total_time = time.time() - start_time
    hours = int(total_time // 3600)
    minutes = int((total_time % 3600) // 60)
    seconds = int(total_time % 60)
    
    print(f"\nTraining completed in {hours}h {minutes}m {seconds}s")
    
    # Return training history
    return {
        'episode_rewards': episode_rewards,
        'portfolio_returns': portfolio_returns,
        'losses': losses,
        'epsilons': epsilons
    }

def plot_training_results(history):
    """
    Plot training results
    
    Parameters:
    -----------
    history : dict
        Training history
    """
    # Create figure with subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    
    # Plot episode rewards
    ax1.plot(history['episode_rewards'])
    ax1.set_title('Episode Rewards')
    ax1.set_xlabel('Episode')
    ax1.set_ylabel('Total Reward')
    ax1.grid(True)
    
    # Plot portfolio returns
    ax2.plot(history['portfolio_returns'])
    ax2.set_title('Portfolio Returns')
    ax2.set_xlabel('Episode')
    ax2.set_ylabel('Return (%)')
    ax2.grid(True)
    
    # Plot training loss
    ax3.plot(history['losses'])
    ax3.set_title('Training Loss')
    ax3.set_xlabel('Episode')
    ax3.set_ylabel('Loss')
    ax3.grid(True)
    
    # Plot epsilon
    ax4.plot(history['epsilons'])
    ax4.set_title('Exploration Rate (Epsilon)')
    ax4.set_xlabel('Episode')
    ax4.set_ylabel('Epsilon')
    ax4.grid(True)
    
    plt.tight_layout()
    plt.show()

def evaluate_agent(env, agent, render=True):
    """
    Evaluate the trained agent
    
    Parameters:
    -----------
    env : TradingEnvironment
        Trading environment
    agent : DQNAgent
        Trained DQN agent
    render : bool, default True
        Whether to render the results
    
    Returns:
    --------
    dict
        Evaluation metrics
    """
    # Reset environment
    state = env.reset()
    
    # Run until episode is done
    while True:
        # Get action from agent (no exploration)
        action = agent.act(state, training=False)
        
        # Take action in environment
        next_state, reward, done, info = env.step(action)
        
        # Move to next state
        state = next_state
        
        if done:
            break
    
    # Calculate final metrics
    metrics = env.portfolio.calculate_metrics()
    
    # Render results
    if render:
        env.render()
    
    return metrics

def main():
    """
    Main function to run DQN training and evaluation
    """
    print("Loading stock data...")
    df = load_stock_data(STOCK_SYMBOL)
    
    if df is None:
        print(f"Failed to load data for {STOCK_SYMBOL}")
        return
    
    print(f"Data loaded with shape: {df.shape}")
    
    # Print some info about available indicators
    indicator_cols = [col for col in df.columns if col not in ['open', 'high', 'low', 'close', 'volume']]
    print(f"Available indicators ({len(indicator_cols)} total): {', '.join(indicator_cols[:10])}...")
    
    # Print basic feature statistics
    print("\nBasic Feature Statistics:")
    print(df[['close', 'volume']].describe().T)
    
    # Create training environment
    env = TradingEnvironment(df, lookback_window=LOOKBACK_WINDOW)
    
    # Get state size from environment
    state = env.reset()
    state_size = state.shape[1]
    action_size = 3  # hold, buy, sell
    
    print(f"State size: {state_size}, Action size: {action_size}")
    
    # Create agent
    agent = DQNAgent(state_size, action_size)
    
    # Train agent
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, f"dqn_{STOCK_SYMBOL}")
    
    print(f"\nTraining DQN agent for {EPISODES} episodes...")
    try:
        history = train_dqn(env, agent, episodes=EPISODES, batch_size=BATCH_SIZE, save_path=model_path)
        
        # Plot training results
        plot_training_results(history)
        
        # Evaluate agent (with exploration turned off)
        print("\nEvaluating trained agent...")
        metrics = evaluate_agent(env, agent)
        
        print("\nEvaluation Metrics:")
        for key, value in metrics.items():
            if isinstance(value, float):
                print(f"{key}: {value:.4f}")
            else:
                print(f"{key}: {value}")
                
    except KeyboardInterrupt:
        print("\nProcess interrupted by user")
    except Exception as e:
        print(f"Error in main process: {e}")
    
    return agent, env, history

if __name__ == "__main__":
    print("Starting DQN trading model with technical indicators...")
    try:
        agent, env, history = main()
        print("Training and evaluation completed.")
    except Exception as e:
        print(f"Error running DQN model: {e}") 