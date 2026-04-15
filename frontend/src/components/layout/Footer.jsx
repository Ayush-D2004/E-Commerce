import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ marginTop: 'auto', backgroundColor: '#232f3e', color: 'white', fontSize: '14px' }}>
      {/* Back to top button */}
      <div 
        onClick={scrollToTop}
        style={{ 
          backgroundColor: '#37475a', 
          textAlign: 'center', 
          padding: '15px 0', 
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#485769'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#37475a'}
      >
        Back to top
      </div>

      <div className="container" style={{ padding: '40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Get to Know Us</h3>
          <Link to="#" style={{ color: '#ccc' }}>About Us</Link>
          <Link to="#" style={{ color: '#ccc' }}>Careers</Link>
          <Link to="#" style={{ color: '#ccc' }}>Press Releases</Link>
          <Link to="#" style={{ color: '#ccc' }}>Scaler Science</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Connect with Us</h3>
          <Link to="#" style={{ color: '#ccc' }}>Facebook</Link>
          <Link to="#" style={{ color: '#ccc' }}>Twitter</Link>
          <Link to="#" style={{ color: '#ccc' }}>Instagram</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Make Money with Us</h3>
          <Link to="#" style={{ color: '#ccc' }}>Sell on ScalerCart</Link>
          <Link to="#" style={{ color: '#ccc' }}>Protect and Build Your Brand</Link>
          <Link to="#" style={{ color: '#ccc' }}>Global Selling</Link>
          <Link to="#" style={{ color: '#ccc' }}>Become an Affiliate</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>Let Us Help You</h3>
          <Link to="/account" style={{ color: '#ccc' }}>Your Account</Link>
          <Link to="/orders" style={{ color: '#ccc' }}>Returns Centre</Link>
          <Link to="/search" style={{ color: '#ccc' }}>100% Purchase Protection</Link>
          <Link to="/account" style={{ color: '#ccc' }}>Help</Link>
        </div>
      </div>

      <div style={{ backgroundColor: '#131a22', padding: '30px 0', textAlign: 'center', borderTop: '1px solid #3a4553' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
            Scaler<span style={{ color: 'var(--amz-yellow)' }}>Cart</span>
          </Link>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
            © {new Date().getFullYear()} ScalerCart. Inspired by the best eCommerce conventions. Made by Ayush Dhoble
          </p>
        </div>
      </div>
    </footer>
  );
}
