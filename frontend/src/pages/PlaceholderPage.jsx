import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const topic = params.get('topic') || 'This page';

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{topic} is coming soon</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          We are crafting a polished experience here. Check back shortly.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block' }}>Back to Home</Link>
      </div>
    </div>
  );
}
