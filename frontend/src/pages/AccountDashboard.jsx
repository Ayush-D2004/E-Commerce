import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';

const accountTiles = [
  {
    title: 'Your Orders',
    subtitle: 'Track, return, or buy things again',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/order._CB660668735_.png',
    href: '/orders'
  },
  {
    title: 'Login & Security',
    subtitle: 'Edit login, name, and mobile number',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/security._CB659600413_.png',
    href: '/account/security'
  },
  {
    title: 'Your Addresses',
    subtitle: 'Edit addresses for orders',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/fshub/fshub_address_book._CB613924977_.png',
    href: '/addresses'
  },
  {
    title: 'Business Account',
    subtitle: 'GST invoices and billing profile',
    image: 'https://m.media-amazon.com/images/G/01/AmazonBusiness/MarketingFY25/AB_Logo/AB_App_240x240._CB549279058_.png',
    href: '/business-account'
  },
  {
    title: 'Gift Cards',
    subtitle: 'Redeem and track balances',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/contact-us/GiftCard_icon_01._CB660349069_.png',
    href: '/gift-cards'
  },
  {
    title: 'Payments',
    subtitle: 'Review transaction history',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/payment._CB660668735_.png',
    href: '/payments'
  },
  {
    title: 'Amazon Family',
    subtitle: 'Shared household benefits',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/account._CB660668669_.png',
    href: '/amazon-family'
  },
  {
    title: 'Digital Services',
    subtitle: 'Manage subscriptions and streaming',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/digital_devices._CB660668735_.png',
    href: '/digital-services'
  },
  {
    title: 'Your Lists',
    subtitle: 'Wishlist and saved items',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/fshub/11_lists._CB654640573_.png',
    href: '/wishlist'
  },
  {
    title: 'Customer Service',
    subtitle: 'Help center and contact options',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/contact_us._CB660668735_.png',
    href: '/customer-service'
  },
  {
    title: 'Your Messages',
    subtitle: 'Order updates and alerts',
    image: 'https://m.media-amazon.com/images/G/01/x-locale/cs/help/images/gateway/self-service/fshub/9_messages._CB654640573_.jpg',
    href: '/notifications'
  }
];

export default function AccountDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await apiClient.get('/orders');
        setOrders(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Your Account</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {accountTiles.map((tile) => (
          <Link
            to={tile.href}
            key={tile.title}
            style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
          >
            <img src={tile.image} alt={tile.title} width="60" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{tile.title}</h3>
              <p style={{ color: '#555', fontSize: '14px' }}>{tile.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '50px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Recent Order History</h2>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.slice(0, 5).map((o) => (
              <div key={o.order_id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f0f2f2', padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#555', display: 'block' }}>ORDER PLACED</span>
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span style={{ color: '#555', display: 'block' }}>TOTAL</span>
                      <span>₹ {o.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', textAlign: 'right' }}>
                    <span style={{ color: '#555', display: 'block' }}>ORDER # {o.order_number}</span>
                    <span style={{ fontWeight: 'bold', color: o.status === 'paid' ? 'green' : '#b12704' }}>{o.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
