import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';

// Import theme provider
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Import routes
import routes from './routes';

// Router component
const Router = () => {
  const routing = useRoutes(routes);
  return routing;
};

// Main App component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 