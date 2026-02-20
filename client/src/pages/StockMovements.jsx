import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import api from '../api/axios';

const DAYS_OPTIONS = [7, 14, 30, 60];

export function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/api/dashboard/stock-movements', { params: { days } }).then((res) => setMovements(res.data)).catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load stock movements')).finally(() => setLoading(false));
  }, [days]);

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Stock Movements</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Period</InputLabel>
          <Select value={days} label="Period" onChange={(e) => setDays(Number(e.target.value))}>
            {DAYS_OPTIONS.map((n) => <MenuItem key={n} value={n}>Last {n} days</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : movements.length === 0 ? (
        <Typography color="text.secondary">No stock movements in this period.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                  <TableCell>{m.productId?.name ?? '—'}</TableCell>
                  <TableCell>{m.variantSku ?? '—'}</TableCell>
                  <TableCell sx={{ color: m.type === 'IN' ? 'success.main' : m.type === 'OUT' ? 'error.main' : undefined }}>{m.type}</TableCell>
                  <TableCell>{m.quantity != null ? (m.quantity >= 0 ? `+${m.quantity}` : m.quantity) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
