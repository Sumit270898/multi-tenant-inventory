import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['OWNER', 'MANAGER', 'STAFF'];

export function Users() {
  const { user: currentUser } = useAuth();

  if (currentUser?.role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function fetchUsers() {
    setLoading(true);
    setError('');
    api
      .get('/api/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openAdd() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('STAFF');
    setShowForm(true);
  }

  function openEdit(u) {
    setEditingId(u._id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('STAFF');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = { name: name.trim(), email: email.trim(), role };
    if (editingId) {
      if (password.trim()) payload.password = password.trim();
      api
        .put(`/api/users/${editingId}`, payload)
        .then((res) => {
          setUsers((prev) => prev.map((u) => (u._id === res.data._id ? res.data : u)));
          closeForm();
        })
        .catch((err) => setError(err.response?.data?.message || err.message || 'Update failed'))
        .finally(() => setSubmitting(false));
    } else {
      if (!password.trim()) {
        setError('Password is required for new users');
        setSubmitting(false);
        return;
      }
      payload.password = password.trim();
      api
        .post('/api/users', payload)
        .then((res) => {
          setUsers((prev) => [res.data, ...prev]);
          closeForm();
        })
        .catch((err) => setError(err.response?.data?.message || err.message || 'Create failed'))
        .finally(() => setSubmitting(false));
    }
  }

  function handleDelete(id) {
    setSubmitting(true);
    setError('');
    api
      .delete(`/api/users/${id}`)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        setDeleteConfirm(null);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Delete failed'))
      .finally(() => setSubmitting(false));
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Team (Users)
        </Typography>
        <Button variant="contained" onClick={openAdd}>
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showForm && (
        <Paper sx={{ p: 2, mb: 2, maxWidth: 400 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {editingId ? 'Edit User' : 'Add User'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} required margin="normal" />
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required margin="normal" />
            <TextField fullWidth label={editingId ? 'New password (leave blank to keep)' : 'Password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" autoComplete="new-password" />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button type="button" variant="outlined" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </Button>
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
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    No users yet.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(u)} sx={{ mr: 1 }}>
                        Edit
                      </Button>
                      {u._id !== currentUser?.id && (
                        deleteConfirm === u._id ? (
                          <>
                            <Button size="small" color="error" onClick={() => handleDelete(u._id)} disabled={submitting}>
                              Confirm
                            </Button>
                            <Button size="small" onClick={() => setDeleteConfirm(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button size="small" color="error" onClick={() => setDeleteConfirm(u._id)}>
                            Delete
                          </Button>
                        )
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
