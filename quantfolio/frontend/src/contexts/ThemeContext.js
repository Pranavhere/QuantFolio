import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import themes
import lightTheme from '../themes/light';
import darkTheme from '../themes/dark';
import modernTheme from '../themes/modern';
import terminalTheme from '../themes/terminal';

// Create context
const ThemeContext = createContext();

// Theme options
const themeOptions = {
  light: lightTheme,
  dark: darkTheme,
  modern: modernTheme,
  terminal: terminalTheme,
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get saved theme from local storage or default to 'terminal'
  const [themeName, setThemeName] = useState(localStorage.getItem('theme') || 'terminal');
  
  // Get current theme object
  const theme = themeOptions[themeName] || themeOptions.terminal;
  
  // Update local storage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);
  
  // Function to toggle between themes
  const toggleTheme = () => {
    const nextTheme = themeName === 'light' ? 'dark' : themeName === 'dark' ? 'modern' : themeName === 'modern' ? 'terminal' : 'light';
    setThemeName(nextTheme);
  };
  
  // Function to set a specific theme
  const setTheme = (name) => {
    if (themeOptions[name]) {
      setThemeName(name);
    }
  };
  
  // Create context value
  const contextValue = {
    themeName,
    theme,
    toggleTheme,
    setTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook for using the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 