import { useState, useMemo } from 'react';

const emptyVariant = () => ({
  sku: '',
  attributes: { size: '', color: '' },
  stock: 0,
  price: 0,
});

/** Normalize API variant to form shape */
function variantFromApi(v) {
  return {
    sku: v.sku ?? '',
    attributes: {
      size: v.attributes?.size ?? '',
      color: v.attributes?.color ?? '',
    },
    stock: v.stock ?? 0,
    price: v.price ?? 0,
  };
}

/** Form variant to API shape */
function variantToApi(v) {
  return {
    sku: v.sku.trim(),
    attributes: { size: (v.attributes?.size ?? '').trim(), color: (v.attributes?.color ?? '').trim() },
    stock: Number(v.stock) || 0,
    price: Number(v.price) || 0,
  };
}

/** Set of SKUs that appear more than once (non-empty) */
function getDuplicateSkus(variants) {
  const counts = {};
  variants.forEach((v) => {
    const sku = (v.sku || '').trim().toLowerCase();
    if (sku) counts[sku] = (counts[sku] || 0) + 1;
  });
  return new Set(Object.keys(counts).filter((sku) => counts[sku] > 1));
}

export function ProductForm({ initialValues = {}, onSubmit, onCancel, submitLabel = 'Save', disabled = false }) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [variants, setVariants] = useState(() => {
    const list = initialValues.variants;
    if (Array.isArray(list) && list.length > 0) {
      return list.map(variantFromApi);
    }
    return [emptyVariant()];
  });

  const duplicateSkus = useMemo(() => getDuplicateSkus(variants), [variants]);

  function addVariant() {
    const skus = variants.map((v) => (v.sku || '').trim().toLowerCase()).filter(Boolean);
    const hasDuplicate = skus.length !== new Set(skus).size;
    if (hasDuplicate) {
      return; // keep showing duplicate error; don't add until fixed
    }
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function updateVariant(index, field, value) {
    setVariants((prev) => {
      const next = [...prev];
      if (field === 'sku' || field === 'stock' || field === 'price') {
        next[index] = { ...next[index], [field]: value };
      } else if (field === 'size' || field === 'color') {
        next[index] = {
          ...next[index],
          attributes: { ...next[index].attributes, [field]: value },
        };
      }
      return next;
    });
  }

  function removeVariant(index) {
    setVariants((prev) => (prev.length <= 1 ? [emptyVariant()] : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const skus = variants.map((v) => (v.sku || '').trim()).filter(Boolean);
    if (skus.length !== new Set(skus.map((s) => s.toLowerCase())).size) {
      return; // duplicate SKU, duplicateSkus already showing
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      variants: variants.map(variantToApi).filter((v) => v.sku),
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="product-name" style={styles.label}>Product name</label>
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={styles.input}
        />
      </div>
      <div style={styles.field}>
        <label htmlFor="product-desc" style={styles.label}>Description</label>
        <textarea
          id="product-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={styles.input}
        />
      </div>

      <div style={styles.variantSection}>
        <div style={styles.variantHeader}>
          <span style={styles.variantTitle}>Variants</span>
          <button type="button" onClick={addVariant} style={styles.addVariantBtn}>
            Add Variant
          </button>
        </div>
        <div style={styles.variantTableWrap}>
          <table style={styles.variantTable}>
            <thead>
              <tr>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Color</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => {
                const skuLower = (v.sku || '').trim().toLowerCase();
                const isDuplicate = skuLower && duplicateSkus.has(skuLower);
                return (
                  <tr key={i}>
                    <td style={styles.td}>
                      <input
                        value={v.sku}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        placeholder="SKU"
                        style={{ ...styles.input, ...(isDuplicate ? styles.inputError : {}) }}
                        title={isDuplicate ? 'SKU must be unique' : ''}
                      />
                      {isDuplicate && <span style={styles.inlineError}>Must be unique</span>}
                    </td>
                    <td style={styles.td}>
                      <input
                        value={v.attributes?.size ?? ''}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                        placeholder="Size"
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        value={v.attributes?.color ?? ''}
                        onChange={(e) => updateVariant(i, 'color', e.target.value)}
                        placeholder="Color"
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) => updateVariant(i, 'stock', e.target.value === '' ? '' : Number(e.target.value))}
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={v.price}
                        onChange={(e) => updateVariant(i, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        style={styles.removeBtn}
                        title="Remove variant"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.formActions}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={styles.secondaryBtn}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={disabled || duplicateSkus.size > 0} style={styles.primaryBtn}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: { padding: 20, marginBottom: 24, backgroundColor: '#242628', borderRadius: 8, maxWidth: 720 },
  field: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 4, fontSize: 13, color: '#b0b3b8' },
  input: { width: '100%', padding: 8, backgroundColor: '#1a1d21', border: '1px solid #444', borderRadius: 4, color: '#e4e6eb', fontSize: 14, boxSizing: 'border-box' },
  inputError: { borderColor: '#c44' },
  inlineError: { display: 'block', fontSize: 12, color: '#f88', marginTop: 2 },
  variantSection: { marginTop: 20, marginBottom: 20 },
  variantHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  variantTitle: { fontSize: 14, fontWeight: 600 },
  addVariantBtn: { padding: '6px 12px', backgroundColor: '#2d7d46', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  variantTableWrap: { overflowX: 'auto' },
  variantTable: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #333', fontWeight: 600, fontSize: 12 },
  td: { padding: '8px 10px', borderBottom: '1px solid #2a2a2a', verticalAlign: 'top' },
  removeBtn: { padding: '4px 8px', backgroundColor: 'transparent', color: '#b0b3b8', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  formActions: { display: 'flex', gap: 12, marginTop: 16 },
  primaryBtn: { padding: '8px 16px', backgroundColor: '#2d7d46', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  secondaryBtn: { padding: '8px 16px', backgroundColor: 'transparent', color: '#e4e6eb', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
};
