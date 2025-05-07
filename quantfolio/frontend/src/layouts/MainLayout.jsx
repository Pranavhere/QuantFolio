import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  Chip,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  SwapHoriz as TradingIcon,
  ShowChart as AnalyticsIcon,
  TrendingUp as MarketIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Brightness4 as ThemeIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Import contexts
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { dataAPI } from '../api/api';

// Drawer width
const drawerWidth = 260;

// Navigation items
const mainNavItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Portfolios', icon: <PortfolioIcon />, path: '/portfolios' },
  { text: 'Trading', icon: <TradingIcon />, path: '/trading' },
  { text: 'Market', icon: <MarketIcon />, path: '/market' },
];

const secondaryNavItems = [
  { text: 'Order History', icon: <HistoryIcon />, path: '/orders' },
  { text: 'Trade History', icon: <HistoryIcon />, path: '/trades' },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { themeName, toggleTheme, setTheme } = useTheme();
  
  // State for market ticker data
  const [tickerData, setTickerData] = useState([]);
  const [loadingTicker, setLoadingTicker] = useState(true);
  
  // Fetch ticker data
  useEffect(() => {
    const fetchTickerData = async () => {
      setLoadingTicker(true);
      try {
        // Try to fetch all NSE500 stocks from the API
        const response = await dataAPI.getStocks();
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          // Process and set all NSE500 stocks
          const nseData = response.data.data.map(stock => ({
            symbol: stock.symbol,
            price: stock.price || stock.close,
            change: stock.change_percent
          }));
          
          if (nseData.length > 0) {
            setTickerData(nseData);
          } else {
            // Fallback to default data for the major indices
            setTickerData([
              { symbol: 'NIFTY 50', price: 22450.25, change: +0.56 },
              { symbol: 'SENSEX', price: 73765.35, change: +0.55 },
              { symbol: 'NIFTY BANK', price: 48752.60, change: -0.11 },
              { symbol: 'RELIANCE', price: 2873.75, change: +1.61 },
              { symbol: 'TCS', price: 3742.30, change: +1.71 },
              { symbol: 'HDFCBANK', price: 1625.40, change: -0.53 },
              { symbol: 'INFY', price: 1538.25, change: +1.87 },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching ticker data:', error);
        // Fallback to default data on error
        setTickerData([
          { symbol: 'NIFTY 50', price: 22450.25, change: +0.56 },
          { symbol: 'SENSEX', price: 73765.35, change: +0.55 },
          { symbol: 'NIFTY BANK', price: 48752.60, change: -0.11 },
          { symbol: 'RELIANCE', price: 2873.75, change: +1.61 },
          { symbol: 'TCS', price: 3742.30, change: +1.71 },
          { symbol: 'HDFCBANK', price: 1625.40, change: -0.53 },
          { symbol: 'INFY', price: 1538.25, change: +1.87 },
        ]);
      } finally {
        setLoadingTicker(false);
      }
    };
    
    fetchTickerData();
    
    // Refresh ticker data every 5 minutes
    const intervalId = setInterval(fetchTickerData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // State for responsive drawer
  const isMobile = useMediaQuery('(max-width:1024px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // State for theme menu
  const [themeAnchorEl, setThemeAnchorEl] = useState(null);
  const themeMenuOpen = Boolean(themeAnchorEl);
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle theme menu
  const handleThemeMenuOpen = (event) => {
    setThemeAnchorEl(event.currentTarget);
  };
  
  const handleThemeMenuClose = () => {
    setThemeAnchorEl(null);
  };
  
  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    setTheme(theme);
    setThemeAnchorEl(null);
  };
  
  // Format date for header
  const formatDate = () => {
    const date = new Date();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Format time for header
  const formatTime = () => {
    const date = new Date();
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).format(date);
  };
  
  // Drawer content
  const drawer = (
    <div>
      <Toolbar sx={{ 
        justifyContent: 'center', 
        backgroundColor: 'background.default', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          QuantFolio
        </Typography>
      </Toolbar>
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          {user?.full_name ? user.full_name.charAt(0) : 'U'}
        </Avatar>
        <Box sx={{ ml: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {user?.full_name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
          MAIN NAVIGATION
        </Typography>
        <List sx={{ mt: 1 }}>
          {mainNavItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
                onClick={() => handleNavigation(item.path)}
                sx={{ 
                  borderRadius: '4px',
                  '&.Mui-selected': {
                    bgcolor: 'background.alt',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    pl: 1.7,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40, 
                  color: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) 
                    ? 'primary.main' 
                    : 'inherit' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem', 
                    fontWeight: (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ? 600 : 500
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
          HISTORY
        </Typography>
        <List sx={{ mt: 1 }}>
          {secondaryNavItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{ 
                  borderRadius: '4px',
                  '&.Mui-selected': {
                    bgcolor: 'background.alt',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    pl: 1.7,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: location.pathname === item.path ? 'primary.main' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: location.pathname === item.path ? 600 : 500
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {formatDate()} | {formatTime()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          v 1.0.0 | © 2023 QuantFolio
        </Typography>
      </Box>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '64px', md: '72px' } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Market ticker - Auto sliding animation */}
          <Tooltip title="Hover to pause the ticker, click on a stock to view details" placement="bottom-start">
            <Box sx={{ 
              display: { xs: 'none', md: 'block' }, 
              overflow: 'hidden',
              width: '100%',
              mr: 2,
              position: 'relative',
              height: '32px',
              backgroundColor: 'background.alt',
              borderRadius: 1,
            }}>
              {loadingTicker ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="caption" color="text.secondary">Loading market data...</Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    position: 'absolute',
                    animation: `scrollTicker ${Math.min(300, Math.max(60, tickerData.length * 0.6))}s linear infinite`,
                    '@keyframes scrollTicker': {
                      '0%': { transform: 'translateX(100%)' },
                      '100%': { transform: 'translateX(-300%)' }
                    },
                    '&:hover': {
                      animationPlayState: 'paused'
                    },
                    whiteSpace: 'nowrap',
                    pl: 2,
                    height: '100%',
                    alignItems: 'center',
                  }}
                >
                  {tickerData.map((item, index) => (
                    <React.Fragment key={`${item.symbol}-${index}`}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', mr: 3, cursor: 'pointer' }}
                           onClick={() => navigate(`/market/stocks/${item.symbol}`)}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                          {item.symbol}
                        </Typography>
                        <Typography variant="body2">
                          {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            ml: 0.5, 
                            color: item.change >= 0 ? 'success.main' : 'error.main',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {item.change >= 0 ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                          {Math.abs(item.change).toFixed(2)}%
                        </Typography>
                      </Box>
                      {/* Add a separator except for the last item */}
                      {index < tickerData.length - 1 && (
                        <Box component="span" sx={{ 
                          display: 'inline-block', 
                          width: '4px', 
                          height: '4px', 
                          borderRadius: '50%', 
                          bgcolor: 'text.disabled',
                          mr: 3
                        }} />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </Box>
          </Tooltip>
          
          {/* Search */}
          <Tooltip title="Search">
            <IconButton color="inherit" sx={{ mr: 2 }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          
          {/* Notification Icon */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 2 }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Theme Toggle */}
          <Tooltip title="Change Theme">
            <IconButton
              color="inherit"
              onClick={handleThemeMenuOpen}
              aria-controls={themeMenuOpen ? 'theme-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={themeMenuOpen ? 'true' : undefined}
              sx={{ mr: 2 }}
            >
              <ThemeIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id="theme-menu"
            anchorEl={themeAnchorEl}
            open={themeMenuOpen}
            onClose={handleThemeMenuClose}
            MenuListProps={{
              'aria-labelledby': 'theme-button',
            }}
          >
            <MenuItem onClick={() => handleThemeChange('terminal')} selected={themeName === 'terminal'}>
              Terminal
            </MenuItem>
            <MenuItem onClick={() => handleThemeChange('dark')} selected={themeName === 'dark'}>
              Dark
            </MenuItem>
            <MenuItem onClick={() => handleThemeChange('light')} selected={themeName === 'light'}>
              Light
            </MenuItem>
            <MenuItem onClick={() => handleThemeChange('modern')} selected={themeName === 'modern'}>
              Modern
            </MenuItem>
          </Menu>
          
          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            MenuListProps={{
              'aria-labelledby': 'account-button',
            }}
          >
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
        
        {/* Location bar */}
        <Box sx={{ 
          py: 0.75, 
          px: 2, 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.alt',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {mainNavItems.find((item) => 
              location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.text || 'Dashboard'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate()} | {formatTime()}
          </Typography>
        </Box>
      </AppBar>
      
      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: { xs: 10, sm: 10 },
        }}
      >
        <Outlet /> {/* Render child routes */}
      </Box>
    </Box>
  );
};

export default MainLayout; 