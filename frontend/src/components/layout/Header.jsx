import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Header() {
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <>
      <header style={{ backgroundColor: 'var(--amz-navy)', color: 'white', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Scaler<span style={{ color: 'var(--amz-yellow)' }}>Cart</span>
          </Link>
          
          <form 
            onSubmit={handleSearch}
            style={{ display: 'flex', flex: 1, alignItems: 'center', backgroundColor: 'white', borderRadius: '4px', overflow: 'hidden' }}
          >
            <input 
              type="text" 
              placeholder="Search products, brands and categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px', border: 'none', outline: 'none', color: '#111' }} 
            />
            <button type="submit" style={{ backgroundColor: 'var(--amz-orange)', padding: '10px 15px', color: 'var(--amz-navy)', border: 'none', cursor: 'pointer' }}>
              <Search size={20} />
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <User size={24} />
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                <span>Hello, Raina</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Account</span>
              </div>
            </Link>

            <Link to="/orders" style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                <span>Returns</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>& Orders</span>
            </Link>
            
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
              <ShoppingCart size={32} />
              <span style={{ 
                position: 'absolute', top: '-5px', left: '15px', 
                color: 'var(--amz-orange)', fontWeight: 'bold', fontSize: '16px' 
              }}>
                {cartCount}
              </span>
              <span style={{ fontWeight: 'bold', alignSelf: 'flex-end', paddingBottom: '2px' }}>Cart</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Quick Access Bar */}
      <div style={{ backgroundColor: '#232f3e', color: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', height: '40px', fontSize: '14px', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Menu size={20} />
          <span>All</span>
        </div>
        <Link to="/search?category=general" style={{color: 'white', textDecoration: 'none'}}>General</Link>
        <Link to="/search?category=fashion-apparel" style={{color: 'white', textDecoration: 'none'}}>Fashion</Link>
        <Link to="/search?category=home-kitchen" style={{color: 'white', textDecoration: 'none'}}>Home & Kitchen</Link>
        <Link to="/search?category=electronics-gadgets" style={{color: 'white', textDecoration: 'none'}}>Electronics</Link>
        <Link to="/search?category=footwear" style={{color: 'white', textDecoration: 'none'}}>Footwear</Link>
        <Link to="/search?category=bags-accessories" style={{color: 'white', textDecoration: 'none'}}>Bags</Link>
        <Link to="/search?sort=rating" style={{color: 'white', textDecoration: 'none'}}>Today's Deals</Link>
        <Link to="/search?sort=newest" style={{color: 'white', textDecoration: 'none'}}>New Releases</Link>
        <Link to="/account" style={{color: 'white', textDecoration: 'none'}}>Customer Service</Link>
      </div>
    </>
  );
}
