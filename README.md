# QuantFolio

An AI-driven portfolio system with advanced analytics for investment tracking and management.

## Features

- **User Authentication**: Secure login and registration
- **Portfolio Management**: Create, update, and manage multiple investment portfolios
- **Asset Tracking**: Track stocks, ETFs, and other securities
- **Market Data**: Real-time market information and historical data
- **AI Analytics**: AI-powered market analysis and portfolio optimization
- **Interactive Visualizations**: Charts and graphs to analyze performance

## Technical Architecture

The system uses a dual-backend architecture:

- **Node.js/Express Backend** (Port 5001): Handles core API functionality, user authentication, and database operations
- **Python/FastAPI Backend** (Port 8000): Handles advanced analytics, AI features, and data processing

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Pranavhere/QuantFolio.git
   cd QuantFolio
   ```

2. Set up the Node.js backend:
   ```
   cd quantfolio/backend
   npm install
   ```

3. Set up the Python backend:
   ```
   cd quantfolio/backend
   pip install -r requirements.txt
   ```

4. Set up the React frontend:
   ```
   cd quantfolio/frontend
   npm install
   ```

### Running the Application

1. Start the Node.js backend:
   ```
   cd quantfolio/backend
   npm run dev
   ```

2. Start the Python backend:
   ```
   cd quantfolio/backend
   python -m uvicorn app.main:app --reload
   ```

3. Start the frontend:
   ```
   cd quantfolio/frontend
   npm start
   ```

Access the application at http://localhost:3000

## Technologies Used

- **Frontend**: React, Material-UI, Chart.js
- **Backend**: Express.js, FastAPI, MongoDB
- **Authentication**: JWT
- **AI/ML**: Python libraries (numpy, pandas, scikit-learn)
- **DevOps**: Git, Docker (coming soon) 