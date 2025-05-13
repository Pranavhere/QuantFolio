import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown, IconAlertCircle } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const formatCurrency = (value) => {
    try {
        // Convert string to number if needed
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        // Check if the value is a valid number
        if (typeof numValue !== 'number' || isNaN(numValue)) {
            return 'N/A';
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numValue);
    } catch (error) {
        console.error('Currency formatting error:', error);
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

        // Convert decimal to percentage if needed (e.g., 0.05 to 5%)
        const percentageValue = numValue < 1 ? numValue * 100 : numValue;

        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(percentageValue / 100);
    } catch (error) {
        console.error('Percentage formatting error:', error);
        return 'N/A';
    }
};

const PortfolioCard = ({ portfolio, isLoading, error }) => {
    const navigate = useNavigate();

    const formattedDates = useMemo(() => ({
        created: formatDate(portfolio?.created_at),
        updated: formatDate(portfolio?.updated_at),
    }), [portfolio?.created_at, portfolio?.updated_at]);

    const handleClick = useCallback(() => {
        if (portfolio?.portfolio_id) {
            navigate(`/dashboard/${portfolio.portfolio_id}`);
        }
    }, [navigate, portfolio?.portfolio_id]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    if (isLoading) {
        return (
            <Card className="transition-all hover:shadow-md" role="status" aria-label="Loading portfolio card">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="transition-all">
                <CardContent className="pt-6">
                    <Alert variant="destructive" role="alert">
                        <IconAlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'Failed to load portfolio data'}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!portfolio) {
        return (
            <Card className="transition-all">
                <CardContent className="pt-6">
                    <Alert variant="default" role="status">
                        <AlertDescription>
                            No portfolio data available
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            className="transition-all hover:shadow-md cursor-pointer"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`Portfolio: ${portfolio.name}`}
        >
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{portfolio.name}</CardTitle>
                    <Badge 
                        variant={portfolio.performance >= 0 ? "success" : "destructive"}
                        aria-label={`Performance: ${formatPercentage(portfolio.performance)}`}
                    >
                        {portfolio.performance >= 0 ? (
                            <IconTrendingUp className="mr-1 h-4 w-4" aria-hidden="true" />
                        ) : (
                            <IconTrendingDown className="mr-1 h-4 w-4" aria-hidden="true" />
                        )}
                        {formatPercentage(portfolio.performance)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <p className="text-2xl font-semibold" aria-label={`Total value: ${formatCurrency(portfolio.total_value)}`}>
                        {formatCurrency(portfolio.total_value)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Created: {formattedDates.created}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Last Updated: {formattedDates.updated}
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                    aria-label={`View details for portfolio: ${portfolio.name}`}
                >
                    View Details
                </Button>
            </CardFooter>
        </Card>
    );
};

PortfolioCard.propTypes = {
    portfolio: PropTypes.shape({
        portfolio_id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        created_at: PropTypes.string.isRequired,
        updated_at: PropTypes.string.isRequired,
        total_value: PropTypes.number.isRequired,
        performance: PropTypes.number.isRequired,
    }),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};

PortfolioCard.defaultProps = {
    isLoading: false,
    error: null,
};

export default React.memo(PortfolioCard);