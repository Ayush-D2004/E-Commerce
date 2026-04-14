import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Header() {
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header style={{ backgroundColor: 'var(--amz-navy)', color: 'white', padding: '10px 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Scaler<span style={{ color: 'var(--amz-yellow)' }}>Cart</span>
        </Link>
        
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            style={{ flex: 1, padding: '10px', border: 'none', outline: 'none' }} 
          />
          <button style={{ backgroundColor: 'var(--amz-orange)', padding: '10px 15px', color: 'var(--amz-navy)' }}>
            <Search size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <User size={24} />
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
              <span>Hello, Default</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Account & Lists</span>
            </div>
          </div>
          
          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
            <ShoppingCart size={32} />
            <span style={{ 
              position: 'absolute', top: '-5px', right: '15px', 
              color: 'var(--amz-yellow)', fontWeight: 'bold' 
            }}>
              {cartCount}
            </span>
            <span style={{ fontWeight: 'bold', alignSelf: 'flex-end', paddingBottom: '2px' }}>Cart</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
