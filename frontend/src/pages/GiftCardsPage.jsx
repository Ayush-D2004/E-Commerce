import React, { useState } from 'react';

export default function GiftCardsPage() {
  const [code, setCode] = useState('');
  const [balance, setBalance] = useState(null);

  const handleRedeem = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const mockBalance = Math.floor(Math.random() * 4000) + 500;
    setBalance(mockBalance);
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Gift Cards</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Redeem a gift card code to apply balance to your account.</p>

      <div className="card" style={{ padding: '20px', maxWidth: '520px' }}>
        <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Enter gift card code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Redeem</button>
        </form>
        {balance !== null && (
          <div style={{ marginTop: '16px', backgroundColor: '#f0f2f2', padding: '12px', borderRadius: '8px' }}>
            <strong>Gift card applied!</strong>
            <div style={{ marginTop: '6px' }}>Available balance: ₹{balance.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
