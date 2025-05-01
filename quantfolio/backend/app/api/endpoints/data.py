from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.api.endpoints.users import get_current_active_user, User
import random
import numpy as np

router = APIRouter()

# Mock data
def get_stock_symbols():
    return {
        "AAPL": "Apple Inc.",
        "MSFT": "Microsoft Corporation",
        "AMZN": "Amazon.com Inc.",
        "GOOGL": "Alphabet Inc.",
        "TSLA": "Tesla Inc.",
        "NVDA": "NVIDIA Corporation",
        "JPM": "JPMorgan Chase & Co.",
        "JNJ": "Johnson & Johnson",
        "V": "Visa Inc.",
        "PG": "Procter & Gamble Co.",
        "HD": "Home Depot Inc.",
        "MA": "Mastercard Inc.",
        "DIS": "Walt Disney Co.",
        "NFLX": "Netflix Inc.",
        "PYPL": "PayPal Holdings Inc."
    }

def get_market_indices():
    return {
        "SPX": "S&P 500",
        "DJI": "Dow Jones Industrial Average",
        "IXIC": "NASDAQ Composite",
        "RUT": "Russell 2000",
        "VIX": "CBOE Volatility Index"
    }

def generate_news():
    news_items = [
        {
            "id": 1,
            "title": "Fed raises interest rates by 25 basis points",
            "source": "Financial Times",
            "url": "https://www.ft.com/",
            "published_at": datetime.now() - timedelta(hours=2),
            "summary": "The Federal Reserve has raised its benchmark interest rate by 25 basis points, continuing its battle against inflation.",
            "sentiment": 0.1  # Slightly positive
        },
        {
            "id": 2,
            "title": "Apple announces new iPhone lineup",
            "source": "TechCrunch",
            "url": "https://techcrunch.com/",
            "published_at": datetime.now() - timedelta(hours=5),
            "summary": "Apple unveiled its latest iPhone models with improved cameras and processors at its annual product event.",
            "sentiment": 0.8  # Very positive
        },
        {
            "id": 3,
            "title": "Oil prices drop amid recession fears",
            "source": "Reuters",
            "url": "https://www.reuters.com/",
            "published_at": datetime.now() - timedelta(hours=7),
            "summary": "Oil prices fell sharply as fears of a global economic slowdown intensified, potentially reducing demand.",
            "sentiment": -0.6  # Negative
        },
        {
            "id": 4,
            "title": "Microsoft reports strong cloud growth",
            "source": "Bloomberg",
            "url": "https://www.bloomberg.com/",
            "published_at": datetime.now() - timedelta(hours=10),
            "summary": "Microsoft reported better-than-expected quarterly results, driven by growth in its Azure cloud services.",
            "sentiment": 0.7  # Positive
        },
        {
            "id": 5,
            "title": "Tesla faces production challenges in China",
            "source": "Wall Street Journal",
            "url": "https://www.wsj.com/",
            "published_at": datetime.now() - timedelta(hours=12),
            "summary": "Tesla is experiencing production delays at its Shanghai factory due to supply chain constraints and regulatory issues.",
            "sentiment": -0.5  # Negative
        }
    ]
    return news_items

def generate_economic_indicators():
    return {
        "GDP_Growth": {
            "value": round(random.uniform(1.5, 4.0), 1),
            "previous": round(random.uniform(1.5, 4.0), 1),
            "unit": "%",
            "period": "Q2 2023"
        },
        "Unemployment_Rate": {
            "value": round(random.uniform(3.5, 5.0), 1),
            "previous": round(random.uniform(3.5, 5.0), 1),
            "unit": "%",
            "period": "July 2023"
        },
        "Inflation_Rate": {
            "value": round(random.uniform(2.0, 5.0), 1),
            "previous": round(random.uniform(2.0, 5.0), 1),
            "unit": "%",
            "period": "July 2023"
        },
        "Interest_Rate": {
            "value": round(random.uniform(3.0, 5.5), 2),
            "previous": round(random.uniform(3.0, 5.5), 2),
            "unit": "%",
            "period": "August 2023"
        },
        "Consumer_Confidence": {
            "value": round(random.uniform(80, 120), 1),
            "previous": round(random.uniform(80, 120), 1),
            "unit": "index",
            "period": "July 2023"
        }
    }

def generate_stock_info(symbol: str):
    symbols = get_stock_symbols()
    if symbol not in symbols:
        return None
    
    price = {
        "AAPL": 170.0,
        "MSFT": 280.0,
        "AMZN": 3300.0,
        "GOOGL": 2500.0,
        "TSLA": 750.0,
        "NVDA": 400.0,
        "JPM": 150.0,
        "JNJ": 165.0,
        "V": 230.0,
        "PG": 145.0,
        "HD": 320.0,
        "MA": 350.0,
        "DIS": 90.0,
        "NFLX": 400.0,
        "PYPL": 65.0
    }.get(symbol, 100.0)
    
    # Generate random metrics
    np.random.seed(hash(symbol) % 2**32)
    
    return {
        "symbol": symbol,
        "name": symbols[symbol],
        "price": price,
        "change": round(np.random.uniform(-10.0, 10.0), 2),
        "change_percent": round(np.random.uniform(-5.0, 5.0), 2),
        "market_cap": round(price * np.random.uniform(1e9, 2e12) / 1e9, 2),  # in billions
        "pe_ratio": round(np.random.uniform(10.0, 50.0), 2),
        "dividend_yield": round(np.random.uniform(0.0, 3.0), 2),
        "52w_high": round(price * (1 + np.random.uniform(0.05, 0.3)), 2),
        "52w_low": round(price * (1 - np.random.uniform(0.05, 0.3)), 2),
        "avg_volume": round(np.random.uniform(1e6, 5e7)),
        "sector": np.random.choice(["Technology", "Healthcare", "Consumer Cyclical", "Financial Services"]),
        "eps": round(price / np.random.uniform(10.0, 40.0), 2),
        "beta": round(np.random.uniform(0.5, 2.0), 2)
    }

# Endpoints
@router.get("/stocks")
async def get_stocks(current_user: User = Depends(get_current_active_user)):
    symbols = get_stock_symbols()
    return [{"symbol": symbol, "name": name} for symbol, name in symbols.items()]

@router.get("/stocks/{symbol}")
async def get_stock_details(symbol: str, current_user: User = Depends(get_current_active_user)):
    stock_info = generate_stock_info(symbol)
    if stock_info is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock with symbol {symbol} not found"
        )
    return stock_info

@router.get("/indices")
async def get_indices(current_user: User = Depends(get_current_active_user)):
    indices = get_market_indices()
    
    result = []
    for symbol, name in indices.items():
        np.random.seed(hash(symbol) % 2**32)
        price = round(np.random.uniform(1000, 40000), 2)
        result.append({
            "symbol": symbol,
            "name": name,
            "price": price,
            "change": round(np.random.uniform(-100.0, 100.0), 2),
            "change_percent": round(np.random.uniform(-3.0, 3.0), 2)
        })
    
    return result

@router.get("/news")
async def get_news(
    limit: int = Query(5, ge=1, le=20),
    symbol: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    news = generate_news()
    
    # Filter by symbol if provided (this is mocked)
    if symbol is not None:
        stock_symbols = get_stock_symbols()
        if symbol not in stock_symbols:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock with symbol {symbol} not found"
            )
        
        # Pretend to filter news by symbol
        np.random.seed(hash(symbol) % 2**32)
        news = np.random.choice(news, min(limit, len(news)), replace=False).tolist()
    
    # Limit the number of news items
    return news[:limit]

@router.get("/economic-indicators")
async def get_economic_indicators(current_user: User = Depends(get_current_active_user)):
    return generate_economic_indicators()

@router.get("/market-summary")
async def get_market_summary(current_user: User = Depends(get_current_active_user)):
    indices = get_market_indices()
    
    market_indices = []
    for symbol, name in indices.items():
        np.random.seed(hash(symbol) % 2**32)
        price = round(np.random.uniform(1000, 40000), 2)
        market_indices.append({
            "symbol": symbol,
            "name": name,
            "price": price,
            "change": round(np.random.uniform(-100.0, 100.0), 2),
            "change_percent": round(np.random.uniform(-3.0, 3.0), 2)
        })
    
    # Top gainers and losers
    stock_symbols = get_stock_symbols()
    np.random.seed(42)
    gainers = []
    losers = []
    
    for _ in range(5):
        symbol = np.random.choice(list(stock_symbols.keys()))
        gainers.append({
            "symbol": symbol,
            "name": stock_symbols[symbol],
            "price": round(np.random.uniform(50, 500), 2),
            "change_percent": round(np.random.uniform(2.0, 8.0), 2)
        })
    
    for _ in range(5):
        symbol = np.random.choice(list(stock_symbols.keys()))
        losers.append({
            "symbol": symbol,
            "name": stock_symbols[symbol],
            "price": round(np.random.uniform(50, 500), 2),
            "change_percent": round(np.random.uniform(-8.0, -2.0), 2)
        })
    
    # Recent news
    news = generate_news()[:3]
    
    return {
        "market_indices": market_indices,
        "top_gainers": gainers,
        "top_losers": losers,
        "recent_news": news,
        "trading_volume": {
            "value": round(np.random.uniform(5, 10), 1),
            "unit": "billion shares",
            "change_percent": round(np.random.uniform(-10, 10), 1)
        },
        "market_breadth": {
            "advancing": round(np.random.uniform(1000, 2000)),
            "declining": round(np.random.uniform(1000, 2000)),
            "unchanged": round(np.random.uniform(100, 300))
        },
        "timestamp": datetime.now()
    } 