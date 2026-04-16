import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { clearCart } from '../features/cart/cartSlice';

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function CheckoutPage() {
  const { items, subtotal } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });

  useEffect(() => {
     loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }, []);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const { data } = await apiClient.get('/users/me/addresses');
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddress = list.find((addr) => addr.is_default) || list[0];
          setSelectedAddressId(defaultAddress.id);
          setShowNewAddressForm(false);
        } else {
          setSelectedAddressId(null);
          setShowNewAddressForm(true);
        }
      } catch (err) {
        console.error(err);
        setAddresses([]);
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
      }
    };

    loadAddresses();
  }, []);

  const handleRazorpayPayment = async (orderId, rzpOrderData) => {
      const options = {
          key: rzpOrderData.key_id,
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency,
          name: "ScalerCart",
          description: "Test Transaction for ScalerCart",
          image: "https://example.com/logo.png",
          order_id: rzpOrderData.razorpay_order_id,
          handler: async function (response) {
              setLoading(true);
              try {
                  await apiClient.post('/payments/verify', {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      backend_order_id: orderId
                  });
                  // Clear local cart
                  dispatch(clearCart());
                  navigate(`/order-success?order_number=SC-${orderId}`);
              } catch (err) {
                  alert("Payment Verification Failed: " + (err.response?.data?.detail || err.message));
                  setLoading(false);
              }
          },
          prefill: {
              name: "Scaler User",
              email: "user@scaler.com",
              contact: "9999999999"
          },
          theme: {
              color: "#f0c14b"
          }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
      });
      rzp1.open();
  };

  const placeOrder = async () => {
    setLoading(true);
    
    try {
      let addressIdForCheckout = selectedAddressId;

      if (showNewAddressForm || !addressIdForCheckout) {
        if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postal_code) {
          alert('Please fill line1, city, state, and postal code for shipping address.');
          setLoading(false);
          return;
        }

        const { data: createdAddress } = await apiClient.post('/users/me/addresses', {
          line1: newAddress.line1,
          line2: newAddress.line2 || null,
          city: newAddress.city,
          state: newAddress.state,
          postal_code: newAddress.postal_code,
          country: newAddress.country || 'India',
          is_default: !!newAddress.is_default,
        });

        addressIdForCheckout = createdAddress.id;
        setAddresses((prev) => [createdAddress, ...prev]);
        setSelectedAddressId(createdAddress.id);
        setShowNewAddressForm(false);
      }

      // 1. Checkout
      const checkoutPayload = {
        address_id: addressIdForCheckout,
        payment_method: "razorpay",
        items: items.map(i => ({
            product_id: String(i.product_id),
            name: i.name,
            quantity: i.quantity,
            price: i.unit_price || i.price
        }))
      };
      
      const res = await apiClient.post('/checkout', checkoutPayload);
      const orderId = res.data.order_id;

      // 3. Init Razorpay
      const paymentRes = await apiClient.post('/payments/create_order', {
          order_id: orderId
      });
      
      // Check if it's a mock key for offline tests
      if (paymentRes.data.key_id.includes("mock")) {
          alert(`MOCK PAYMENT: Order ${orderId} placed successfully. Pretend Razorpay succeeded!`);
          await apiClient.post('/payments/verify', {
             razorpay_order_id: paymentRes.data.razorpay_order_id,
             razorpay_payment_id: "pay_mock123",
             razorpay_signature: "mock_sig_123",
             backend_order_id: orderId
          });
          dispatch(clearCart());
          navigate(`/order-success?order_number=SC-${orderId}`);
          return;
      }

      // Launch Razorpay interface
      setLoading(false); 
      handleRazorpayPayment(orderId, paymentRes.data);

    } catch (e) {
      setLoading(false);
      console.error(e);
      alert("Error placing order: " + (e.response?.data?.detail || e.message));
    }
  };

  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>Checkout</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 600px' }}>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>1. Shipping address</h3>

            {addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {addresses.map((addr) => (
                  <label key={addr.id} style={{ display: 'flex', gap: '10px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="shipping_address"
                      checked={selectedAddressId === addr.id && !showNewAddressForm}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setShowNewAddressForm(false);
                      }}
                    />
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      <div><strong>{addr.line1}</strong>{addr.is_default ? ' (Default)' : ''}</div>
                      {addr.line2 ? <div>{addr.line2}</div> : null}
                      <div>{addr.city}, {addr.state} {addr.postal_code}</div>
                      <div>{addr.country}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              style={{ marginBottom: '12px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
              onClick={() => setShowNewAddressForm((prev) => !prev)}
            >
              {showNewAddressForm ? 'Use Saved Address' : 'Add New Address'}
            </button>

            {showNewAddressForm && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} placeholder="Address line 1" />
                <input value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} placeholder="Address line 2 (optional)" />
                <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="City" />
                <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} placeholder="State" />
                <input value={newAddress.postal_code} onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })} placeholder="Postal code" />
                <input value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} placeholder="Country" />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input type="checkbox" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
                  Set as default
                </label>
              </div>
            )}
          </div>
          
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>2. Payment method</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="radio" checked readOnly/> <span>Razorpay (Credit Card / UPI / NetBanking)</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>3. Review items and shipping</h3>
            {items.map(item => (
              <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#007185', fontWeight: 'bold' }}>{item.name} (Qty: {item.quantity})</span>
                <span style={{ fontWeight: 'bold' }}>₹{item.line_total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '0 1 300px' }}>
          <div className="card" style={{ backgroundColor: '#f3f3f3', border: '1px solid #ddd' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '15px', backgroundColor: '#ffd814', color: '#111', border: '1px solid #fcd200', padding: '10px', borderRadius: '8px' }}
              onClick={placeOrder}
              disabled={loading || items.length === 0}
            >
              {loading ? 'Processing...' : 'Pay with Razorpay'}
            </button>
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
              <span>Items:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
              <span>Shipping & handling:</span>
              <span>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
              <span>Total before tax:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <span>Estimated tax to be collected:</span>
              <span>₹{tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#B12704', fontWeight: 'bold', fontSize: '20px' }}>
              <span>Order total:</span>
              <span>₹{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
