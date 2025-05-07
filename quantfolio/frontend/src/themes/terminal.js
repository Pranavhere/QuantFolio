import { createTheme } from '@mui/material/styles';

const terminalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00C805', // Bright green for financial data
      light: '#4EDC5C',
      dark: '#00A500',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FFB800', // Financial gold/amber
      light: '#FFCF4D',
      dark: '#CC9200',
      contrastText: '#000000',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6259',
      dark: '#C62828',
    },
    warning: {
      main: '#FF9500',
      light: '#FFB04D',
      dark: '#CC7700',
    },
    info: {
      main: '#54C7EC',
      light: '#83D7F0',
      dark: '#0195C6',
    },
    success: {
      main: '#00C805',
      light: '#4EDB58',
      dark: '#00A500',
    },
    background: {
      default: '#0F1014',
      paper: '#1C1D22',
      alt: '#2C2D33', // For alternating rows in tables
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
      hint: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: 'rgba(255, 255, 255, 0.8)',
      hover: 'rgba(255, 255, 255, 0.1)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Consolas", monospace',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '0.01em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '0.01em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.9375rem',
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.8125rem',
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.01em',
    },
    overline: {
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1C1D22;
        }
        ::-webkit-scrollbar-thumb {
          background: #494A50;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6E6F75;
        }
        body {
          font-feature-settings: 'tnum' on, 'lnum' on;
        }
      `,
    },
    MuiAppBar: {
      defaultProps: {
        color: 'transparent',
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 16, 20, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F1014',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: '6px 16px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: '1px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#1C1D22',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(44, 45, 51, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        filledPrimary: {
          backgroundColor: '#00C805',
          color: '#000000',
        },
        filledSecondary: {
          backgroundColor: '#FFB800',
          color: '#000000',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 200, 5, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(0, 200, 5, 0.2)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1C1D22',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

export default terminalTheme; 