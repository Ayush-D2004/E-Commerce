import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

export default function CheckoutPage() {
  const { items, subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    setLoading(true);
    
    try {
      // 1. Sync cart to backend
      for (const item of items) {
        await apiClient.post('/cart/items', {
          product_id: item.product_id,
          quantity: item.quantity
        });
      }

      // 2. Checkout
      const res = await apiClient.post('/checkout', {
        address_id: 1, // Assume default seeded address or creates one
        payment_method: "mock_card"
      });

      // Clear local cart
      dispatch({ type: 'cart/removeFromCart' }); // Custom clear or just rely on state reset
      navigate(`/order-success?order_number=${res.data.order_number}`);

    } catch (e) {
      console.error(e);
      alert("Error placing order: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>Checkout</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 600px' }}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>1. Shipping address</h3>
            <p>123 Scaler St, Bangalore, Karnataka, 560001, India</p>
          </div>
          
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>2. Payment method</h3>
            <p>Mock Credit Card ending in 4242</p>
          </div>

          <div className="card">
            <h3>3. Review items and shipping</h3>
            {items.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>{item.name} (Qty: {item.quantity})</span>
                <span>₹{item.line_total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '0 1 300px' }}>
          <div className="card">
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '15px' }}
              onClick={placeOrder}
              disabled={loading || items.length === 0}
            >
              {loading ? 'Placing Order...' : 'Place your order'}
            </button>
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Items:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Shipping & handling:</span>
              <span>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <span>Total before tax:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#B12704', fontWeight: 'bold', fontSize: '20px' }}>
              <span>Order total:</span>
              <span>₹{(subtotal * 1.18).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
