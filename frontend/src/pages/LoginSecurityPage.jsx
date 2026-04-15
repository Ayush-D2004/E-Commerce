import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function LoginSecurityPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [verifyPhone, setVerifyPhone] = useState(false);
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await apiClient.get('/users/me');
        setUser(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (form.phone !== user?.phone && !verifyPhone) {
      setVerifyPhone(true);
      return;
    }

    if (verifyPhone && otp !== '1234') {
      alert('Invalid OTP! Try 1234');
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.put('/users/me', form);
      setUser(data);
      setVerifyPhone(false);
      setOtp('');
      alert('Profile updated');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Login & Security</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Update your name, email, and mobile number.</p>

      <div className="card" style={{ padding: '20px', maxWidth: '520px' }}>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!verifyPhone ? (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Mobile Number</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#B12704' }}>Verify New Mobile Number</label>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>An OTP has been sent to {form.phone}. (Mock: Enter 1234)</p>
              <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (verifyPhone ? 'Verify & Save' : 'Save Changes')}
          </button>
        </form>
      </div>
    </div>
  );
}
