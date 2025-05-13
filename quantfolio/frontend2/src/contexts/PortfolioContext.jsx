import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getPortfolios, getPortfolioState, getPortfolioMetrics } from '../lib/api';
import { toast } from 'sonner';

const PortfolioContext = createContext();

export function PortfolioProvider({ children, token }) {
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
    const [portfolioState, setPortfolioState] = useState(null);
    const [portfolioMetrics, setPortfolioMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const clearPortfolioData = useCallback(() => {
        setPortfolioState(null);
        setPortfolioMetrics(null);
        setError(null);
    }, []);

    const fetchPortfolios = useCallback(async () => {
        if (!token) {
            setError('Authentication required');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await getPortfolios();
            console.log('Portfolio API response:', response); // Debug log

            // Check if response exists
            if (!response) {
                throw new Error('No response received from server');
            }

            // Check if response is an array
            if (!Array.isArray(response)) {
                console.error('Invalid response data:', response);
                throw new Error('Invalid portfolio data format');
            }

            setPortfolios(response);
            
            // Select first portfolio if none selected and portfolios exist
            if (response.length > 0 && !selectedPortfolioId) {
                setSelectedPortfolioId(response[0].portfolio_id);
            }

            setIsInitialized(true);
            toast.success('Portfolios loaded successfully');
        } catch (err) {
            console.error('Error fetching portfolios:', err);
            // More detailed error message
            const errorMessage = err.response?.data?.message || 
                               err.message || 
                               'Failed to fetch portfolios. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
            setIsInitialized(false);
        } finally {
            setLoading(false);
        }
    }, [token, selectedPortfolioId]);

    const fetchPortfolioData = useCallback(async (portfolioId) => {
        if (!portfolioId) {
            setError('No portfolio selected');
            return;
        }
        
        if (!token) {
            setError('Authentication required');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const [stateResponse, metricsResponse] = await Promise.all([
                getPortfolioState(portfolioId).catch(err => {
                    console.error('Error fetching portfolio state:', err);
                    throw new Error(err.response?.data?.message || 'Failed to fetch portfolio state');
                }),
                getPortfolioMetrics(portfolioId).catch(err => {
                    console.error('Error fetching portfolio metrics:', err);
                    throw new Error(err.response?.data?.message || 'Failed to fetch portfolio metrics');
                })
            ]);

            // Log responses for debugging
            console.log('Portfolio state response:', stateResponse);
            console.log('Portfolio metrics response:', metricsResponse);

            // Validate responses
            if (!stateResponse) {
                throw new Error('No portfolio state data received');
            }
            if (!metricsResponse) {
                throw new Error('No portfolio metrics data received');
            }

            // Set the data directly since the API functions already return the data
            setPortfolioState(stateResponse);
            setPortfolioMetrics(metricsResponse);
            toast.success('Portfolio data updated');
        } catch (err) {
            console.error('Error in fetchPortfolioData:', err);
            const errorMessage = err.message || 'Failed to fetch portfolio data';
            setError(errorMessage);
            toast.error(errorMessage);
            clearPortfolioData();
        } finally {
            setLoading(false);
        }
    }, [token, clearPortfolioData]);

    const refreshPortfolio = useCallback(async () => {
        if (selectedPortfolioId) {
            await fetchPortfolioData(selectedPortfolioId);
        }
    }, [selectedPortfolioId, fetchPortfolioData]);

    const selectPortfolio = useCallback((portfolioId) => {
        if (!portfolioId) {
            setError('Invalid portfolio ID');
            return;
        }
        setSelectedPortfolioId(portfolioId);
    }, []);

    useEffect(() => {
        if (!isInitialized) {
            fetchPortfolios();
        }
    }, [fetchPortfolios, isInitialized]);

    useEffect(() => {
        if (selectedPortfolioId) {
            fetchPortfolioData(selectedPortfolioId);
        }
    }, [selectedPortfolioId, fetchPortfolioData]);

    const value = {
        portfolios,
        selectedPortfolioId,
        setSelectedPortfolioId: selectPortfolio,
        portfolioState,
        portfolioMetrics,
        loading,
        error,
        fetchPortfolios,
        refreshPortfolio,
        isInitialized,
    };

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
}

PortfolioProvider.propTypes = {
    children: PropTypes.node.isRequired,
    token: PropTypes.string,
};

PortfolioProvider.defaultProps = {
    token: null,
};

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}

export default PortfolioContext;