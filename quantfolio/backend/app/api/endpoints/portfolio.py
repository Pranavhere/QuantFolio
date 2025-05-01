from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.endpoints.users import get_current_active_user, User

router = APIRouter()

# Models
class Asset(BaseModel):
    symbol: str
    name: str
    quantity: float
    purchase_price: float
    current_price: float

class Portfolio(BaseModel):
    id: int
    user_id: str
    name: str
    description: Optional[str] = None
    creation_date: datetime
    last_updated: datetime
    assets: List[Asset] = []
    total_value: float
    performance_1d: float
    performance_1w: float
    performance_1m: float
    performance_ytd: float

class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Mock data
mock_portfolios = [
    {
        "id": 1,
        "user_id": "user@example.com",
        "name": "Growth Portfolio",
        "description": "High growth technology stocks",
        "creation_date": datetime(2023, 1, 1),
        "last_updated": datetime(2023, 5, 1),
        "assets": [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "quantity": 10,
                "purchase_price": 150.0,
                "current_price": 170.0
            },
            {
                "symbol": "MSFT",
                "name": "Microsoft Corporation",
                "quantity": 5,
                "purchase_price": 250.0,
                "current_price": 280.0
            }
        ],
        "total_value": 3100.0,
        "performance_1d": 0.5,
        "performance_1w": 2.3,
        "performance_1m": 5.7,
        "performance_ytd": 12.4
    },
    {
        "id": 2,
        "user_id": "user@example.com",
        "name": "Dividend Portfolio",
        "description": "Income generating stocks",
        "creation_date": datetime(2023, 2, 15),
        "last_updated": datetime(2023, 5, 1),
        "assets": [
            {
                "symbol": "JNJ",
                "name": "Johnson & Johnson",
                "quantity": 8,
                "purchase_price": 160.0,
                "current_price": 165.0
            },
            {
                "symbol": "PG",
                "name": "Procter & Gamble",
                "quantity": 12,
                "purchase_price": 140.0,
                "current_price": 145.0
            }
        ],
        "total_value": 3060.0,
        "performance_1d": 0.2,
        "performance_1w": 1.1,
        "performance_1m": 2.9,
        "performance_ytd": 7.2
    }
]

# Helper functions
def get_portfolio_by_id(portfolio_id: int, user_email: str):
    for portfolio in mock_portfolios:
        if portfolio["id"] == portfolio_id and portfolio["user_id"] == user_email:
            return portfolio
    return None

def calculate_portfolio_metrics(portfolio):
    total_value = 0
    for asset in portfolio["assets"]:
        total_value += asset["quantity"] * asset["current_price"]
    portfolio["total_value"] = total_value
    portfolio["last_updated"] = datetime.now()
    # In a real application, would calculate performances based on historical data
    return portfolio

# Endpoints
@router.get("/", response_model=List[Portfolio])
async def get_portfolios(current_user: User = Depends(get_current_active_user)):
    user_portfolios = [p for p in mock_portfolios if p["user_id"] == current_user.email]
    return user_portfolios

@router.get("/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: int, current_user: User = Depends(get_current_active_user)):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    return portfolio

@router.post("/", response_model=Portfolio)
async def create_portfolio(portfolio: PortfolioCreate, current_user: User = Depends(get_current_active_user)):
    new_id = max([p["id"] for p in mock_portfolios]) + 1 if mock_portfolios else 1
    new_portfolio = {
        "id": new_id,
        "user_id": current_user.email,
        "name": portfolio.name,
        "description": portfolio.description,
        "creation_date": datetime.now(),
        "last_updated": datetime.now(),
        "assets": [],
        "total_value": 0.0,
        "performance_1d": 0.0,
        "performance_1w": 0.0,
        "performance_1m": 0.0,
        "performance_ytd": 0.0
    }
    mock_portfolios.append(new_portfolio)
    return new_portfolio

@router.put("/{portfolio_id}", response_model=Portfolio)
async def update_portfolio(
    portfolio_id: int,
    portfolio_update: PortfolioUpdate,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    if portfolio_update.name is not None:
        portfolio["name"] = portfolio_update.name
    if portfolio_update.description is not None:
        portfolio["description"] = portfolio_update.description
    
    portfolio["last_updated"] = datetime.now()
    return portfolio

@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(portfolio_id: int, current_user: User = Depends(get_current_active_user)):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    mock_portfolios.remove(portfolio)
    return None

@router.post("/{portfolio_id}/assets", response_model=Portfolio)
async def add_asset(
    portfolio_id: int,
    asset: Asset,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Check if asset already exists
    for existing_asset in portfolio["assets"]:
        if existing_asset["symbol"] == asset.symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset already exists in portfolio"
            )
    
    portfolio["assets"].append(asset.dict())
    calculate_portfolio_metrics(portfolio)
    return portfolio

@router.delete("/{portfolio_id}/assets/{symbol}", response_model=Portfolio)
async def remove_asset(
    portfolio_id: int,
    symbol: str,
    current_user: User = Depends(get_current_active_user)
):
    portfolio = get_portfolio_by_id(portfolio_id, current_user.email)
    if portfolio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    for i, asset in enumerate(portfolio["assets"]):
        if asset["symbol"] == symbol:
            del portfolio["assets"][i]
            calculate_portfolio_metrics(portfolio)
            return portfolio
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Asset not found in portfolio"
    ) 