import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconSearch, IconRefresh } from "@tabler/icons-react";
import MarketInsights from "../components/MarketInsights";
import StockChart from "../components/StockChart";
import api from '../lib/api';

const formatPrice = (price) => {
    try {
        // Convert string to number if needed
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        // Check if the value is a valid number
        if (typeof numPrice !== 'number' || isNaN(numPrice)) {
            return 'N/A';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numPrice);
    } catch (error) {
        console.error('Price formatting error:', error);
        return 'N/A';
    }
};

const formatPercentage = (value) => {
    try {
        // Convert string to number if needed
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        // Check if the value is a valid number
        if (typeof numValue !== 'number' || isNaN(numValue)) {
            return 'N/A';
        }

        // If the value is in decimal form (e.g., 0.05 for 5%), convert it
        const percentageValue = Math.abs(numValue) > 1 ? numValue : numValue * 100;

        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: 'always',
        }).format(percentageValue / 100);
    } catch (error) {
        console.error('Percentage formatting error:', error);
        return 'N/A';
    }
};

const Market = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const querySymbol = new URLSearchParams(location.search).get('symbol') || '';
    const [symbol, setSymbol] = useState(querySymbol);
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('daily');
    const [marketSymbols, setMarketSymbols] = useState([]);
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
    const [symbolsError, setSymbolsError] = useState(null);

    const fetchMarketSymbols = useCallback(async () => {
        if (marketSymbols.length > 0) return; // Don't fetch if we already have symbols
        
        setIsLoadingSymbols(true);
        setSymbolsError(null);
        try {
            const response = await api.get('/stocks/symbols');
            if (!response?.data) {
                throw new Error('Invalid response from server');
            }
            setMarketSymbols(response.data.slice(0, 20).map(symbol => ({ symbol })));
            } catch (err) {
                console.error('Error fetching market symbols:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch market symbols';
            setSymbolsError(errorMessage);
        } finally {
            setIsLoadingSymbols(false);
            }
    }, [marketSymbols.length]);

    const fetchStockData = useCallback(async () => {
        if (!symbol) return;

            setLoading(true);
            setError(null);
            try {
            const response = await api.get(`/visualize/${symbol}`, { params: { timeframe: period } });
            if (!response?.data) {
                throw new Error('Invalid response from server');
            }

            // Transform the data to match the expected format
            const { labels, prices, volumes } = response.data;
            
            if (!labels?.length || !prices?.length || !volumes?.length) {
                throw new Error('Invalid data format received from server');
            }

            const history = labels.map((date, index) => ({
                date,
                price: prices[index],
                volume: volumes[index]
            }));

            // Calculate price change
            const currentPrice = prices[prices.length - 1];
            const previousPrice = prices[prices.length - 2];
            
            if (typeof currentPrice !== 'number' || typeof previousPrice !== 'number') {
                throw new Error('Invalid price data received from server');
            }

            const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

            setStockData({
                symbol,
                price: currentPrice,
                change: priceChange,
                history
            });
            } catch (err) {
            console.error('Error fetching stock data:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stock data';
            setError(errorMessage);
                setStockData(null);
            } finally {
                setLoading(false);
            }
    }, [symbol, period]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        if (symbol.trim()) {
            const searchSymbol = symbol.trim().toUpperCase();
            navigate(`/market?symbol=${searchSymbol}`);
            setSymbol(searchSymbol);
        }
    }, [symbol, navigate]);

    const handleSymbolClick = useCallback((symbol) => {
        if (symbol) {
            setSymbol(symbol);
            navigate(`/market?symbol=${symbol}`);
        }
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        if (symbol) {
            fetchStockData();
        } else {
            fetchMarketSymbols();
        }
    }, [symbol, fetchStockData, fetchMarketSymbols]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    useEffect(() => {
        fetchMarketSymbols();
    }, [fetchMarketSymbols]);

    useEffect(() => {
        if (querySymbol) {
            setSymbol(querySymbol.toUpperCase());
        }
    }, [querySymbol]);

    useEffect(() => {
        if (symbol) {
            fetchStockData();
        }
    }, [symbol, period, fetchStockData]);

    const renderMarketSymbols = () => {
        if (isLoadingSymbols) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Loading market symbols">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            );
        }

        if (symbolsError) {
            return (
                <Alert variant="destructive" role="alert">
                    <AlertDescription className="flex items-center justify-between">
                        <span>{symbolsError}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            onKeyDown={handleKeyDown}
                            disabled={isLoadingSymbols}
                            aria-label="Retry loading market symbols"
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${isLoadingSymbols ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (!marketSymbols.length) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        No market symbols available
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {marketSymbols.map((item) => (
                    <Button
                        key={item.symbol}
                        variant="outline"
                        onClick={() => handleSymbolClick(item.symbol)}
                        aria-label={`View details for ${item.symbol}`}
                    >
                        {item.symbol}
                    </Button>
                ))}
            </div>
        );
    };

    const renderStockDetails = () => {
        if (loading) {
            return (
                <div className="space-y-4" role="status" aria-label="Loading stock data">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" role="alert">
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            aria-label="Retry loading stock data"
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (!stockData) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        No stock data available
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">{stockData.symbol}</h2>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Price</p>
                                <p className="text-2xl font-semibold" aria-label={`Current price: ${formatPrice(stockData.price)}`}>
                                    {formatPrice(stockData.price)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Price Change</p>
                                <p 
                                    className={`text-2xl font-semibold ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}
                                    aria-label={`Price change: ${formatPercentage(stockData.change)}`}
                                >
                                    {formatPercentage(stockData.change)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        aria-label="Refresh stock data"
                    >
                        <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <Tabs defaultValue="daily" onValueChange={setPeriod} aria-label="Select time period">
                    <TabsList>
                        <TabsTrigger value="daily">Daily</TabsTrigger>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value={period}>
                        <StockChart 
                            history={stockData.history} 
                            isLoading={loading}
                            error={error}
                            onRefresh={handleRefresh}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-8">
            <h1 className="text-3xl font-bold">Market Overview</h1>
            {!querySymbol ? (
                <>
                    <MarketInsights />
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                            <CardTitle>Marketplace Symbols</CardTitle>
                                    <CardDescription>
                                        Select a symbol to view detailed information
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefresh}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoadingSymbols}
                                    aria-label="Refresh market symbols"
                                >
                                    <IconRefresh className={`h-4 w-4 ${isLoadingSymbols ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {renderMarketSymbols()}
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
                            <Input
                                placeholder="Enter stock symbol (e.g., AAPL)"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                aria-label="Stock symbol"
                                required
                            />
                            <Button 
                                type="submit" 
                                disabled={loading}
                                aria-label={loading ? 'Searching...' : 'Search'}
                            >
                                <IconSearch className="h-4 w-4 mr-2" />
                                {loading ? 'Searching...' : 'Search'}
                            </Button>
                        </form>
                        {renderStockDetails()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Market;