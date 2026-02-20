import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SocketProvider>
      <AppRoutes />
    </SocketProvider>
  );
}

export default App;
