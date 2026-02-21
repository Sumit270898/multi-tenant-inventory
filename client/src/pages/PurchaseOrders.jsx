import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, Card, CardContent } from '@mui/material';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const emptyItem = () => ({ productId: '', sku: '', quantityOrdered: 1, price: 0 });

const canManagePOs = (role) => role === 'OWNER' || role === 'MANAGER';

export function PurchaseOrders() {
  const { user } = useAuth();
  const { revisionStock } = useSocket();
  const canCreateOrReceive = canManagePOs(user?.role);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [receivingId, setReceivingId] = useState(null);

  function fetchOrders() {
    setLoadingOrders(true);
    api
      .get('/api/purchase-orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load purchase orders'))
      .finally(() => setLoadingOrders(false));
  }

  useEffect(() => {
    fetchOrders();
  }, [revisionStock]);

  useEffect(() => {
    Promise.all([api.get('/api/suppliers'), api.get('/api/products')])
      .then(([s, p]) => {
        setSuppliers(s.data);
        setProducts(p.data);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load options'))
      .finally(() => setLoadingOptions(false));
  }, []);

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function updateItem(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) => (prev.length <= 1 ? [emptyItem()] : prev.filter((_, i) => i !== index)));
  }

  function openCreateForm() {
    setSupplierId('');
    setItems([emptyItem()]);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validItems = items
      .filter((it) => it.productId && it.sku && it.quantityOrdered >= 1)
      .map((it) => ({
        productId: it.productId,
        sku: it.sku,
        quantityOrdered: Number(it.quantityOrdered),
        price: Number(it.price) || 0,
      }));
    if (!supplierId || validItems.length === 0) {
      setError('Select a supplier and add at least one product with quantity.');
      return;
    }
    setSubmitting(true);
    api
      .post('/api/purchase-orders', { supplierId, items: validItems })
      .then(() => {
        setSuccess('Purchase order created.');
        fetchOrders();
        closeForm();
      })
      .catch((err) => {
        setSuccess('');
        setError(err.response?.data?.message || err.message || 'Create failed');
      })
      .finally(() => setSubmitting(false));
  }

  function handleMarkReceived(poId) {
    setError('');
    setReceivingId(poId);
    api
      .patch(`/api/purchase-orders/${poId}/receive`)
      .then((res) => {
        setOrders((prev) => prev.map((p) => (p._id === res.data._id ? res.data : p)));
        setSuccess('Marked as RECEIVED. Stock updated.');
      })
      .catch((err) => {
        setSuccess('');
        setError(err.response?.data?.message || err.message || 'Receive failed');
      })
      .finally(() => setReceivingId(null));
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Purchase Orders</Typography>
        {canCreateOrReceive && (
          <Button variant="contained" onClick={openCreateForm}>Create Purchase Order</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Create Purchase Order</Typography>
          <form onSubmit={handleCreateSubmit}>
          {loadingOptions ? (
            <Typography color="text.secondary">Loading suppliers and products…</Typography>
          ) : (
            <>
          <Box sx={{ mb: 2 }}>
            <label htmlFor="po-supplier" style={styles.label}>Supplier</label>
            <select
              id="po-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              style={styles.select}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </Box>
          <div style={styles.itemsSection}>
            <div style={styles.itemsHeader}>
              <span style={styles.itemsTitle}>Products</span>
              <button type="button" onClick={addItem} style={styles.addBtn}>Add product</button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>SKU</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <ItemRow
                      key={i}
                      item={it}
                      products={products}
                      onChange={(field, value) => updateItem(i, field, value)}
                      onRemove={() => removeItem(i)}
                      canRemove={items.length > 1}
                      styles={styles}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.formActions}>
            <button type="button" onClick={closeForm} style={styles.secondaryBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={styles.primaryBtn}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
            </>
          )}
        </form>
        </Paper>
      )}

      {loadingOrders ? (
        <p style={styles.muted}>Loading purchase orders…</p>
      ) : (
        <div style={styles.list}>
          {orders.length === 0 ? (
            <p style={styles.muted}>No purchase orders. Create one above.</p>
          ) : (
            orders.map((po) => (
              <div key={po._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>
                    PO — {po.supplierId?.name ?? po.supplierId ?? 'Supplier'}
                  </span>
                  <span style={{ ...styles.badge, ...(po.status === 'RECEIVED' ? styles.badgeReceived : {}) }}>
                    {po.status}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  {Array.isArray(po.items) && po.items.length > 0 && (
                    <ul style={styles.itemList}>
                      {po.items.map((it, i) => (
                        <li key={i} style={styles.itemLi}>
                          SKU {it.sku}: {it.quantityOrdered} ordered
                          {po.status === 'RECEIVED' && ` (${it.quantityReceived ?? it.quantityOrdered} received)`}
                        </li>
                      ))}
                    </ul>
                  )}
                  {po.status !== 'RECEIVED' && canCreateOrReceive && (
                    <button
                      type="button"
                      onClick={() => handleMarkReceived(po._id)}
                      disabled={receivingId === po._id}
                      style={styles.receiveBtn}
                    >
                      {receivingId === po._id ? 'Updating…' : 'Mark as RECEIVED'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Box>
  );
}

function ItemRow({ item, products, onChange, onRemove, canRemove, styles }) {
  const product = products.find((p) => p._id === item.productId);
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  return (
    <tr>
      <td style={styles.td}>
        <select
          value={item.productId}
          onChange={(e) => {
            onChange('productId', e.target.value);
            onChange('sku', '');
            const p = products.find((x) => x._id === e.target.value);
            const v = Array.isArray(p?.variants) ? p.variants[0] : null;
            if (v) {
              onChange('sku', v.sku);
              onChange('price', v.price ?? 0);
            }
          }}
          required
          style={styles.select}
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </td>
      <td style={styles.td}>
        <select
          value={item.sku}
          onChange={(e) => {
            const v = variants.find((x) => x.sku === e.target.value);
            onChange('sku', e.target.value);
            if (v) onChange('price', v.price ?? 0);
          }}
          required
          disabled={!item.productId}
          style={styles.select}
        >
          <option value="">SKU</option>
          {variants.map((v) => (
            <option key={v.sku} value={v.sku}>{v.sku}</option>
          ))}
        </select>
      </td>
      <td style={styles.td}>
        <input
          type="number"
          min={1}
          value={item.quantityOrdered}
          onChange={(e) => onChange('quantityOrdered', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))}
          required
          style={styles.input}
        />
      </td>
      <td style={styles.td}>
        <input
          type="number"
          min={0}
          step={0.01}
          value={item.price}
          onChange={(e) => onChange('price', e.target.value === '' ? '' : Number(e.target.value))}
          style={styles.input}
        />
      </td>
      <td style={styles.td}>
        {canRemove && (
          <button type="button" onClick={onRemove} style={styles.removeBtn}>Remove</button>
        )}
      </td>
    </tr>
  );
}

const styles = {
  page: { maxWidth: 900 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, fontSize: '1.5rem' },
  primaryBtn: { padding: '8px 16px', backgroundColor: '#2d7d46', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  secondaryBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#e4e6eb', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  error: { padding: 12, marginBottom: 16, backgroundColor: 'rgba(180,50,50,0.2)', color: '#f88', borderRadius: 4 },
  success: { padding: 12, marginBottom: 16, backgroundColor: 'rgba(40,120,60,0.2)', color: '#8f8', borderRadius: 4 },
  form: { padding: 20, marginBottom: 24, backgroundColor: '#242628', borderRadius: 8 },
  formTitle: { margin: '0 0 16px', fontSize: '1rem' },
  field: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 4, fontSize: 13, color: '#b0b3b8' },
  select: { width: '100%', padding: 8, backgroundColor: '#1a1d21', border: '1px solid #444', borderRadius: 4, color: '#e4e6eb', fontSize: 14, boxSizing: 'border-box' },
  input: { width: '100%', padding: 8, backgroundColor: '#1a1d21', border: '1px solid #444', borderRadius: 4, color: '#e4e6eb', fontSize: 14, boxSizing: 'border-box' },
  itemsSection: { marginTop: 20, marginBottom: 20 },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemsTitle: { fontSize: 14, fontWeight: 600 },
  addBtn: { padding: '6px 12px', backgroundColor: '#2d7d46', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #333', fontWeight: 600, fontSize: 12 },
  td: { padding: '8px 10px', borderBottom: '1px solid #2a2a2a', fontSize: 14 },
  removeBtn: { padding: '4px 8px', backgroundColor: 'transparent', color: '#b0b3b8', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  formActions: { display: 'flex', gap: 12, marginTop: 16 },
  muted: { color: '#888' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { padding: 16, backgroundColor: '#242628', borderRadius: 8, border: '1px solid #333' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontWeight: 600 },
  badge: { fontSize: 12, padding: '4px 8px', borderRadius: 4, backgroundColor: '#444', color: '#b0b3b8' },
  badgeReceived: { backgroundColor: '#2d7d46', color: '#fff' },
  cardBody: { fontSize: 14 },
  itemList: { margin: '0 0 12px', paddingLeft: 20 },
  itemLi: { marginBottom: 4 },
  receiveBtn: { padding: '6px 12px', backgroundColor: '#2d7d46', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
};