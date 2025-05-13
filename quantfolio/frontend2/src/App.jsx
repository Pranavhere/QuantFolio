import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconRefresh } from "@tabler/icons-react";
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Market from './pages/Market';
import Trading from './pages/Trading';
import SymbolDetails from './pages/SymbolDetails';

  function PrivateRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading authentication state">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
    return isAuthenticated ? children : <Navigate to="/login" />;
  }

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Route error:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" role="alert">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription className="flex flex-col items-center gap-4">
            <p>Something went wrong. Please try refreshing the page.</p>
            {error && (
              <p className="text-sm text-muted-foreground">
                Error: {error.message}
              </p>
            )}
            <Button
              variant="outline"
              onClick={handleRetry}
              aria-label="Retry loading page"
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

function AppContent() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (isAuthPage) {
        return (
      <main className="flex min-h-screen items-center justify-center bg-background" role="main">
        <ErrorBoundary>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
        </ErrorBoundary>
            </main>
        );
    }

    return (
        <PortfolioProvider token={localStorage.getItem('token')}>
            <SidebarProvider>
                <div className="flex h-screen">
                    <AppSidebar />
          <main className="flex-1 overflow-y-auto" role="main">
            <ErrorBoundary>
                        <Routes>
                            <Route
                                path="/dashboard"
                                element={
                                    <PrivateRoute>
                                        <Dashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/dashboard/:portfolioId"
                                element={
                                    <PrivateRoute>
                                        <Dashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/portfolio"
                                element={
                                    <PrivateRoute>
                                        <Portfolio />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/market"
                                element={
                                    <PrivateRoute>
                                        <Market />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/trading"
                                element={
                                    <PrivateRoute>
                                        <Trading />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/symbol/:symbol"
                                element={
                                    <PrivateRoute>
                                        <SymbolDetails />
                                    </PrivateRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/dashboard" />} />
                            <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
            </ErrorBoundary>
                    </main>
                </div>
            </SidebarProvider>
        </PortfolioProvider>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;