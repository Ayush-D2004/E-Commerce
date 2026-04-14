import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order_number");

  return (
    <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', borderTop: '4px solid green' }}>
        <h1 style={{ color: 'green', marginBottom: '10px' }}>Order Placed, Thank You!</h1>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>Confirmation will be sent to your email.</p>
        <div style={{ backgroundColor: 'var(--amz-light)', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          <strong>Order Number:</strong> {orderNumber}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link to="/orders">
            <button className="btn-primary" style={{ backgroundColor: 'white', color: 'black' }}>View Orders</button>
          </Link>
          <Link to="/">
            <button className="btn-primary">Continue Shopping</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
