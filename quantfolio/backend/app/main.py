from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers from endpoints
from app.api.endpoints import users, trading, portfolio, analytics, data

# Create FastAPI app
app = FastAPI(
    title="AI Portfolio System API",
    description="Backend API for AI-Driven Portfolio System",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # React dev server
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(trading.router, prefix="/trading", tags=["trading"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(data.router, prefix="/data", tags=["data"])

@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint to check API status
    """
    return {
        "message": "Welcome to AI Portfolio System API",
        "status": "online",
        "documentation": "/docs",
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 