import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { authAPI } from '../api/api';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setLoading(true);
          
          // Always use demo token in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Using demo authentication');
            const mockUser = {
              id: 1,
              full_name: 'Demo User',
              email: 'demo@example.com',
              created_at: new Date().toISOString(),
              stats: {
                portfolios: 3,
                trades: 28,
                watchlist_items: 12
              }
            };
            setUser(mockUser);
            setError(null);
            setLoading(false);
            return;
          }
          
          // Normal authentication flow
          const response = await authAPI.getProfile();
          setUser(response.data.data);
          setError(null);
        } catch (err) {
          console.error('Failed to get user profile:', err);
          setUser(null);
          localStorage.removeItem('token');
          setError('Session expired. Please login again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Always accept login in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Bypassing authentication');
        localStorage.setItem('token', 'demo-token');
        
        // Set mock user data
        const mockUser = {
          id: 1,
          full_name: 'Demo User',
          email: email,
          created_at: new Date().toISOString(),
          stats: {
            portfolios: 3,
            trades: 28,
            watchlist_items: 12
          }
        };
        
        setUser(mockUser);
        return { success: true };
      }
      
      // Real authentication flow
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.data.access_token);
      
      // Get user profile after successful login
      const userResponse = await authAPI.getProfile();
      setUser(userResponse.data.data);
      
      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      
      // Auto login after registration
      if (response.data.success) {
        localStorage.setItem('token', response.data.access_token);
        const userResponse = await authAPI.getProfile();
        setUser(userResponse.data.data);
      }
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Registration failed:', err);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Always remove token and user data
      localStorage.removeItem('token');
      setUser(null);
    }
  };
  
  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
  };
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Create context value
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 