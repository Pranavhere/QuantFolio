from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from app.api.endpoints.users import get_current_active_user, User

router = APIRouter()

# Models
class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    CANCELED = "canceled"
    REJECTED = "rejected"

class Order(BaseModel):
    id: int
    user_id: str
    portfolio_id: int
    symbol: str
    order_type: OrderType
    side: OrderSide
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus
    created_at: datetime
    executed_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    portfolio_id: int
    symbol: str
    order_type: OrderType
    side: OrderSide
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None

class Trade(BaseModel):
    id: int
    order_id: int
    user_id: str
    portfolio_id: int
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    timestamp: datetime
    fee: float
    total_value: float

# Mock data
mock_orders = [
    {
        "id": 1,
        "user_id": "user@example.com",
        "portfolio_id": 1,
        "symbol": "AAPL",
        "order_type": "market",
        "side": "buy",
        "quantity": 5,
        "price": None,
        "stop_price": None,
        "status": "executed",
        "created_at": datetime(2023, 4, 15, 10, 30),
        "executed_at": datetime(2023, 4, 15, 10, 30, 15)
    },
    {
        "id": 2,
        "user_id": "user@example.com",
        "portfolio_id": 1,
        "symbol": "MSFT",
        "order_type": "limit",
        "side": "buy",
        "quantity": 3,
        "price": 270.0,
        "stop_price": None,
        "status": "pending",
        "created_at": datetime(2023, 5, 1, 9, 15),
        "executed_at": None
    }
]

mock_trades = [
    {
        "id": 1,
        "order_id": 1,
        "user_id": "user@example.com",
        "portfolio_id": 1,
        "symbol": "AAPL",
        "side": "buy",
        "quantity": 5,
        "price": 165.0,
        "timestamp": datetime(2023, 4, 15, 10, 30, 15),
        "fee": 1.65,
        "total_value": 826.65  # 5 * 165 + 1.65
    }
]

# Helper functions
def get_order_by_id(order_id: int, user_email: str):
    for order in mock_orders:
        if order["id"] == order_id and order["user_id"] == user_email:
            return order
    return None

def get_market_price(symbol: str):
    # In a real application, this would fetch real market data
    mock_prices = {
        "AAPL": 170.0,
        "MSFT": 280.0,
        "GOOGL": 2500.0,
        "AMZN": 3300.0,
        "TSLA": 750.0,
        "JNJ": 165.0,
        "PG": 145.0
    }
    return mock_prices.get(symbol, 100.0)  # Default price for demo

def execute_market_order(order):
    # In a real application, this would interact with a broker API
    current_price = get_market_price(order["symbol"])
    order["status"] = "executed"
    order["executed_at"] = datetime.now()
    
    # Create trade record
    fee = current_price * order["quantity"] * 0.001  # Example fee calculation
    new_trade = {
        "id": len(mock_trades) + 1,
        "order_id": order["id"],
        "user_id": order["user_id"],
        "portfolio_id": order["portfolio_id"],
        "symbol": order["symbol"],
        "side": order["side"],
        "quantity": order["quantity"],
        "price": current_price,
        "timestamp": datetime.now(),
        "fee": fee,
        "total_value": (current_price * order["quantity"]) + fee if order["side"] == "buy" else (current_price * order["quantity"]) - fee
    }
    mock_trades.append(new_trade)
    return order, new_trade

# Endpoints
@router.get("/orders", response_model=List[Order])
async def get_orders(
    portfolio_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    current_user: User = Depends(get_current_active_user)
):
    user_orders = [o for o in mock_orders if o["user_id"] == current_user.email]
    
    if portfolio_id is not None:
        user_orders = [o for o in user_orders if o["portfolio_id"] == portfolio_id]
    
    if status is not None:
        user_orders = [o for o in user_orders if o["status"] == status]
    
    return user_orders

@router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: int, current_user: User = Depends(get_current_active_user)):
    order = get_order_by_id(order_id, current_user.email)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order

@router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, current_user: User = Depends(get_current_active_user)):
    # Validation
    if order.order_type == OrderType.MARKET and order.price is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Market orders cannot specify a price"
        )
    
    if order.order_type == OrderType.LIMIT and order.price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit orders must specify a price"
        )
    
    if (order.order_type == OrderType.STOP or order.order_type == OrderType.STOP_LIMIT) and order.stop_price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stop orders must specify a stop price"
        )
    
    if order.order_type == OrderType.STOP_LIMIT and order.price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stop-limit orders must specify a limit price"
        )
    
    new_id = max([o["id"] for o in mock_orders]) + 1 if mock_orders else 1
    new_order = {
        "id": new_id,
        "user_id": current_user.email,
        "portfolio_id": order.portfolio_id,
        "symbol": order.symbol,
        "order_type": order.order_type,
        "side": order.side,
        "quantity": order.quantity,
        "price": order.price,
        "stop_price": order.stop_price,
        "status": "pending",
        "created_at": datetime.now(),
        "executed_at": None
    }
    
    mock_orders.append(new_order)
    
    # For demonstration, execute market orders immediately
    if order.order_type == OrderType.MARKET:
        new_order, _ = execute_market_order(new_order)
    
    return new_order

@router.delete("/orders/{order_id}", response_model=Order)
async def cancel_order(order_id: int, current_user: User = Depends(get_current_active_user)):
    order = get_order_by_id(order_id, current_user.email)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status {order['status']}"
        )
    
    order["status"] = "canceled"
    return order

@router.get("/trades", response_model=List[Trade])
async def get_trades(
    portfolio_id: Optional[int] = None,
    symbol: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    user_trades = [t for t in mock_trades if t["user_id"] == current_user.email]
    
    if portfolio_id is not None:
        user_trades = [t for t in user_trades if t["portfolio_id"] == portfolio_id]
    
    if symbol is not None:
        user_trades = [t for t in user_trades if t["symbol"] == symbol]
    
    return user_trades

@router.get("/quotes/{symbol}")
async def get_quote(symbol: str, current_user: User = Depends(get_current_active_user)):
    price = get_market_price(symbol)
    if price == 100.0 and symbol not in ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JNJ", "PG"]:
        # If we're returning the default price and symbol isn't in our mock list
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote not found for symbol {symbol}"
        )
    
    # In a real application, would return more quote information
    return {
        "symbol": symbol,
        "price": price,
        "change": 1.25,
        "change_percent": 0.74,
        "high": price + 2.5,
        "low": price - 2.0,
        "open": price - 1.0,
        "previous_close": price - 1.0,
        "timestamp": datetime.now()
    } 