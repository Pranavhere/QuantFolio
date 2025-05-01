# AI Portfolio System - Frontend

The frontend dashboard for the AI-Driven Portfolio System built with React.

## Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PortfolioSummary.jsx
│   │   │   └── RecentActivity.jsx
│   │   ├── Trading/
│   │   │   ├── TradingInterface.jsx
│   │   │   ├── OrderBook.jsx
│   │   │   └── TradeHistory.jsx
│   │   ├── User/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Profile.jsx
│   │   ├── Visualizations/
│   │   │   ├── PortfolioChart.jsx
│   │   │   ├── MarketChart.jsx
│   │   │   └── PerformanceMetrics.jsx
│   │   └── ThemeSwitcher/
│   │       └── ThemeSwitcher.jsx
│   ├── themes/
│   │   ├── dark.js
│   │   ├── light.js
│   │   └── modern.js
│   ├── api/
│   │   └── api.js
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── App.jsx
│   ├── index.jsx
│   └── routes.js
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file in the frontend directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

3. Run the development server:
   ```
   npm start
   ```

4. Build for production:
   ```
   npm run build
   ```

## Features

- Responsive dashboard with portfolio overview
- Interactive trading interface
- Real-time market data visualization
- Multiple theme options (Light, Dark, Modern)
- User authentication and profile management
- Portfolio performance analytics

## Dependencies

- React
- Material-UI
- Chart.js / D3.js
- Axios
- Redux (for state management)
- React Router (for routing)

## Theme Customization

The application includes three built-in themes:
- Light: Clean and professional look
- Dark: Reduced eye strain for night usage
- Modern: Contemporary design with vibrant accents

Custom themes can be created by adding new theme files in the `/src/themes` directory. 