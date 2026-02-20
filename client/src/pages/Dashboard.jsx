import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export function Dashboard() {
  const { revisionStock, revisionOrder } = useSocket();
  const [inventoryValue, setInventoryValue] = useState(null);
  const [lowStock, setLowStock] = useState({ items: [], threshold: 10 });
  const [topSellers, setTopSellers] = useState({ items: [], days: 30 });
  const [movement, setMovement] = useState({ byDay: [], days: 7 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/api/dashboard/inventory-value'),
      api.get('/api/dashboard/low-stock'),
      api.get('/api/dashboard/top-sellers'),
      api.get('/api/dashboard/stock-movement'),
    ])
      .then(([v, l, t, m]) => {
        setInventoryValue(v.data.totalValue ?? 0);
        setLowStock(l.data);
        setTopSellers(t.data);
        setMovement(m.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [revisionStock, revisionOrder]);

  if (loading) return <LinearProgress sx={{ mx: -3, mt: -3, mb: 2 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const byDate = (movement.byDay || []).reduce((acc, row) => {
    const d = row.date;
    if (!acc[d]) acc[d] = { IN: 0, OUT: 0 };
    const q = Math.abs(row.totalQuantity || 0);
    if (row.type === 'IN') acc[d].IN += q;
    else acc[d].OUT += q;
    return acc;
  }, {});
  const chartData = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, ...v }));

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Inventory Value
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {typeof inventoryValue === 'number' ? inventoryValue.toLocaleString() : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Low Stock Items
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {lowStock.items?.length ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              below {lowStock.threshold ?? 10} units
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Low Stock
            </Typography>
            <List dense>
              {(lowStock.items || []).length === 0 ? (
                <ListItem><ListItemText primary="None" secondary="All variants above threshold" /></ListItem>
              ) : (
                (lowStock.items || []).slice(0, 10).map((item, i) => (
                  <ListItem key={i}>
                    <ListItemText
                      primary={`${item.productName} — ${item.sku}`}
                      secondary={`Stock: ${item.stock}`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Top 5 Sellers (last {topSellers.days ?? 30} days)
            </Typography>
            <List dense>
              {(topSellers.items || []).length === 0 ? (
                <ListItem><ListItemText primary="No sales" /></ListItem>
              ) : (
                (topSellers.items || []).map((item, i) => (
                  <ListItem key={i}>
                    <ListItemText
                      primary={`${item.productName} — ${item.variantSku}`}
                      secondary={`${item.quantitySold} sold`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {chartData.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Stock movement (last {movement.days ?? 7} days)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Chip label="IN" size="small" color="success" sx={{ width: 48 }} />
            <Chip label="OUT" size="small" color="error" sx={{ width: 56 }} />
          </Box>
          {chartData.map((d) => (
            <Box key={d.date} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ width: 100 }} color="text.secondary">
                {d.date}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', height: 24, borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${d.IN + d.OUT > 0 ? (d.IN / (d.IN + d.OUT)) * 100 : 0}%`,
                    bgcolor: 'success.main',
                  }}
                />
                <Box
                  sx={{
                    width: `${d.IN + d.OUT > 0 ? (d.OUT / (d.IN + d.OUT)) * 100 : 0}%`,
                    bgcolor: 'error.main',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
