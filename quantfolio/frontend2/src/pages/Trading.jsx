import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";
import { buyPortfolio, sellPortfolio, getTrades } from '../lib/api';

const formatPrice = (price) => {
    try {
        // Convert string to number if needed
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        
        // Check if the value is a valid number
        if (typeof numPrice !== 'number' || isNaN(numPrice)) {
            console.warn('Invalid price value:', price);
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

const formatDate = (date) => {
    try {
        if (!date) {
            throw new Error('Invalid date');
        }
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
};

const Trading = () => {
    const { selectedPortfolioId, refreshPortfolio } = usePortfolio();
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [orderType, setOrderType] = useState('buy');
    const [recentTrades, setRecentTrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRecentTrades = useCallback(async () => {
            setLoading(true);
            setError(null);
            try {
                const trades = await getTrades();
            if (!trades) {
                throw new Error('Invalid response from server');
            }
                setRecentTrades(trades.slice(0, 5));
            toast.success('Recent trades updated');
            } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch recent trades';
            setError(errorMessage);
            toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
    }, []);

    const handleTrade = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedPortfolioId) {
            toast.error('Please select a portfolio in the Dashboard');
            return;
        }
        if (!symbol.trim()) {
            toast.error('Symbol is required');
            return;
        }
        if (!quantity || parseInt(quantity) <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        try {
            if (orderType === 'buy') {
                await buyPortfolio(selectedPortfolioId, symbol.trim(), parseFloat(price), parseInt(quantity));
                toast.success('Buy order executed successfully');
            } else {
                await sellPortfolio(selectedPortfolioId, symbol.trim(), parseFloat(price), parseInt(quantity));
                toast.success('Sell order executed successfully');
            }

            setSymbol('');
            setQuantity('');
            setPrice('');
            await fetchRecentTrades();
            await refreshPortfolio();
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to execute trade';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedPortfolioId, symbol, quantity, price, orderType, fetchRecentTrades, refreshPortfolio]);

    const handleRefresh = useCallback(() => {
        fetchRecentTrades();
    }, [fetchRecentTrades]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    useEffect(() => {
        fetchRecentTrades();
    }, [fetchRecentTrades]);

    const renderTradingForm = () => (
                        <form onSubmit={handleTrade} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="symbol" className="block text-sm font-medium">Symbol</label>
                                <Input
                                    id="symbol"
                                    placeholder="e.g., AAPL"
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                    aria-label="Stock symbol"
                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="price" className="block text-sm font-medium">Price</label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                    min="0.01"
                                    placeholder="e.g., 175.25"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                    disabled={isSubmitting}
                    aria-label="Stock price"
                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="quantity" className="block text-sm font-medium">Quantity</label>
                                <Input
                                    id="quantity"
                                    type="number"
                    min="1"
                                    placeholder="e.g., 10"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={isSubmitting}
                    aria-label="Number of shares"
                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="order-type" className="block text-sm font-medium">Order Type</label>
                <Select 
                    value={orderType} 
                    onValueChange={setOrderType}
                    disabled={isSubmitting}
                >
                    <SelectTrigger id="order-type" aria-label="Select order type">
                                        <SelectValue placeholder="Select order type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="buy">Buy</SelectItem>
                                        <SelectItem value="sell">Sell</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
            <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
                aria-label={isSubmitting ? 'Executing trade...' : 'Execute trade'}
            >
                {isSubmitting ? 'Executing...' : 'Execute Trade'}
            </Button>
                        </form>
    );

    const renderRecentTrades = () => {
        if (loading) {
            return (
                <div className="space-y-2" role="status" aria-label="Loading recent trades">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
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
                            aria-label="Retry loading recent trades"
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (!recentTrades.length) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        No recent trades found
                    </AlertDescription>
                </Alert>
            );
        }

        return (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Symbol</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTrades.map((trade) => (
                                        <TableRow key={trade.trade_id}>
                            <TableCell className="capitalize">{trade.type}</TableCell>
                                            <TableCell>{trade.symbol}</TableCell>
                            <TableCell aria-label={`Price: ${formatPrice(trade.price)}`}>
                                {formatPrice(trade.price)}
                            </TableCell>
                                            <TableCell>{trade.quantity}</TableCell>
                            <TableCell aria-label={`Date: ${formatDate(trade.date)}`}>
                                {formatDate(trade.date)}
                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
        );
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Trading</h1>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    aria-label="Refresh recent trades"
                >
                    <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Trading Panel</CardTitle>
                        <CardDescription>
                            Execute buy or sell orders for stocks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderTradingForm()}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Trades</CardTitle>
                        <CardDescription>
                            Your 5 most recent trades
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderRecentTrades()}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Trading;