import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

const emptyForm = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false
};

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAddresses = async () => {
    try {
      const { data } = await apiClient.get('/users/me/addresses');
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const normalizePayload = (payload) => ({
    line1: (payload.line1 || '').trim(),
    line2: payload.line2 ? payload.line2.trim() : null,
    city: (payload.city || '').trim(),
    state: (payload.state || '').trim(),
    postal_code: (payload.postal_code || '').trim(),
    country: (payload.country || '').trim() || 'India',
    is_default: !!payload.is_default
  });

  const parseErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
    if (typeof detail === 'string') return detail;
    return fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = normalizePayload(form);
      if (editingId) {
        const { data } = await apiClient.put(`/users/me/addresses/${editingId}`, payload);
        setAddresses((prev) => prev.map((addr) => (addr.id === editingId ? data : addr)));
      } else {
        const { data } = await apiClient.post('/users/me/addresses', payload);
        setAddresses((prev) => [data, ...prev]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      alert(parseErrorMessage(err, 'Failed to save address'));
    }
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default
    });
  };

  const handleDelete = async (addrId) => {
    try {
      await apiClient.delete(`/users/me/addresses/${addrId}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addrId));
    } catch (err) {
      alert(parseErrorMessage(err, 'Failed to delete address'));
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await apiClient.put(`/users/me/addresses/${addr.id}`, { is_default: true });
      await loadAddresses();
    } catch (err) {
      alert(parseErrorMessage(err, 'Failed to set default address'));
    }
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Your Addresses</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Manage your saved delivery addresses and defaults.</p>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Address line 1" required />
          <input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} placeholder="Address line 2" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required />
          <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" required />
          <input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="Postal code" required />
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" required />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Set as default
          </label>
          <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>
            {editingId ? 'Save Address' : 'Add Address'}
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p>No saved addresses yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {addresses.map((addr) => (
            <div key={addr.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <strong>{addr.line1}</strong>
                {addr.line2 ? <div>{addr.line2}</div> : null}
                <div>{addr.city}, {addr.state} {addr.postal_code}</div>
                <div>{addr.country}</div>
              </div>
              {addr.is_default && <span style={{ fontSize: '12px', color: '#067d62', fontWeight: 'bold' }}>Default address</span>}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => handleEdit(addr)}>Edit</button>
                <button style={{ backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleDelete(addr.id)}>
                  Delete
                </button>
                {!addr.is_default && (
                  <button style={{ backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleSetDefault(addr)}>
                    Set default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
