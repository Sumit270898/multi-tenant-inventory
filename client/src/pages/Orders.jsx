import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export function Orders() {
  const { revisionOrder } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productId, setProductId] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function fetchOrders() {
    setLoadingOrders(true);
    api.get('/api/orders').then((res) => setOrders(res.data)).catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load orders')).finally(() => setLoadingOrders(false));
  }

  useEffect(() => { fetchOrders(); }, [revisionOrder]);
  useEffect(() => {
    api.get('/api/products').then((res) => setProducts(res.data)).catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load products')).finally(() => setLoadingProducts(false));
  }, []);

  const selectedProduct = products.find((p) => p._id === productId);
  const variants = Array.isArray(selectedProduct?.variants) ? selectedProduct.variants : [];
  const selectedVariant = variants.find((v) => v.sku === variantSku);

  useEffect(() => {
    if (!productId) { setVariantSku(''); return; }
    const product = products.find((p) => p._id === productId);
    const list = Array.isArray(product?.variants) ? product.variants : [];
    setVariantSku(list[0]?.sku ?? '');
  }, [productId, products]);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!productId || !variantSku || !selectedVariant || quantity < 1) {
      setError('Select a product, SKU, and enter quantity ≥ 1');
      return;
    }
    setSubmitting(true);
    api.post('/api/orders', { items: [{ productId, variantSku, quantity: Number(quantity), price: selectedVariant.price }] })
      .then((res) => {
        setSuccess(`Order created. Total: ${res.data.totalAmount ?? '—'}`);
        setQuantity(1);
        setProductId('');
        setVariantSku('');
        fetchOrders();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Order failed';
        setError(err.response?.status === 409 ? `Insufficient stock: ${msg}` : msg);
      })
      .finally(() => setSubmitting(false));
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>Orders</Typography>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Order list</Typography>
      {loadingOrders ? (
        <Typography color="text.secondary">Loading orders…</Typography>
      ) : orders.length === 0 ? (
        <Typography color="text.secondary">No orders yet.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items.map((it) => `${it.variantSku} × ${it.quantity}${it.productId?.name ? ` (${it.productId.name})` : ''}`).join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell>{order.totalAmount != null ? order.totalAmount.toLocaleString() : '—'}</TableCell>
                  <TableCell>{order.status ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Create Order</Typography>
      {loadingProducts ? (
        <Typography color="text.secondary">Loading products…</Typography>
      ) : products.length === 0 ? (
        <Typography color="text.secondary">No products. Add products with variants first.</Typography>
      ) : (
        <Paper sx={{ p: 2, maxWidth: 400 }}>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Product</InputLabel>
              <Select value={productId} label="Product" onChange={(e) => { setProductId(e.target.value); setVariantSku(''); }} required>
                <MenuItem value="">Select product</MenuItem>
                {products.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" disabled={!productId}>
              <InputLabel>SKU</InputLabel>
              <Select value={variantSku} label="SKU" onChange={(e) => setVariantSku(e.target.value)} required>
                <MenuItem value="">Select SKU</MenuItem>
                {variants.map((v) => <MenuItem key={v.sku} value={v.sku}>{v.sku} — Stock: {v.stock}, Price: {v.price}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Quantity" type="number" inputProps={{ min: 1 }} value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))} required margin="normal" helperText={selectedVariant ? `Available: ${selectedVariant.stock}` : null} />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            <Button type="submit" variant="contained" fullWidth disabled={submitting} sx={{ mt: 2 }}>{submitting ? 'Creating…' : 'Create Order'}</Button>
          </form>
        </Paper>
      )}
    </Box>
  );
}
