import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import StockChart from "../components/StockChart";
import api from '../lib/api';
import { toast } from "sonner";

const formatPrice = (price) => {
    try {
        if (typeof price !== 'number' || isNaN(price)) {
            throw new Error('Invalid price');
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    } catch (error) {
        console.error('Price formatting error:', error);
        return 'Invalid price';
    }
};

const formatPercentage = (value) => {
    try {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error('Invalid percentage');
        }
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: 'always',
        }).format(value / 100);
    } catch (error) {
        console.error('Percentage formatting error:', error);
        return 'Invalid percentage';
    }
};

const SymbolDetails = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStockData = useCallback(async () => {
        if (!symbol) {
            setError('No symbol provided');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/stock/${symbol}`);
            if (!response?.data) {
                throw new Error('Invalid response from server');
            }
            setStockData(response.data);
            toast.success('Stock data updated');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch stock data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    const handleRefresh = useCallback(() => {
        fetchStockData();
    }, [fetchStockData]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    useEffect(() => {
        fetchStockData();
    }, [fetchStockData]);

    const renderContent = () => {
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{stockData.symbol}</CardTitle>
                            <CardDescription>
                                {stockData.name || 'Stock Details'}
                            </CardDescription>
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
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    <StockChart 
                        history={stockData.history} 
                        isLoading={loading}
                        error={error}
                        onRefresh={handleRefresh}
                    />
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <IconArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">{symbol} Details</h1>
            </div>
            {renderContent()}
        </div>
    );
};

export default SymbolDetails;