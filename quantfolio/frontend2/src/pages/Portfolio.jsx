import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PortfolioCard from "../components/PortfolioCard";
import { createPortfolio } from '../lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconRefresh } from "@tabler/icons-react";

const Portfolio = () => {
    const { portfolios, fetchPortfolios, loading, error, isInitialized } = usePortfolio();
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreatePortfolio = useCallback(async (e) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) {
            toast.error('Portfolio name is required');
            return;
        }

        if (newPortfolioName.length > 50) {
            toast.error('Portfolio name must be less than 50 characters');
            return;
        }

        setIsCreating(true);
        try {
            await createPortfolio(newPortfolioName.trim());
            setNewPortfolioName('');
            await fetchPortfolios();
            toast.success('Portfolio created successfully');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create portfolio';
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    }, [newPortfolioName, fetchPortfolios]);

    const handleRefresh = useCallback(() => {
        fetchPortfolios();
    }, [fetchPortfolios]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleRefresh();
        }
    }, [handleRefresh]);

    const renderContent = () => {
        if (loading && !isInitialized) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading portfolios">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
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
                            aria-label="Retry loading portfolios"
                        >
                            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (!isInitialized || portfolios.length === 0) {
            return (
                <Alert variant="default" role="status">
                    <AlertDescription>
                        No portfolios found. Create one to get started.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolios.map((portfolio) => (
                    <PortfolioCard 
                        key={portfolio.portfolio_id} 
                        portfolio={portfolio}
                        isLoading={loading}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Portfolios</h1>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    aria-label="Refresh portfolios"
                >
                    <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Portfolio</CardTitle>
                    <CardDescription>
                        Create a new portfolio to start tracking your investments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreatePortfolio} className="flex space-x-2">
                        <Input
                            placeholder="Enter portfolio name"
                            value={newPortfolioName}
                            onChange={(e) => setNewPortfolioName(e.target.value)}
                            disabled={isCreating}
                            maxLength={50}
                            aria-label="Portfolio name"
                            required
                        />
                        <Button 
                            type="submit" 
                            disabled={isCreating || !newPortfolioName.trim()}
                            aria-label={isCreating ? 'Creating portfolio...' : 'Create portfolio'}
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            {renderContent()}
        </div>
    );
};

export default Portfolio;