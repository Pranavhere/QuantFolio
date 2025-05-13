import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const MetricCard = ({ title, value, badge, tooltip, isLoading }) => {
    if (isLoading) {
    return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-32" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-6 w-24" />
                </CardFooter>
            </Card>
        );
    }

    return (
            <Card>
                <CardHeader>
                <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-2xl font-semibold" aria-label={`${title}: ${value}`}>
                    {value}
                </p>
                </CardContent>
                <CardFooter>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant={badge.variant}>
                                {badge.icon}
                                {badge.text}
                    </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                </CardFooter>
            </Card>
    );
};

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    badge: PropTypes.shape({
        variant: PropTypes.string.isRequired,
        icon: PropTypes.node.isRequired,
        text: PropTypes.string.isRequired,
    }).isRequired,
    tooltip: PropTypes.string.isRequired,
    isLoading: PropTypes.bool,
};

const PortfolioSummary = ({ metrics, totalValue, isLoading, error }) => {
    const { totalReturn, sharpeRatio, maxDrawdown } = metrics || {};

    const cards = useMemo(() => [
        {
            title: 'Total Value',
            value: formatCurrency(totalValue),
            badge: {
                variant: 'outline',
                icon: <IconTrendingUp className="mr-1 h-4 w-4" />,
                text: 'Portfolio Value',
            },
            tooltip: 'The current total value of your portfolio including all assets',
        },
        {
            title: 'Total Return',
            value: formatPercentage(totalReturn),
            badge: {
                variant: totalReturn >= 0 ? 'success' : 'destructive',
                icon: totalReturn >= 0 ? <IconTrendingUp className="mr-1 h-4 w-4" /> : <IconTrendingDown className="mr-1 h-4 w-4" />,
                text: totalReturn >= 0 ? 'Gain' : 'Loss',
            },
            tooltip: 'The total percentage return of your portfolio over the selected period',
        },
        {
            title: 'Sharpe Ratio',
            value: sharpeRatio?.toFixed(2) || '0.00',
            badge: {
                variant: 'outline',
                icon: <IconTrendingUp className="mr-1 h-4 w-4" />,
                text: 'Risk-Adjusted Return',
            },
            tooltip: 'A measure of risk-adjusted return, higher values indicate better risk-adjusted performance',
        },
        {
            title: 'Max Drawdown',
            value: formatPercentage(maxDrawdown),
            badge: {
                variant: 'destructive',
                icon: <IconTrendingDown className="mr-1 h-4 w-4" />,
                text: 'Peak-to-Trough',
            },
            tooltip: 'The maximum observed loss from a peak to a subsequent trough',
        },
    ], [totalValue, totalReturn, sharpeRatio, maxDrawdown]);

    if (error) {
        return (
            <div className="text-red-500 p-4 text-center" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Portfolio Summary">
            {cards.map((card) => (
                <MetricCard
                    key={card.title}
                    {...card}
                    isLoading={isLoading}
                />
            ))}
        </div>
    );
};

PortfolioSummary.propTypes = {
    metrics: PropTypes.shape({
        totalReturn: PropTypes.number.isRequired,
        sharpeRatio: PropTypes.number.isRequired,
        maxDrawdown: PropTypes.number.isRequired,
    }),
    totalValue: PropTypes.number.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.string,
};

PortfolioSummary.defaultProps = {
    isLoading: false,
    error: null,
};

export default React.memo(PortfolioSummary);