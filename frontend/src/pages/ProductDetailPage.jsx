import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import apiClient from '../apiClient';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/products/${id}`),
      apiClient.get(`/products/${id}/recommendations`)
    ]).then(([resProduct, resRecs]) => {
      setProduct(resProduct.data);
      setRecommendations(resRecs.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '20px' }}>Loading...</div>;
  if (!product) return <div className="container" style={{ padding: '20px' }}>Product not found.</div>;

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.images?.[0]?.url || ''
    }));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Images Column */}
        <div style={{ flex: '1 1 400px', maxWidth: '500px' }}>
          <div style={{ 
            width: '100%', height: '400px', backgroundColor: '#fff', 
            border: '1px solid var(--border-color)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0].url} alt={product.images[0].alt_text} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ color: '#ccc' }}>No Image</span>
            )}
          </div>
        </div>

        {/* Details Column */}
        <div style={{ flex: '2 1 400px' }}>
          <h1 style={{ fontSize: '24px', lineHeight: '1.2', marginBottom: '5px' }}>{product.name}</h1>
          <a href="#" style={{ color: 'var(--link-color)', fontSize: '14px' }}>Visit the {product.brand || 'Store'}</a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--amz-orange)', fontSize: '18px' }}>★★★★☆</span>
            <span style={{ color: 'var(--link-color)', fontSize: '14px' }}>{product.review_count} ratings</span>
          </div>

          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '28px', fontWeight: '500', color: '#B12704' }}>
              <span style={{ fontSize: '14px', position: 'relative', top: '-8px' }}>₹</span>
              {product.price.toLocaleString()}
            </p>
          </div>

          <div style={{ margin: '15px 0' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>About this item</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{product.description}</p>
          </div>
          
          {product.specs && product.specs.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <table style={{ width: '100%', maxWidth: '400px', fontSize: '14px', textAlign: 'left' }}>
                <tbody>
                  {product.specs.map(spec => (
                    <tr key={spec.key}>
                      <th style={{ padding: '5px 0', color: 'var(--text-dark)' }}>{spec.key}</th>
                      <td style={{ padding: '5px 0', color: 'var(--text-muted)' }}>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Column */}
        <div style={{ flex: '0 1 300px', minWidth: '250px' }}>
          <div className="card" style={{ border: '1px solid var(--border-color)', padding: '15px' }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{product.price.toLocaleString()}</p>
            
            <p style={{ color: 'green', fontSize: '18px', margin: '10px 0' }}>
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </p>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '10px', borderRadius: '20px' }}
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <button 
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: '#FFA41C', borderRadius: '20px' }}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', marginTop: '15px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ships from</span><span>ScalerCart</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sold by</span><span>ScalerCart</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recommendations Strip */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '50px', backgroundColor: 'white', padding: '20px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Customers who viewed this item also viewed</h2>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '10px' }}>
            {recommendations.map(p => (
              <a href={`/product/${p.id}`} key={p.id} style={{ display: 'flex', flexDirection: 'column', width: '200px', flexShrink: 0, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: '200px', backgroundColor: '#f8f8f8', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                    <img src={p.image_url || `https://picsum.photos/seed/${p.id}/180`} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ color: '#007185', fontSize: '14px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '5px' }}>
                  <span style={{ fontSize: '12px', color: '#007185' }}>{p.rating?.toFixed(1) || '4.5'}</span>
                  <span style={{ fontSize: '12px', color: '#007185' }}>({p.review_count})</span>
                </div>
                <span style={{ fontSize: '18px', color: '#B12704', marginTop: '5px' }}>₹{p.price?.toLocaleString()}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
