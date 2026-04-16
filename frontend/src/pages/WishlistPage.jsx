import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
import { addToCart } from '../features/cart/cartSlice';
import { formatPrice, getProductImageUrl, sanitizeName } from '../utils/productUtils';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const loadWishlist = async () => {
    try {
      const { data } = await apiClient.get('/wishlist');
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await apiClient.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove item');
    }
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url || ''
    }));
  };

  return (
    <div className="container" style={{ padding: '30px 0' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Your Wishlist</h1>
      {loading ? (
        <p>Loading wishlist...</p>
      ) : items.length === 0 ? (
        <p>Your wishlist is empty. Browse products to save them for later.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: '180px', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getProductImageUrl(item.image_url, item.id)}
                    alt={sanitizeName(item.name)}
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${item.id}/200`; }}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
                <h3 style={{ fontSize: '16px', marginTop: '10px' }}>{sanitizeName(item.name)}</h3>
              </Link>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#B12704' }}>₹{formatPrice(item.price)}</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleAddToCart(item)}>
                  Add to Cart
                </button>
                <button
                  style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
