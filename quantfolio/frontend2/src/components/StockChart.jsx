import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    LineElement, 
    PointElement, 
    Title, 
    Tooltip, 
    Legend,
    Filler 
} from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconRefresh } from "@tabler/icons-react";

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    LineElement, 
    PointElement, 
    Title, 
    Tooltip, 
    Legend,
    Filler
);

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

const StockChart = ({ history, isLoading, error, onRefresh }) => {
    const chartData = useMemo(() => ({
        labels: history?.map((entry) => formatDate(entry.date)) || [],
        datasets: [
            {
                label: 'Stock Price',
                data: history?.map((entry) => entry.price) || [],
                borderColor: 'hsl(var(--primary))',
                borderWidth: 3,
                backgroundColor: 'var(--chart-fill)',
                fill: {
                    target: 'origin',
                    above: 'var(--chart-fill)',
                },
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'hsl(var(--primary))',
                pointBorderWidth: 2,
            },
        ],
    }), [history]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { 
                title: { display: true, text: 'Date' },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: { 
                title: { display: true, text: 'Price ($)' },
                ticks: {
                    callback: (value) => formatPrice(value),
                },
            },
        },
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (context) => formatPrice(context.parsed.y),
                },
            },
            filler: {
                propagate: false
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart',
        },
    }), []);

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
                <div className="h-64 flex items-center justify-center" role="status" aria-label="Loading stock price history">
                    <Skeleton className="h-full w-full" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="h-64 flex flex-col items-center justify-center gap-4" role="alert">
                    <p className="text-red-500">{error}</p>
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        aria-label="Retry loading stock price history"
                    >
                        <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Retry
                    </Button>
                </div>
            );
        }

        if (!history?.length) {
            return (
                <div className="h-64 flex items-center justify-center text-muted-foreground" role="status">
                    No price history available
                </div>
            );
        }

        return (
            <div className="h-64" role="img" aria-label="Stock price history chart">
                <Line 
                    data={chartData} 
                    options={options}
                    aria-label={`Stock price history from ${formatDate(history[0].date)} to ${formatDate(history[history.length - 1].date)}`}
                />
            </div>
        );
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                <CardTitle>Stock Price History</CardTitle>
                    <CardDescription>
                        Historical price data for the selected stock
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    aria-label="Refresh stock price history"
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

StockChart.propTypes = {
    history: PropTypes.arrayOf(
        PropTypes.shape({
            date: PropTypes.string.isRequired,
            price: PropTypes.number.isRequired,
        })
    ),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    onRefresh: PropTypes.func,
};

StockChart.defaultProps = {
    history: [],
    isLoading: false,
    error: null,
    onRefresh: null,
};

export default React.memo(StockChart);