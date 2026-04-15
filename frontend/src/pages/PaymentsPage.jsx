import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function PaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data } = await apiClient.get('/orders');
        setOrders(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Payment History</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Review your order payments and transaction activity.</p>

      {loading ? (
        <p>Loading transactions...</p>
      ) : orders.length === 0 ? (
        <p>No transactions found yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => (
            <div key={order.order_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>Order #{order.order_number}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>{new Date(order.created_at).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#B12704' }}>₹{order.total_amount.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>Method: Razorpay</div>
                <div style={{ fontSize: '12px', color: order.status === 'paid' ? 'green' : '#555' }}>
                  Status: {order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
