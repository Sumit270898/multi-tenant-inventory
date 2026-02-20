import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import api from '../api/axios';
import { ProductForm } from '../components/ProductForm';
import { useSocket } from '../context/SocketContext';

const emptyForm = { name: '', description: '', variants: [] };

export function Products() {
  const { revisionStock } = useSocket();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function fetchProducts() {
    setLoading(true);
    setError('');
    api
      .get('/api/products')
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProducts();
  }, [revisionStock]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      variants: Array.isArray(product.variants) ? product.variants : [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleFormSubmit(formData) {
    setSubmitting(true);
    setError('');
    const promise = editingId
      ? api.put(`/api/products/${editingId}`, formData)
      : api.post('/api/products', formData);
    promise
      .then((res) => {
        if (editingId) {
          setProducts((prev) => prev.map((p) => (p._id === res.data._id ? res.data : p)));
        } else {
          setProducts((prev) => [res.data, ...prev]);
        }
        closeForm();
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Request failed'))
      .finally(() => setSubmitting(false));
  }

  function handleDelete(id) {
    setSubmitting(true);
    setError('');
    api
      .delete(`/api/products/${id}`)
      .then(() => {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setDeleteConfirm(null);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Delete failed'))
      .finally(() => setSubmitting(false));
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Products</Typography>
        <Button variant="contained" onClick={openAdd}>Add Product</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {editingId ? 'Edit Product' : 'Add Product'}
          </Typography>
          <ProductForm
            initialValues={form}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
            submitLabel={submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
            disabled={submitting}
          />
        </Paper>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading products…</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Variants</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    No products yet. Click “Add Product” to create one.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.description || '—'}</TableCell>
                    <TableCell>{Array.isArray(p.variants) ? p.variants.length : 0}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(p)} sx={{ mr: 1 }}>Edit</Button>
                      {deleteConfirm === p._id ? (
                        <>
                          <Typography component="span" variant="body2" sx={{ mr: 1 }}>Delete?</Typography>
                          <Button size="small" color="error" onClick={() => handleDelete(p._id)} disabled={submitting}>Yes</Button>
                          <Button size="small" onClick={() => setDeleteConfirm(null)}>No</Button>
                        </>
                      ) : (
                        <Button size="small" color="error" onClick={() => setDeleteConfirm(p._id)}>Delete</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
