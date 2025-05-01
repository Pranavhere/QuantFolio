// Mock data for development without MongoDB

// Mock users
const users = [
  {
    _id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date('2023-01-01'),
    last_login: new Date(),
    stats: {
      portfolios: 3,
      trades: 28,
      watchlist_items: 12
    }
  },
  {
    _id: '2',
    name: 'Test User',
    email: 'user@example.com',
    role: 'user',
    createdAt: new Date('2023-03-15'),
    last_login: new Date(),
    stats: {
      portfolios: 1,
      trades: 5,
      watchlist_items: 3
    }
  }
];

// Mock news
const news = [
  {
    _id: '1',
    title: 'Market Update: Stock Market Rallies',
    content: 'Stocks rallied today as investors gained confidence in the economic outlook...',
    summary: 'Stock market sees significant gains across major indices.',
    source: 'Financial Times',
    url: 'https://example.com/market-update',
    image_url: 'https://example.com/images/market-update.jpg',
    published_at: new Date('2023-04-28'),
    sentiment: 1,
    category: 'markets',
    related_symbols: ['AAPL', 'MSFT', 'GOOGL']
  },
  {
    _id: '2',
    title: 'Tech Sector Shows Strong Growth',
    content: 'Technology companies reported better than expected earnings...',
    summary: 'Tech sector outperforms market expectations with strong quarterly results.',
    source: 'Tech Daily',
    url: 'https://example.com/tech-growth',
    image_url: 'https://example.com/images/tech-growth.jpg',
    published_at: new Date('2023-04-27'),
    sentiment: 1,
    category: 'technology',
    related_symbols: ['AAPL', 'MSFT', 'AMZN']
  },
  {
    _id: '3',
    title: 'Economic Concerns Rise as Inflation Persists',
    content: 'Inflation rates continue to exceed targets set by the Federal Reserve...',
    summary: 'Rising inflation raises concerns about economic stability.',
    source: 'Economic Review',
    url: 'https://example.com/inflation-concerns',
    image_url: 'https://example.com/images/inflation.jpg',
    published_at: new Date('2023-04-26'),
    sentiment: -1,
    category: 'economy',
    related_symbols: []
  }
];

// Mock stocks data
const stocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.42,
    change: 3.78,
    change_percent: 2.16,
    volume: 67824500,
    market_cap: 2798652000000,
    pe_ratio: 29.42,
    dividend_yield: 0.51,
    sector: 'Technology',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 331.14,
    change: 4.32,
    change_percent: 1.32,
    volume: 19754300,
    market_cap: 2458752000000,
    pe_ratio: 35.21,
    dividend_yield: 0.82,
    sector: 'Technology',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 135.41,
    change: 2.13,
    change_percent: 1.59,
    volume: 22145800,
    market_cap: 1711982000000,
    pe_ratio: 26.12,
    dividend_yield: 0,
    sector: 'Technology',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 134.81,
    change: 1.97,
    change_percent: 1.48,
    volume: 36742100,
    market_cap: 1389657000000,
    pe_ratio: 105.32,
    dividend_yield: 0,
    sector: 'Consumer Cyclical',
    exchange: 'NASDAQ'
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 327.56,
    change: -4.32,
    change_percent: -1.30,
    volume: 21563200,
    market_cap: 841659000000,
    pe_ratio: 28.32,
    dividend_yield: 0,
    sector: 'Technology',
    exchange: 'NASDAQ'
  }
];

// Mock market indices
const indices = [
  {
    symbol: 'SPX',
    name: 'S&P 500',
    price: 4480.12,
    change: 42.34,
    change_percent: 0.95,
    volume: 2354789000
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones Industrial Average',
    price: 35061.21,
    change: 285.56,
    change_percent: 0.82,
    volume: 332145600
  },
  {
    symbol: 'IXIC',
    name: 'NASDAQ Composite',
    price: 14016.81,
    change: 196.65,
    change_percent: 1.42,
    volume: 4123568000
  }
];

// Mock economic indicators
const economicIndicators = [
  {
    indicator: 'Interest Rate',
    value: 5.25,
    change: 0,
    change_percent: 0,
    date: new Date('2023-04-25')
  },
  {
    indicator: 'Inflation Rate',
    value: 4.9,
    change: -0.2,
    change_percent: -3.92,
    date: new Date('2023-04-15')
  },
  {
    indicator: 'GDP Growth Rate',
    value: 2.8,
    change: 0.3,
    change_percent: 12.0,
    date: new Date('2023-04-10')
  },
  {
    indicator: 'Unemployment Rate',
    value: 3.7,
    change: -0.1,
    change_percent: -2.63,
    date: new Date('2023-04-20')
  }
];

// Mock market summary
const marketSummary = {
  timestamp: new Date(),
  market_indices: [
    {
      symbol: 'SPX',
      name: 'S&P 500',
      price: 4480.12,
      change: 42.34,
      change_percent: 0.95
    },
    {
      symbol: 'DJI',
      name: 'Dow Jones Industrial Average',
      price: 35061.21,
      change: 285.56,
      change_percent: 0.82
    },
    {
      symbol: 'IXIC',
      name: 'NASDAQ Composite',
      price: 14016.81,
      change: 196.65,
      change_percent: 1.42
    }
  ],
  market_breadth: {
    advancing: 1853,
    declining: 1102,
    unchanged: 145
  },
  trading_volume: {
    value: 8.6,
    unit: 'Billion Shares',
    change_percent: 12.5
  },
  top_gainers: [
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 228.56,
      change: 15.89,
      change_percent: 7.47
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 376.89,
      change: 22.45,
      change_percent: 6.33
    },
    {
      symbol: 'INTC',
      name: 'Intel Corporation',
      price: 32.45,
      change: 1.56,
      change_percent: 5.05
    }
  ],
  top_losers: [
    {
      symbol: 'PFE',
      name: 'Pfizer Inc.',
      price: 28.34,
      change: -1.89,
      change_percent: -6.25
    },
    {
      symbol: 'KO',
      name: 'The Coca-Cola Company',
      price: 59.78,
      change: -2.34,
      change_percent: -3.76
    },
    {
      symbol: 'MCD',
      name: 'McDonald\'s Corporation',
      price: 267.12,
      change: -8.89,
      change_percent: -3.22
    }
  ],
  recent_news: [
    {
      id: '1',
      title: 'Fed Signals Potential Rate Cut Later This Year',
      source: 'Financial Times',
      url: 'https://example.com/fed-signals-rate-cut',
      published_at: new Date('2023-04-28T14:30:00'),
      sentiment: 1
    },
    {
      id: '2',
      title: 'Tech Giants Report Strong Earnings',
      source: 'Wall Street Journal',
      url: 'https://example.com/tech-giants-earnings',
      published_at: new Date('2023-04-28T10:15:00'),
      sentiment: 1
    },
    {
      id: '3',
      title: 'Manufacturing Activity Slows for Third Straight Month',
      source: 'Bloomberg',
      url: 'https://example.com/manufacturing-slows',
      published_at: new Date('2023-04-27T16:45:00'),
      sentiment: -1
    }
  ]
};

// Mock portfolios
const portfolios = [
  {
    _id: '1',
    user_id: '1',
    name: 'Tech Growth Portfolio',
    description: 'A portfolio focused on high-growth technology companies',
    created_at: new Date('2023-02-15'),
    updated_at: new Date('2023-04-20'),
    assets: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 25,
        purchase_price: 145.23,
        current_price: 178.42,
        allocation: 32.5,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        quantity: 15,
        purchase_price: 280.12,
        current_price: 331.14,
        allocation: 28.2,
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        quantity: 20,
        purchase_price: 112.75,
        current_price: 135.41,
        allocation: 21.8,
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        quantity: 10,
        purchase_price: 120.12,
        current_price: 134.81,
        allocation: 17.5,
      }
    ],
    performance: {
      daily: 1.8,
      weekly: 2.3,
      monthly: 5.6,
      yearly: 18.2
    },
    risk_level: 'Moderate'
  },
  {
    _id: '2',
    user_id: '1',
    name: 'Dividend Portfolio',
    description: 'A portfolio focused on dividend-paying stocks',
    created_at: new Date('2023-03-10'),
    updated_at: new Date('2023-04-15'),
    assets: [
      {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        quantity: 30,
        purchase_price: 155.32,
        current_price: 161.89,
        allocation: 28.5,
      },
      {
        symbol: 'PG',
        name: 'Procter & Gamble Co.',
        quantity: 25,
        purchase_price: 142.43,
        current_price: 145.26,
        allocation: 24.3,
      },
      {
        symbol: 'KO',
        name: 'The Coca-Cola Company',
        quantity: 50,
        purchase_price: 58.12,
        current_price: 59.78,
        allocation: 23.7,
      },
      {
        symbol: 'VZ',
        name: 'Verizon Communications Inc.',
        quantity: 45,
        purchase_price: 40.12,
        current_price: 42.35,
        allocation: 23.5,
      }
    ],
    performance: {
      daily: 0.5,
      weekly: 1.2,
      monthly: 2.1,
      yearly: 8.5
    },
    risk_level: 'Low'
  },
  {
    _id: '3',
    user_id: '1',
    name: 'Aggressive Growth Portfolio',
    description: 'A high-risk, high-reward portfolio of growth stocks',
    created_at: new Date('2023-01-20'),
    updated_at: new Date('2023-04-25'),
    assets: [
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        quantity: 20,
        purchase_price: 180.45,
        current_price: 228.56,
        allocation: 35.2,
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        quantity: 10,
        purchase_price: 280.32,
        current_price: 376.89,
        allocation: 29.5,
      },
      {
        symbol: 'AMD',
        name: 'Advanced Micro Devices, Inc.',
        quantity: 40,
        purchase_price: 85.23,
        current_price: 102.46,
        allocation: 21.8,
      },
      {
        symbol: 'CRM',
        name: 'Salesforce, Inc.',
        quantity: 15,
        purchase_price: 190.12,
        current_price: 228.72,
        allocation: 13.5,
      }
    ],
    performance: {
      daily: 2.5,
      weekly: 4.8,
      monthly: 9.2,
      yearly: 26.8
    },
    risk_level: 'High'
  }
];

// Mock trades
const trades = [
  {
    _id: '1',
    user_id: '1',
    portfolio_id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'buy',
    quantity: 10,
    price: 142.35,
    total: 1423.50,
    date: new Date('2023-02-15T10:30:00'),
    status: 'completed'
  },
  {
    _id: '2',
    user_id: '1',
    portfolio_id: '1',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'buy',
    quantity: 5,
    price: 278.45,
    total: 1392.25,
    date: new Date('2023-02-16T11:15:00'),
    status: 'completed'
  },
  {
    _id: '3',
    user_id: '1',
    portfolio_id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'buy',
    quantity: 5,
    price: 148.12,
    total: 740.60,
    date: new Date('2023-03-22T14:20:00'),
    status: 'completed'
  },
  {
    _id: '4',
    user_id: '1',
    portfolio_id: '2',
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    type: 'buy',
    quantity: 15,
    price: 155.32,
    total: 2329.80,
    date: new Date('2023-03-10T09:45:00'),
    status: 'completed'
  },
  {
    _id: '5',
    user_id: '1',
    portfolio_id: '3',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'buy',
    quantity: 10,
    price: 180.45,
    total: 1804.50,
    date: new Date('2023-01-20T13:30:00'),
    status: 'completed'
  }
];

// Password verification mock (always returns true in dev mode)
const passwordMatch = () => true;

module.exports = {
  users,
  news,
  stocks,
  indices,
  economicIndicators,
  marketSummary,
  portfolios,
  trades,
  passwordMatch
}; 