import React, { useEffect, useState } from 'react';
import apiClient from '../apiClient';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Cancel Order State
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState({});
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnAction, setReturnAction] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [returnOtherReason, setReturnOtherReason] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState({});

  useEffect(() => {
    apiClient.get('/orders')
      .then(res => {
        setOrders(res.data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setErrorMessage('Your session expired. Please sign in again to view your orders.');
        } else {
          setErrorMessage('We could not load your orders right now. Please try again later.');
        }
        setLoading(false);
      });
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!cancelReason) {
      alert("Please select a reason for cancellation.");
      return;
    }
    try {
      await apiClient.post(`/orders/${orderId}/cancel`, {
        reason: cancelReason,
        other_reason: cancelReason === 'Others' ? cancelOtherReason : null
      });
      // Update local state to reflect cancellation
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: 'cancelled' } : o));
      setCancelSuccessMsg(prev => ({ ...prev, [orderId]: "Refund will be made within next 2 working days" }));
      setCancelOrderId(null);
      setCancelReason('');
      setCancelOtherReason('');
    } catch (err) {
      alert("Error cancelling order: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleReturnReplace = async (orderId) => {
    if (!returnReason) {
      alert('Please select a reason for the request.');
      return;
    }
    try {
      await apiClient.post(`/orders/${orderId}/return`, {
        action: returnAction,
        reason: returnReason,
        other_reason: returnReason === 'Others' ? returnOtherReason : null
      });
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, status: `${returnAction}_requested` } : o));
      setReturnSuccessMsg(prev => ({ ...prev, [orderId]: `${returnAction === 'return' ? 'Return' : 'Replacement'} request submitted.` }));
      setReturnOrderId(null);
      setReturnReason('');
      setReturnOtherReason('');
    } catch (err) {
      alert("Error submitting request: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>Your Orders</h1>
      
      {loading ? (
        <p>Loading your orders...</p>
      ) : errorMessage ? (
        <p>{errorMessage}</p>
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
                <h3 style={{ color: order.status === 'cancelled' ? 'red' : 'green', marginBottom: '10px' }}>
                  {order.status === 'placed' ? 'Preparing for Shipment' : order.status}
                </h3>
                <p>Status: {order.status.toUpperCase()}</p>

                {order.address && (
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#555' }}>
                    <strong>Delivering to:</strong>
                    <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</div>
                    <div>{order.address.city}, {order.address.state} {order.address.postal_code}</div>
                    <div>{order.address.country}</div>
                  </div>
                )}

                {order.items && order.items.length > 0 && (
                  <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <strong>Items</strong>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {order.items.map((item, index) => (
                        <div key={`${order.order_id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>{item.product_name} (x{item.quantity})</span>
                          <span>₹{item.line_total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {cancelSuccessMsg[order.order_id] && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
                    {cancelSuccessMsg[order.order_id]}
                  </div>
                )}

                {returnSuccessMsg[order.order_id] && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
                    {returnSuccessMsg[order.order_id]}
                  </div>
                )}
                
                {order.status === 'placed' && cancelOrderId !== order.order_id && (
                  <button 
                    onClick={() => setCancelOrderId(order.order_id)}
                    style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel Order
                  </button>
                )}

                {['placed', 'paid', 'delivered', 'shipped'].includes(order.status) && returnOrderId !== order.order_id && (
                  <button
                    onClick={() => setReturnOrderId(order.order_id)}
                    style={{ marginTop: '15px', marginLeft: '10px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Return or Replace
                  </button>
                )}

                {cancelOrderId === order.order_id && (
                  <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #d5d9d9', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                    <h4 style={{ marginBottom: '10px' }}>Select reason for cancellation</h4>
                    <select 
                      value={cancelReason} 
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="Wrong address given">Wrong address given</option>
                      <option value="Found better price">Found a better price</option>
                      <option value="Ordered by mistake">Ordered by mistake</option>
                      <option value="Others">Others</option>
                    </select>

                    {cancelReason === 'Others' && (
                      <textarea 
                        placeholder="Please specify"
                        value={cancelOtherReason}
                        onChange={(e) => setCancelOtherReason(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '60px' }}
                      />
                    )}
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleCancelOrder(order.order_id)}
                        className="btn-primary"
                      >
                        Submit Cancellation
                      </button>
                      <button 
                        onClick={() => {
                          setCancelOrderId(null);
                          setCancelReason('');
                          setCancelOtherReason('');
                        }}
                        style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {returnOrderId === order.order_id && (
                  <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #d5d9d9', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                    <h4 style={{ marginBottom: '10px' }}>Return or replace this order</h4>
                    <select
                      value={returnAction}
                      onChange={(e) => setReturnAction(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                      <option value="return">Return</option>
                      <option value="replace">Replace</option>
                    </select>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="Defective">Defective item</option>
                      <option value="Damaged">Damaged on arrival</option>
                      <option value="Not as described">Not as described</option>
                      <option value="Others">Others</option>
                    </select>

                    {returnReason === 'Others' && (
                      <textarea
                        placeholder="Please specify"
                        value={returnOtherReason}
                        onChange={(e) => setReturnOtherReason(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '60px' }}
                      />
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleReturnReplace(order.order_id)}
                        className="btn-primary"
                      >
                        Submit Request
                      </button>
                      <button
                        onClick={() => {
                          setReturnOrderId(null);
                          setReturnReason('');
                          setReturnOtherReason('');
                        }}
                        style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
