import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import apiClient from '../apiClient';
import { formatPrice, getProductImageUrl, sanitizeName } from '../utils/productUtils';
import { Heart } from 'lucide-react';

const SIMULATED_STOCK_KEY = 'scalercart.simulatedStock.v1';

const loadStockMap = () => {
  try {
    return JSON.parse(localStorage.getItem(SIMULATED_STOCK_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveStockMap = (stockMap) => {
  try {
    localStorage.setItem(SIMULATED_STOCK_KEY, JSON.stringify(stockMap));
  } catch {
    // Ignore storage errors
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [baseStock, setBaseStock] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const navigate = useNavigate();

  const cartQtyForProduct = cartItems
    .filter((item) => String(item.product_id) === String(id))
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const stockRemaining = Math.max(0, baseStock - cartQtyForProduct);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiClient.get(`/products/${id}`),
      apiClient.get(`/products/${id}/recommendations`)
    ]).then(([resProduct, resRecs]) => {
      if (resProduct.status === 'fulfilled') {
        setProduct(resProduct.value.data);
      } else {
        setProduct(null);
      }

      if (resRecs.status === 'fulfilled') {
        setRecommendations(resRecs.value.data || []);
      } else {
        setRecommendations([]);
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const { data } = await apiClient.get('/wishlist');
        const exists = (data.items || []).some((item) => String(item.id) === String(id));
        setIsWishlisted(exists);
      } catch (err) {
        console.error(err);
      }
    };
    loadWishlist();
  }, [id]);

  useEffect(() => {
    const key = String(id);
    const stockMap = loadStockMap();
    if (!Number.isFinite(stockMap[key])) {
      stockMap[key] = Math.floor(Math.random() * 11) + 5; // 5..15
      saveStockMap(stockMap);
    }
    setBaseStock(Number(stockMap[key]) || 5);
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`scalercart.reviews.${id}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setReviews(Array.isArray(parsed) ? parsed : []);
    } catch {
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem(`scalercart.reviews.${id}`, JSON.stringify(reviews));
    } catch {
      // Ignore storage errors
    }
  }, [id, reviews]);

  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem('recentlyViewed');
      const parsed = stored ? JSON.parse(stored) : [];
      const next = [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.images?.[0]?.url || ''
        },
        ...parsed.filter((item) => item.id !== product.id)
      ].slice(0, 12);
      localStorage.setItem('recentlyViewed', JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
  }, [product]);

  if (loading) return <div className="container" style={{ padding: '20px' }}>Loading...</div>;
  if (!product) return <div className="container" style={{ padding: '20px' }}>Product not found.</div>;

  const handleAddToCart = () => {
    if (stockRemaining <= 0) return;

    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.images?.[0]?.url || ''
    }));

    apiClient.post('/cart/items', {
      product_id: product.id,
      quantity: 1
    }).catch((err) => {
      console.error(err);
    });
  };

  const handleBuyNow = () => {
    if (stockRemaining <= 0) return;
    handleAddToCart();
    navigate('/checkout');
  };

  const toggleWishlist = async () => {
    if (!product) return;
    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await apiClient.delete(`/wishlist/${product.id}`);
        setIsWishlisted(false);
      } else {
        await apiClient.post(`/wishlist/${product.id}`);
        setIsWishlisted(true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : (detail || 'Failed to update wishlist'));
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleReviewImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReviewImage(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleAddReview = () => {
    const text = reviewText.trim();
    if (!text) return;

    const nextReview = {
      id: Date.now(),
      text,
      image: reviewImage || null,
      createdAt: new Date().toISOString()
    };

    setReviews((prev) => [nextReview, ...prev]);
    setReviewText('');
    setReviewImage('');
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
              <img src={getProductImageUrl(product.images[0].url, product.id)} alt={product.images[0].alt_text} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${product.id}/400`; }} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ color: '#ccc' }}>No Image</span>
            )}
          </div>
        </div>

        {/* Details Column */}
        <div style={{ flex: '2 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', lineHeight: '1.2', marginBottom: '5px' }}>{sanitizeName(product.name)}</h1>
            <button
              onClick={toggleWishlist}
              disabled={wishlistBusy}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{ background: 'none', border: '1px solid #d5d9d9', borderRadius: '999px', padding: '6px 10px', cursor: 'pointer' }}
            >
              <Heart size={18} fill={isWishlisted ? '#b12704' : 'none'} color={isWishlisted ? '#b12704' : '#111'} />
            </button>
          </div>
          <a href="#" style={{ color: 'var(--link-color)', fontSize: '14px' }}>Visit the {product.brand || 'Store'}</a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--amz-orange)', fontSize: '18px' }}>★★★★☆</span>
            <span style={{ color: 'var(--link-color)', fontSize: '14px' }}>{product.review_count} ratings</span>
          </div>

          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '28px', fontWeight: '500', color: '#B12704' }}>
              <span style={{ fontSize: '14px', position: 'relative', top: '-8px' }}>₹</span>
              {formatPrice(product.price)}
            </p>
          </div>

          <div style={{ margin: '15px 0' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>About this item</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{product.description}</p>
          </div>

          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Add Comment and Review</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your review..."
                  style={{
                    flex: 1,
                    minHeight: '80px',
                    border: '1px solid #d5d9d9',
                    borderRadius: '8px',
                    padding: '10px',
                    resize: 'vertical'
                  }}
                />
                <label
                  htmlFor={`review-image-${id}`}
                  title="Add image"
                  style={{
                    width: '40px',
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #d5d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '24px',
                    lineHeight: 1,
                    backgroundColor: '#fff'
                  }}
                >
                  +
                </label>
                <input
                  id={`review-image-${id}`}
                  type="file"
                  accept="image/*"
                  onChange={handleReviewImage}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ width: '92px', minWidth: '92px', height: '92px', border: '1px solid #d5d9d9', borderRadius: '8px', backgroundColor: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {reviewImage ? (
                  <img src={reviewImage} alt="Review preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: '#666' }}>No image</span>
                )}
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: '10px' }}
              onClick={handleAddReview}
              disabled={!reviewText.trim()}
            >
              Post Review
            </button>

            {reviews.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                  <div key={review.id} style={{ border: '1px solid #e6e6e6', borderRadius: '8px', padding: '10px', backgroundColor: '#fff' }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{review.text}</p>
                    {review.image && (
                      <img
                        src={review.image}
                        alt="Review"
                        style={{ marginTop: '8px', width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
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
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{formatPrice(product.price)}</p>
            
            <p style={{ color: stockRemaining > 0 ? 'green' : '#B12704', fontSize: '18px', margin: '10px 0' }}>
              {stockRemaining > 0 ? `In Stock (${stockRemaining} left)` : 'Out of Stock'}
            </p>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '10px', borderRadius: '20px' }}
              onClick={handleAddToCart}
              disabled={stockRemaining <= 0}
            >
              Add to Cart
            </button>
            <button 
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: '#FFA41C', borderRadius: '20px' }}
              onClick={handleBuyNow}
              disabled={stockRemaining <= 0}
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
              <Link to={`/product/${p.id}`} key={p.id} style={{ display: 'flex', flexDirection: 'column', width: '200px', flexShrink: 0, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: '200px', backgroundColor: '#f8f8f8', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                    <img src={getProductImageUrl(p.image_url, p.id)} alt={p.name} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${p.id}/180`; }} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ color: '#007185', fontSize: '14px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sanitizeName(p.name)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '5px' }}>
                  <span style={{ fontSize: '12px', color: '#007185' }}>{p.rating?.toFixed(1) || '4.5'}</span>
                  <span style={{ fontSize: '12px', color: '#007185' }}>({p.review_count})</span>
                </div>
                <span style={{ fontSize: '18px', color: '#B12704', marginTop: '5px' }}>₹{formatPrice(p.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
