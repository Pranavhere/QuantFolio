import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
      <App />
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
          theme="light"
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
