import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    apiClient.get('/products')
      .then(res => {
        setProducts(res.data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: '' // Will hook up to real image URL later
    }));
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <h1>Welcome to ScalerCart</h1>
      
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px', 
          marginTop: '20px' 
        }}>
          {products.map(product => (
            <div key={product.id} className="card">
              <div style={{ height: '200px', backgroundColor: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#ccc' }}>Image Placeholder</span>
              </div>
              <Link to={`/product/${product.id}`} style={{ display: 'block', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--link-color)' }}>{product.name}</h3>
              </Link>
              <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                ₹{product.price}
              </p>
              <button 
                className="btn-primary" 
                style={{ width: '100%' }}
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
