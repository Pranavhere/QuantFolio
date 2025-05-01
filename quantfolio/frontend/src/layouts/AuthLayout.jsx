import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import { Brightness4 as ThemeIcon } from '@mui/icons-material';

// Import context
import { useTheme } from '../contexts/ThemeContext';

const AuthLayout = () => {
  const { themeName, setTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  
  // Theme menu state
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleThemeMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleThemeMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleThemeChange = (theme) => {
    setTheme(theme);
    setAnchorEl(null);
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      {/* App Bar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            AI Portfolio System
          </Typography>
          
          {/* Theme Switcher */}
          <IconButton
            onClick={handleThemeMenuOpen}
            size="large"
            aria-controls={open ? 'theme-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <ThemeIcon />
          </IconButton>
          <Menu
            id="theme-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleThemeMenuClose}
            MenuListProps={{
              'aria-labelledby': 'theme-button',
            }}
          >
            <MenuItem onClick={() => handleThemeChange('light')} selected={themeName === 'light'}>
              Light
            </MenuItem>
            <MenuItem onClick={() => handleThemeChange('dark')} selected={themeName === 'dark'}>
              Dark
            </MenuItem>
            <MenuItem onClick={() => handleThemeChange('modern')} selected={themeName === 'modern'}>
              Modern
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Main Content */}
      <Container 
        component="main" 
        maxWidth="xs" 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
            Welcome
          </Typography>
          
          {/* Child routes (login/register form) */}
          <Outlet />
          
          {/* Auth toggle */}
          <Box sx={{ mt: 3, width: '100%' }}>
            {window.location.pathname.includes('/login') ? (
              <Stack spacing={1} direction={isMobile ? 'column' : 'row'} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Don't have an account?
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => navigate('/auth/register')}
                >
                  Sign up now
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1} direction={isMobile ? 'column' : 'row'} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Already have an account?
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => navigate('/auth/login')}
                >
                  Log in
                </Typography>
              </Stack>
            )}
          </Box>
        </Paper>
        
        {/* Footer */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} AI Portfolio System. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default AuthLayout; 