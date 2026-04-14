import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/orders')
      .then(res => {
        setOrders(res.data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>Your Orders</h1>
      
      {loading ? (
        <p>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {orders.map(order => (
            <div key={order.order_id} className="card" style={{ border: '1px solid var(--border-color)', padding: 0 }}>
              <div style={{ backgroundColor: 'var(--amz-light)', padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ORDER PLACED</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>TOTAL</span>
                  <span>₹{order.total_amount.toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>ORDER # {order.order_number}</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ color: 'green', marginBottom: '10px' }}>
                  {order.status === 'placed' ? 'Preparing for Shipment' : order.status}
                </h3>
                <p>Status: {order.status.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
