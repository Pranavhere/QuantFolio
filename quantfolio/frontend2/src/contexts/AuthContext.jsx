import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../lib/api';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Validate token and get user data
  const validateToken = useCallback(async (token) => {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await api.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message);
      return null;
    }
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          // Validate token with backend
          const validUserData = await validateToken(token);
          
          if (validUserData) {
            setIsAuthenticated(true);
            setUser(validUserData);
            toast.success('Successfully authenticated');
          } else {
            clearAuthData();
            toast.error('Session expired. Please login again.');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
        toast.error('Authentication failed. Please login again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [validateToken, clearAuthData]);

  const login = useCallback(async (token, userData) => {
    try {
      if (!token || !userData) {
        throw new Error('Invalid login data');
      }

      // Validate token with backend
      const validUserData = await validateToken(token);
      
      if (validUserData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(validUserData));
        setIsAuthenticated(true);
        setUser(validUserData);
        setError(null);
        toast.success('Successfully logged in');
        return true;
      }
      
      toast.error('Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message);
      toast.error('Login failed. Please try again.');
      return false;
    }
  }, [validateToken]);

  const logout = useCallback(() => {
    clearAuthData();
    toast.success('Successfully logged out');
  }, [clearAuthData]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading authentication state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext; 