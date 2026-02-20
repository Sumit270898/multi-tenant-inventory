import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50' },
    secondary: { main: '#81c784' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255,255,255,0.12)',
        },
      },
    },
  },
});
