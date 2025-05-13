import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconRefresh } from "@tabler/icons-react";

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
};

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

const formatQuantity = (quantity) => {
    try {
        if (typeof quantity !== 'number' || isNaN(quantity)) {
            throw new Error('Invalid quantity');
        }
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(quantity);
    } catch (error) {
        console.error('Quantity formatting error:', error);
        return 'Invalid quantity';
    }
};

const RecentActivity = ({ transactions, isLoading, error, onRefresh }) => {
    const sortedTransactions = useMemo(() => {
        if (!transactions?.length) return [];
        return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    const handleRefresh = useCallback(() => {
        if (onRefresh) {
            onRefresh();
        }
    }, [onRefresh]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-2" role="status" aria-label="Loading transactions">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-4" role="alert">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        aria-label="Retry loading transactions"
                    >
                        <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Retry
                    </Button>
                </div>
            );
        }

        if (!sortedTransactions.length) {
            return (
                <div className="text-center py-8 text-muted-foreground" role="status">
                    No recent transactions
                </div>
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
                    {sortedTransactions.map((tx) => (
                        <TableRow 
                            key={`${tx.date}-${tx.symbol}-${tx.type}-${tx.quantity}`}
                            aria-label={`${tx.type} ${tx.quantity} ${tx.symbol} at ${formatPrice(tx.price)} on ${formatDate(tx.date)}`}
                        >
                            <TableCell>
                                <Badge 
                                    variant={tx.type === 'BUY' ? 'success' : 'destructive'}
                                    aria-label={`Transaction type: ${tx.type}`}
                                >
                                    {tx.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{tx.symbol}</TableCell>
                            <TableCell>{formatPrice(tx.price)}</TableCell>
                            <TableCell>{formatQuantity(tx.quantity)}</TableCell>
                            <TableCell>{formatDate(tx.date)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Your latest trading transactions
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    aria-label="Refresh transactions"
                >
                    <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

RecentActivity.propTypes = {
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.oneOf(['BUY', 'SELL']).isRequired,
            symbol: PropTypes.string.isRequired,
            price: PropTypes.number.isRequired,
            quantity: PropTypes.number.isRequired,
            date: PropTypes.string.isRequired,
        })
    ),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    onRefresh: PropTypes.func,
};

RecentActivity.defaultProps = {
    transactions: [],
    isLoading: false,
    error: null,
    onRefresh: null,
};

export default React.memo(RecentActivity);