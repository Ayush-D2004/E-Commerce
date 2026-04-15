import React from 'react';

const benefits = [
  'Share carts and wishlists with family members',
  'Create kid-friendly profiles for recommendations',
  'Track household orders in one place',
  'Set up shared delivery addresses'
];

export default function AmazonFamilyPage() {
  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Amazon Family</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>Organize shopping for your household with shared benefits.</p>

      <div className="card" style={{ padding: '20px', maxWidth: '640px' }}>
        <h3 style={{ marginBottom: '12px' }}>Household benefits</h3>
        <ul style={{ paddingLeft: '20px', color: '#555', marginBottom: '16px' }}>
          {benefits.map((item) => (
            <li key={item} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
        <button className="btn-primary">Invite a family member</button>
      </div>
    </div>
  );
}
