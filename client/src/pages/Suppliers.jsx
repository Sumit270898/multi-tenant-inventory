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
} from '@mui/material';
import api from '../api/axios';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function fetchSuppliers() {
    setLoading(true);
    setError('');
    api.get('/api/suppliers').then((res) => setSuppliers(res.data)).catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load suppliers')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchSuppliers(); }, []);

  function openAdd() {
    setEditingId(null);
    setName('');
    setContact('');
    setShowForm(true);
  }

  function openEdit(s) {
    setEditingId(s._id);
    setName(s.name);
    setContact(s.contact ?? '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setContact('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const promise = editingId ? api.put(`/api/suppliers/${editingId}`, { name: name.trim(), contact: contact.trim() }) : api.post('/api/suppliers', { name: name.trim(), contact: contact.trim() });
    promise.then((res) => {
      if (editingId) setSuppliers((prev) => prev.map((s) => (s._id === res.data._id ? res.data : s)));
      else setSuppliers((prev) => [res.data, ...prev]);
      closeForm();
    }).catch((err) => setError(err.response?.data?.message || err.message || 'Request failed')).finally(() => setSubmitting(false));
  }

  function handleDelete(id) {
    setSubmitting(true);
    setError('');
    api.delete(`/api/suppliers/${id}`).then(() => { setSuppliers((prev) => prev.filter((s) => s._id !== id)); setDeleteConfirm(null); }).catch((err) => setError(err.response?.data?.message || err.message || 'Delete failed')).finally(() => setSubmitting(false));
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Suppliers</Typography>
        <Button variant="contained" onClick={openAdd}>Add Supplier</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {showForm && (
        <Paper sx={{ p: 2, mb: 2, maxWidth: 400 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{editingId ? 'Edit Supplier' : 'Add Supplier'}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required margin="normal" />
            <TextField fullWidth label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} margin="normal" />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button type="button" variant="outlined" onClick={closeForm}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}</Button>
            </Box>
          </form>
        </Paper>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>No suppliers yet.</TableCell>
                </TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.contact || '—'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(s)} sx={{ mr: 1 }}>Edit</Button>
                      {deleteConfirm === s._id ? (
                        <>
                          <Typography component="span" variant="body2" sx={{ mr: 1 }}>Delete?</Typography>
                          <Button size="small" color="error" onClick={() => handleDelete(s._id)} disabled={submitting}>Yes</Button>
                          <Button size="small" onClick={() => setDeleteConfirm(null)}>No</Button>
                        </>
                      ) : (
                        <Button size="small" color="error" onClick={() => setDeleteConfirm(s._id)}>Delete</Button>
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
