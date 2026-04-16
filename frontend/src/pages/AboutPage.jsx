import React from 'react';

export default function AboutPage() {
  const email = 'ayush.dhoble2004@gmail.com';

  const highlights = [
    'Hybrid search pipeline combining lexical typo-tolerance and semantic relevance for 33K+ products',
    'Recommendation system with precomputed similarity mappings for low-latency personalized feeds',
    'Production-oriented backend lifecycle with non-blocking startup and Render-friendly health checks',
    'Transactional commerce flow for cart, checkout, orders, return/replace, and payment verification',
    'Full account operations: wishlist, notifications, addresses, order history, and customer pages',
    'Cloud deployment on Vercel + Render + NeonDB with resilient frontend data loading'
  ];

  const stack = [
    { layer: 'Frontend', value: 'React + Vite + Redux Toolkit + Axios' },
    { layer: 'Backend', value: 'FastAPI + SQLAlchemy + Pydantic + Alembic' },
    { layer: 'Search/ML', value: 'RapidFuzz + FAISS + Sentence Transformers + NumPy' },
    { layer: 'Data', value: 'Relational commerce schema with catalog, orders, payments, inventory, recommendations' },
    { layer: 'Deployment', value: 'Vercel (UI), Render (API), Neon PostgreSQL (cloud DB)' }
  ];

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: '30px', marginBottom: '8px' }}>About ScalerCart</h1>
        <p style={{ marginBottom: '6px', lineHeight: 1.7 }}>
          ScalerCart is an end-to-end eCommerce engineering assignment built for Scaler by Ayush Dhoble.
        </p>
        <p style={{ marginBottom: '18px', lineHeight: 1.7 }}>
          The goal was not only to recreate an Amazon-like shopping experience, but to demonstrate systems thinking through search engineering,
          recommendation design, transactional backend workflows, and cloud deployment readiness.
        </p>

        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
          <strong>Creator:</strong> Ayush Dhoble<br />
          <strong>Email:</strong> {email}
        </div>

        <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>What Makes This Project Deep</h2>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, marginBottom: '20px' }}>
          {highlights.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Architecture Snapshot</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {stack.map((item) => (
            <div key={item.layer} style={{ border: '1px solid #d5d9d9', borderRadius: '8px', padding: '12px', backgroundColor: 'white' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>{item.layer}</div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
