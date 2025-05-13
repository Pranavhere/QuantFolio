import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePortfolio } from '../contexts/PortfolioContext';
import { SiteHeader } from "@/components/site-header";
import PortfolioSummary from "../components/PortfolioSummary";
import PortfolioChart from "../components/PortfolioChart";
import RecentActivity from "../components/RecentActivity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconRefresh } from "@tabler/icons-react";

const Dashboard = () => {
    const { 
        portfolios, 
        selectedPortfolioId, 
        setSelectedPortfolioId, 
        portfolioState, 
        portfolioMetrics, 
        loading, 
        error,
        refreshPortfolio,
        isInitialized
    } = usePortfolio();

    const handlePortfolioChange = useCallback((value) => {
        if (value) {
            setSelectedPortfolioId(value);
        }
    }, [setSelectedPortfolioId]);

    const handleRefresh = useCallback(() => {
        refreshPortfolio();
    }, [refreshPortfolio]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    const renderContent = () => {
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
                            aria-label="Retry loading dashboard data"
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (!isInitialized) {
            return (
                <div className="space-y-4" role="status" aria-label="Loading dashboard data">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            );
        }

        if (portfolios.length === 0) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        No portfolios found. Create a new one in the Portfolios tab.
                    </AlertDescription>
                </Alert>
            );
        }

        if (loading) {
            return (
                <div className="space-y-4" role="status" aria-label="Loading portfolio data">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            );
        }

        if (!portfolioState || !portfolioMetrics) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        Loading portfolio data...
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="space-y-6">
                <PortfolioSummary 
                    metrics={portfolioMetrics} 
                    totalValue={portfolioState.totalValue} 
                />
                <PortfolioChart 
                    timestamps={portfolioMetrics.timestamps} 
                    values={portfolioMetrics.portfolioValues} 
                />
                <RecentActivity 
                    transactions={portfolioState.transactions} 
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <div className="flex items-center gap-4">
                            {portfolios.length > 0 && (
                                <Select 
                                    onValueChange={handlePortfolioChange} 
                                    value={selectedPortfolioId}
                                    disabled={loading}
                                >
                                    <SelectTrigger className="w-[200px]" aria-label="Select portfolio">
                                        <SelectValue placeholder="Select portfolio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {portfolios.map((portfolio) => (
                                            <SelectItem 
                                                key={portfolio.portfolio_id} 
                                                value={portfolio.portfolio_id}
                                            >
                                                {portfolio.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                aria-label="Refresh dashboard data"
                            >
                                <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;