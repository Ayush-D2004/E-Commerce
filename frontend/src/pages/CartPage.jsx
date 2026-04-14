import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, setQuantity } from '../features/cart/cartSlice';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

export default function CartPage() {
  const { items, subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleQuantity = (id, current, delta) => {
    dispatch(setQuantity({ product_id: id, quantity: current + delta }));
  };

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const proceedToCheckout = async () => {
    // For MVP, sync local cart to server before checkout
    try {
      // Typically we'd have a sync step here or manage cart entirely server-side.
      // But we will just mock that the items are ready on checkout page or send them.
      navigate('/checkout');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container" style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      
      <div className="card" style={{ flex: '1 1 600px' }}>
        <h1 style={{ fontSize: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>Shopping Cart</h1>
        
        {items.length === 0 ? (
          <p>Your Amazon Cart is empty.</p>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.product_id} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ width: '150px', height: '150px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  ) : <span style={{ color: '#aaa' }}>Img</span>}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--link-color)', marginBottom: '5px' }}>{item.name}</h3>
                  <p style={{ color: 'green', fontSize: '12px', marginBottom: '5px' }}>In Stock</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <button onClick={() => handleQuantity(item.product_id, item.quantity, -1)} style={{ padding: '5px 10px', backgroundColor: 'var(--hover-grey)' }}>-</button>
                      <span style={{ padding: '5px 15px', backgroundColor: 'white' }}>{item.quantity}</span>
                      <button onClick={() => handleQuantity(item.product_id, item.quantity, 1)} style={{ padding: '5px 10px', backgroundColor: 'var(--hover-grey)' }}>+</button>
                    </div>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <button onClick={() => handleRemove(item.product_id)} style={{ color: 'var(--link-color)', fontSize: '14px' }}>Delete</button>
                  </div>
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                  ₹{item.line_total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: '0 1 300px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '18px', marginBottom: '15px' }}>
            Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items): <span style={{ fontWeight: 'bold' }}>₹{subtotal.toLocaleString()}</span>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ width: '100%', borderRadius: '20px' }}
            disabled={items.length === 0}
            onClick={proceedToCheckout}
          >
            Proceed to Build
          </button>
        </div>
      </div>

    </div>
  );
}
