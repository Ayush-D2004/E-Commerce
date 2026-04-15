import React, { useState } from 'react';

export default function BusinessAccountPage() {
  const [form, setForm] = useState({
    company: '',
    gstin: '',
    billing: '',
    contact: ''
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Business Account</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Add GST and billing details for business purchases.</p>

      <div className="card" style={{ padding: '20px', maxWidth: '640px' }}>
        {saved && (
          <div style={{ backgroundColor: '#e7f3ec', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
            Business profile saved successfully.
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company name"
            required
          />
          <input
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            placeholder="GSTIN"
            required
          />
          <input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="Billing contact email"
            type="email"
            required
          />
          <textarea
            rows={3}
            value={form.billing}
            onChange={(e) => setForm({ ...form, billing: e.target.value })}
            placeholder="Billing address"
            required
          />
          <button type="submit" className="btn-primary">Save business profile</button>
        </form>
      </div>
    </div>
  );
}
