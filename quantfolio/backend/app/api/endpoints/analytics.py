from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.api.endpoints.users import get_current_active_user, User
from app.api.endpoints.portfolio import get_portfolio_by_id
import random
import numpy as np

router = APIRouter()

# Mock market data (for demonstration)
def generate_historical_prices(symbol: str, days: int = 30):
    base_price = {
        "AAPL": 170.0,
        "MSFT": 280.0,
        "GOOGL": 2500.0,
        "AMZN": 3300.0,
        "TSLA": 750.0,
        "JNJ": 165.0,
        "PG": 145.0
    }.get(symbol, 100.0)
    
    # Generate slightly random daily prices
    np.random.seed(hash(symbol) % 2**32)
    daily_returns = np.random.normal(0.0005, 0.015, days)
    prices = [base_price]
    
    for ret in daily_returns:
        prices.append(prices[-1] * (1 + ret))
    
    # Return in chronological order (oldest first)
    date_today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    dates = [(date_today - timedelta(days=days-i)).strftime("%Y-%m-%d") for i in range(days+1)]
    
    return [{"date": dates[i], "price": round(prices[i], 2)} for i in range(days+1)]

# Generate random portfolio performance data
def generate_portfolio_performance(portfolio_id: int, days: int = 30):
    np.random.seed(portfolio_id)
    daily_returns = np.random.normal(0.0007, 0.012, days)
    value = 10000.0  # Starting value
    values = [value]
    
    for ret in daily_returns:
        values.append(values[-1] * (1 + ret))
    
    # Return in chronological order (oldest first)
    date_today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    dates = [(date_today - timedelta(days=days-i)).strftime("%Y-%m-%d") for i in range(days+1)]
    
    return [{"date": dates[i], "value": round(values[i], 2)} for i in range(days+1)]

# Generate random sector allocation for a portfolio
def generate_sector_allocation():
    sectors = {
        "Technology": 0.0,
        "Healthcare": 0.0,
        "Consumer Cyclical": 0.0,
        "Financial Services": 0.0,
        "Communication Services": 0.0,
        "Industrials": 0.0,
        "Consumer Defensive": 0.0,
        "Energy": 0.0,
        "Utilities": 0.0,
        "Real Estate": 0.0,
        "Basic Materials": 0.0
    }
    
    # Assign random weights that sum to 100%
    remaining = 100.0
    sector_list = list(sectors.keys())
    for i in range(len(sector_list) - 1):
        if remaining <= 0:
            break
        weight = round(min(random.uniform(0, remaining), 30.0), 1)  # Max 30% per sector
        sectors[sector_list[i]] = weight
        remaining -= weight
    
    # Assign remainder to last sector
    sectors[sector_list[-1]] = round(remaining, 1)
    
    # Convert to list format for easier frontend consumption
    return [{"sector": k, "allocation": v} for k, v in sectors.items() if v > 0]

# Generate risk metrics for a portfolio
def generate_risk_metrics(portfolio_id: int):
    np.random.seed(portfolio_id)
    return {
        "sharpe_ratio": round(np.random.uniform(0.8, 2.5), 2),
        "sortino_ratio": round(np.random.uniform(1.0, 3.0), 2),
        "max_drawdown": round(np.random.uniform(0.05, 0.25), 2),
        "volatility": round(np.random.uniform(0.08, 0.25), 2),
        "var_95": round(np.random.uniform(0.01, 0.05), 3),
        "beta": round(np.random.uniform(0.7, 1.3), 2),
        "alpha": round(np.random.uniform(-0.02, 0.05), 3),
        "r_squared": round(np.random.uniform(0.7, 0.95), 2),
        "tracking_error": round(np.random.uniform(0.02, 0.08), 3),
        "information_ratio": round(np.random.uniform(-0.5, 1.5), 2)
    }

# Generate asset correlation matrix
def generate_correlation_matrix(symbols: List[str]):
    n = len(symbols)
    np.random.seed(hash(",".join(symbols)) % 2**32)
    
    # Generate a random correlation matrix
    A = np.random.rand(n, n) * 2 - 1  # Random values between -1 and 1
    A = (A + A.T) / 2  # Make it symmetric
    np.fill_diagonal(A, 1)  # Diagonal elements are 1
    
    # Ensure it's positive definite and valid correlation matrix
    eigvals, eigvecs = np.linalg.eigh(A)
    eigvals = np.maximum(eigvals, 0)  # Ensure all eigenvalues are non-negative
    A = eigvecs @ np.diag(eigvals) @ eigvecs.T
    
    # Rescale to ensure diagonal is 1 and off-diagonal is between -1 and 1
    D = np.diag(1 / np.sqrt(np.diag(A)))
    A = D @ A @ D
    
    # Format for API response
    result = []
    for i in range(n):
        row = {"symbol": symbols[i], "correlations": {}}
        for j in range(n):
            row["correlations"][symbols[j]] = round(A[i, j], 2)
        result.append(row)
    
    return result

# Endpoints
@router.get("/market/{symbol}")
async def get_market_data(
    symbol: str,
    days: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be between 1 and 365"
        )
    
    return {
        "symbol": symbol,
        "data": generate_historical_prices(symbol, days)
    }

@router.get("/portfolio/{portfolio_id}/performance")
async def get_portfolio_performance(
    portfolio_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be between 1 and 365"
        )
    
    return {
        "portfolio_id": portfolio_id,
        "data": generate_portfolio_performance(portfolio_id, days)
    }

@router.get("/portfolio/{portfolio_id}/allocation")
async def get_portfolio_allocation(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Asset allocation
    assets = []
    total_value = portfolio["total_value"]
    for asset in portfolio["assets"]:
        asset_value = asset["quantity"] * asset["current_price"]
        assets.append({
            "symbol": asset["symbol"],
            "name": asset["name"],
            "value": asset_value,
            "percentage": round((asset_value / total_value) * 100, 2) if total_value > 0 else 0
        })
    
    # Sector allocation (mocked)
    sectors = generate_sector_allocation()
    
    return {
        "portfolio_id": portfolio_id,
        "assets": assets,
        "sectors": sectors
    }

@router.get("/portfolio/{portfolio_id}/risk")
async def get_portfolio_risk(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    metrics = generate_risk_metrics(portfolio_id)
    
    return {
        "portfolio_id": portfolio_id,
        "metrics": metrics
    }

@router.get("/portfolio/{portfolio_id}/correlation")
async def get_asset_correlation(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    if not portfolio["assets"]:
        return {
            "portfolio_id": portfolio_id,
            "correlation_matrix": []
        }
    
    symbols = [asset["symbol"] for asset in portfolio["assets"]]
    correlation_matrix = generate_correlation_matrix(symbols)
    
    return {
        "portfolio_id": portfolio_id,
        "correlation_matrix": correlation_matrix
    }

@router.get("/portfolio/{portfolio_id}/optimization")
async def get_portfolio_optimization(
    portfolio_id: int,
    risk_tolerance: float = 0.5,  # 0.0 to 1.0, where 1.0 is highest risk
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    if risk_tolerance < 0.0 or risk_tolerance > 1.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Risk tolerance must be between 0.0 and 1.0"
        )
    
    if not portfolio["assets"]:
        return {
            "portfolio_id": portfolio_id,
            "optimal_allocation": []
        }
    
    # In a real app, would run optimization algorithms
    # Here we simply generate plausible random weights
    np.random.seed(hash(str(portfolio_id) + str(risk_tolerance)) % 2**32)
    
    assets = []
    weights = np.random.dirichlet(np.ones(len(portfolio["assets"])) * (1 + (1 - risk_tolerance) * 10))
    
    for i, asset in enumerate(portfolio["assets"]):
        assets.append({
            "symbol": asset["symbol"],
            "name": asset["name"],
            "current_weight": round((asset["quantity"] * asset["current_price"] / portfolio["total_value"]) * 100, 2),
            "optimal_weight": round(weights[i] * 100, 2)
        })
    
    # Expected metrics for the optimized portfolio
    expected_return = 0.05 + risk_tolerance * 0.1
    expected_risk = 0.1 + risk_tolerance * 0.2
    
    return {
        "portfolio_id": portfolio_id,
        "risk_tolerance": risk_tolerance,
        "optimal_allocation": assets,
        "expected_metrics": {
            "annual_return": round(expected_return, 4),
            "annual_risk": round(expected_risk, 4),
            "sharpe_ratio": round(expected_return / expected_risk, 2)
        }
    } 