import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  description, 
  subDescription, 
  isLoading,
  onClick,
}) => {
  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      return value >= 1000 ? formatNumber(value) : formatCurrency(value);
    }
    return value;
  }, [value]);

  const formattedChange = useMemo(() => {
    if (typeof change === 'number') {
      return formatPercentage(change);
    }
    return change;
  }, [change]);

  const isPositive = trend === 'up';

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card 
      className="@container/card cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formattedValue}
        </CardTitle>
        <CardAction>
          <Badge variant={isPositive ? "success" : "destructive"}>
            {isPositive ? <IconTrendingUp className="h-4 w-4" /> : <IconTrendingDown className="h-4 w-4" />}
            {formattedChange}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {description}
          {isPositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
        </div>
        <div className="text-muted-foreground">
          {subDescription}
        </div>
      </CardFooter>
    </Card>
  );
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  change: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  trend: PropTypes.oneOf(['up', 'down']).isRequired,
  description: PropTypes.string.isRequired,
  subDescription: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
};

export function SectionCards({ metrics, isLoading, error, onCardClick }) {
  if (error) {
    return (
      <div className="p-4 text-red-500 text-center" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      role="region"
      aria-label="Key metrics"
    >
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          {...metric}
          isLoading={isLoading}
          onClick={() => onCardClick?.(metric)}
        />
      ))}
    </div>
  );
}

SectionCards.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      change: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      trend: PropTypes.oneOf(['up', 'down']).isRequired,
      description: PropTypes.string.isRequired,
      subDescription: PropTypes.string.isRequired,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onCardClick: PropTypes.func,
};

SectionCards.defaultProps = {
  isLoading: false,
  error: null,
  onCardClick: null,
};
