import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function AccountDashboard() {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Edit State
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, userRes] = await Promise.all([
        apiClient.get('/orders').catch(() => ({ data: { items: [] } })),
        apiClient.get('/users/me').catch(() => ({ data: null }))
      ]);
      setOrders(ordersRes.data.items || []);
      if (userRes.data) {
        setUser(userRes.data);
        setEditForm({
          name: userRes.data.name || '',
          email: userRes.data.email || '',
          phone: userRes.data.phone || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editForm.phone !== user?.phone && !verifyPhone) {
        setVerifyPhone(true);
        return; // wait for verification
    }

    if (verifyPhone && otp !== '1234') {
        alert("Invalid OTP! Try 1234");
        return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.put('/users/me', editForm);
      setUser(data);
      setShowModal(false);
      setVerifyPhone(false);
      setOtp('');
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Your Account</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Orders Card */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', cursor: 'pointer', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src="https://m.media-amazon.com/images/G/31/x-locale/cs/help/images/gateway/box-t3.png" alt="Orders" width="60" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Your Orders</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Track, return, or buy things again</p>
          </div>
        </div>

        {/* Security Card */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', cursor: 'pointer', display: 'flex', gap: '20px', alignItems: 'center' }}
        >
          <img src="https://m.media-amazon.com/images/G/31/x-locale/cs/help/images/gateway/security-t3.png" alt="Security" width="60" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Login & Security</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Edit login, name, and mobile number</p>
          </div>
        </div>

        {/* Addresses Card */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', cursor: 'pointer', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src="https://m.media-amazon.com/images/G/31/x-locale/cs/help/images/gateway/address-t3.png" alt="Address" width="60" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Your Addresses</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Edit addresses for orders</p>
          </div>
        </div>

        {/* Payments Card */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', cursor: 'pointer', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src="https://m.media-amazon.com/images/G/31/x-locale/cs/help/images/gateway/payment-t3.png" alt="Payment" width="60" />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Options</h3>
            <p style={{ color: '#555', fontSize: '14px' }}>Edit or add payment methods</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '50px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Recent Order History</h2>
        {loading ? (
            <p>Loading...</p>
        ) : orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.slice(0, 5).map(o => (
                  <div key={o.order_id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f0f2f2', padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                        <div>
                          <span style={{ color: '#555', display: 'block' }}>ORDER PLACED</span>
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span style={{ color: '#555', display: 'block' }}>TOTAL</span>
                          <span>₹ {o.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', textAlign: 'right' }}>
                        <span style={{ color: '#555', display: 'block' }}>ORDER # {o.order_number}</span>
                        <span style={{ fontWeight: 'bold', color: o.status === 'paid' ? 'green' : '#b12704' }}>{o.status.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Change Account Details</h2>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {!verifyPhone ? (
                  <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Mobile Number</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  </div>
                  </>
              ) : (
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#B12704' }}>Verify New Mobile Number</label>
                    <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>An OTP has been sent to {editForm.phone}. (Mock: Enter 1234)</p>
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} required />
                  </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowModal(false); setVerifyPhone(false); }} style={{ flex: 1, padding: '10px', backgroundColor: '#f0f2f2', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} className="sc-btn" style={{ flex: 1, padding: '10px' }}>{saving ? 'Saving...' : (verifyPhone ? 'Verify & Save' : 'Save Changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
