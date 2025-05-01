# AI Portfolio System - Backend

The backend API for the AI-Driven Portfolio System built with FastAPI.

## Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── users.py
│   │   │   ├── trading.py
│   │   │   ├── portfolio.py
│   │   │   ├── analytics.py
│   │   │   └── data.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── models/
│   │   ├── user.py
│   │   ├── portfolio.py
│   │   ├── trade.py
│   │   └── market.py
│   ├── services/
│   │   ├── data_ingestion.py
│   │   ├── analytics.py
│   │   ├── trading.py
│   │   └── simulation.py
│   └── main.py
└── tests/
    ├── test_api.py
    ├── test_models.py
    └── conftest.py
```

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost/ai_portfolio
   MONGO_URL=mongodb://localhost:27017/
   KAFKA_BOOTSTRAP_SERVERS=localhost:9092
   SECRET_KEY=your-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

4. Run the server:
   ```
   python -m uvicorn app.main:app --reload
   ```

5. Access the API documentation:
   ```
   http://localhost:8000/docs
   ```

## API Endpoints

- `/users`: User management
- `/trading`: Trading operations
- `/portfolio`: Portfolio management
- `/analytics`: Data analysis
- `/data`: Market data

## Testing

Run tests with pytest:

```
pytest
``` 