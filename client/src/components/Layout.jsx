import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory2 as ProductsIcon,
  ShoppingCart as OrdersIcon,
  SwapHoriz as StockIcon,
  LocalShipping as SuppliersIcon,
  Assignment as POIcon,
  People as UsersIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

const navLinksBase = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/products', label: 'Products', icon: <ProductsIcon /> },
  { to: '/orders', label: 'Orders', icon: <OrdersIcon /> },
  { to: '/stock-movements', label: 'Stock Movements', icon: <StockIcon /> },
  { to: '/suppliers', label: 'Suppliers', icon: <SuppliersIcon /> },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: <POIcon /> },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    ...navLinksBase,
    ...(user?.role === 'OWNER' ? [{ to: '/users', label: 'Team (Users)', icon: <UsersIcon /> }] : []),
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="span" sx={{ flexGrow: 1 }}>
            Multi-tenant Inventory
          </Typography>
          {user?.name && (
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
              {user.name}
            </Typography>
          )}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: 64,
            pt: 2,
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ px: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          Inventory
        </Typography>
        <List sx={{ px: 1, pt: 1 }}>
          {navLinks.map(({ to, label, icon }) => (
            <ListItemButton
              key={to}
              selected={location.pathname === to}
              onClick={() => navigate(to)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          ml: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
