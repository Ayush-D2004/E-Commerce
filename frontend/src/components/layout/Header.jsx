import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Bell, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import apiClient from '../../apiClient';

export default function Header() {
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [addressLabel, setAddressLabel] = useState('Select address');
  const [backendStatus, setBackendStatus] = useState('loading');
  const [connectingDots, setConnectingDots] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const activeCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || '';
  }, [location.search]);
  const activeSort = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('sort') || '';
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const pingBackend = async () => {
    setBackendStatus('loading');
    try {
      await apiClient.get('/health', { timeout: 12000 });
      setBackendStatus('connected');
    } catch (err) {
      console.error(err);
      setBackendStatus('connecting');
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data } = await apiClient.get('/notifications');
        setUnreadCount(data.unread_count || 0);
      } catch (err) {
        console.error(err);
      }
    };
    loadNotifications();
  }, [location.pathname]);

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const { data } = await apiClient.get('/users/me/addresses');
        const addresses = data || [];
        const defaultAddress = addresses.find((addr) => addr.is_default) || addresses[0];
        if (defaultAddress) {
          const city = defaultAddress.city || 'your city';
          setAddressLabel(city);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAddress();
  }, []);

  useEffect(() => {
    pingBackend();
  }, []);

  useEffect(() => {
    if (backendStatus !== 'connecting') return;
    const timer = setInterval(() => {
      setConnectingDots((prev) => (prev % 3) + 1);
    }, 350);
    return () => clearInterval(timer);
  }, [backendStatus]);

  const backendButtonConfig = useMemo(() => {
    if (backendStatus === 'connected') {
      return {
        label: 'Connected',
        style: { backgroundColor: '#067d62', color: 'white' }
      };
    }
    if (backendStatus === 'loading') {
      return {
        label: 'Loading',
        style: { backgroundColor: '#ffd814', color: '#111' }
      };
    }
    return {
      label: `Connecting${'.'.repeat(connectingDots)}`,
      style: { backgroundColor: '#b12704', color: 'white' }
    };
  }, [backendStatus, connectingDots]);

  return (
    <div className="sticky-shell">
      <header className="site-header" style={{ backgroundColor: 'var(--amz-navy)', color: 'white', padding: '10px 0' }}>
        <div className="container site-header__row" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Scaler<span style={{ color: 'var(--amz-yellow)' }}>Cart</span>
          </Link>

          <Link
            to="/addresses"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', color: 'inherit', textDecoration: 'none' }}
            title="Update delivery address"
          >
            <MapPin size={16} />
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
              <span style={{ color: '#ddd' }}>Delivering to</span>
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{addressLabel}</span>
            </div>
          </Link>
          
          <form 
            onSubmit={handleSearch}
            className="site-header__search"
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
            <Link to="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  backgroundColor: 'var(--amz-orange)', color: '#111',
                  fontSize: '10px', fontWeight: 'bold', borderRadius: '10px',
                  padding: '2px 6px'
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <User size={24} />
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                <span>Hello, Ayush</span>
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
      <div className="site-nav" style={{ backgroundColor: '#232f3e', color: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', height: '40px', fontSize: '14px', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Menu size={20} />
          <span>All</span>
        </div>
        <Link to="/search?category=fashion-apparel" className={`nav-link ${activeCategory === 'fashion-apparel' ? 'active' : ''}`}>Fashion</Link>
        <Link to="/search?category=home-kitchen" className={`nav-link ${activeCategory === 'home-kitchen' ? 'active' : ''}`}>Home & Kitchen</Link>
        <Link to="/search?category=electronics-gadgets" className={`nav-link ${activeCategory === 'electronics-gadgets' ? 'active' : ''}`}>Electronics</Link>
        <Link to="/search?category=footwear" className={`nav-link ${activeCategory === 'footwear' ? 'active' : ''}`}>Footwear</Link>
        <Link to="/search?category=bags-accessories" className={`nav-link ${activeCategory === 'bags-accessories' ? 'active' : ''}`}>Bags</Link>
        <Link to="/search?sort=rating" className={`nav-link ${activeSort === 'rating' ? 'active' : ''}`}>Today's Deals</Link>
        <Link to="/search?sort=newest" className={`nav-link ${activeSort === 'newest' ? 'active' : ''}`}>New Releases</Link>
        {backendStatus !== 'connected' && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.9 }}>
            Backend is deployed on Render free-tier servers, waking up may take some time.
          </span>
        )}
        <button
          onClick={pingBackend}
          style={{
            marginLeft: backendStatus === 'connected' ? 'auto' : '0',
            border: 'none',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '4px 10px',
            cursor: 'pointer',
            minWidth: '96px',
            ...backendButtonConfig.style
          }}
          title="Ping backend service"
        >
          {backendButtonConfig.label}
        </button>
      </div>
    </div>
  );
}
