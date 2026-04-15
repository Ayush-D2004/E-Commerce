import React from 'react';

const mockServices = [
  { id: 1, name: 'ScalerCart Prime Music', status: 'Active', renews: 'May 30, 2026' },
  { id: 2, name: 'ScalerCart eBooks Plus', status: 'Paused', renews: 'Resume anytime' },
  { id: 3, name: 'ScalerCart Video Pack', status: 'Active', renews: 'Jun 12, 2026' }
];

export default function DigitalServicesPage() {
  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Digital Services</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Manage your subscription-style digital purchases.</p>

      <div style={{ display: 'grid', gap: '12px', maxWidth: '680px' }}>
        {mockServices.map((service) => (
          <div key={service.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <h3 style={{ marginBottom: '6px' }}>{service.name}</h3>
              <div style={{ color: '#555', fontSize: '13px' }}>Renews: {service.renews}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: service.status === 'Active' ? '#067d62' : '#555' }}>{service.status}</div>
              <button style={{ marginTop: '8px', backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}>
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
