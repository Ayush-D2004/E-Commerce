import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
import { Star } from 'lucide-react';

export default function HomePage() {
  const [flashDeals, setFlashDeals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recTitle, setRecTitle] = useState("Recommended for you");
  const [randomProducts, setRandomProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const marqueeRef = useRef(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, recsRes, randomRes] = await Promise.all([
          apiClient.get('/products/flash-deals'),
          apiClient.get('/recommendations/personalized'),
          apiClient.get('/products/random', { params: { limit: 30 } })
        ]);
        setFlashDeals(dealsRes.data || []);
        setRandomProducts(randomRes.data || []);

        if (recsRes.data && recsRes.data.items) {
          setRecommendations(recsRes.data.items);
          if (recsRes.data.type === 'fallback_trending') {
            setRecTitle("Top Trending Products right now");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const shuffledRandom = React.useMemo(() => {
    const clone = [...randomProducts];
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }, [randomProducts]);

  const heroRow = shuffledRandom.slice(0, 12);
  const galleryProducts = shuffledRandom.slice(12, 24);

  const handlePointerDown = (event) => {
    if (!marqueeRef.current) return;
    marqueeRef.current.classList.add('is-dragging');
    dragState.current.isDown = true;
    dragState.current.startX = event.clientX;
    dragState.current.scrollLeft = marqueeRef.current.scrollLeft;
    marqueeRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current.isDown || !marqueeRef.current) return;
    const walk = event.clientX - dragState.current.startX;
    marqueeRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const handlePointerUp = (event) => {
    if (!marqueeRef.current) return;
    dragState.current.isDown = false;
    marqueeRef.current.classList.remove('is-dragging');
    marqueeRef.current.releasePointerCapture(event.pointerId);
  };

  const renderProductStrip = (products, title) => (
    <div style={{ backgroundColor: 'white', padding: '20px', marginBottom: '20px', borderRadius: '4px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>{title}</h2>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', paddingBottom: '10px' }}>
        {products.map(p => (
          <Link to={`/product/${p.id}`} key={p.id} style={{ display: 'flex', flexDirection: 'column', width: '200px', flexShrink: 0, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ height: '200px', backgroundColor: '#f8f8f8', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
              <img src={p.image_url || `https://picsum.photos/seed/${p.id}/180`} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ color: '#007185', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '5px' }}>
              <Star size={14} fill="var(--amz-yellow)" color="var(--amz-yellow)" />
              <span style={{ fontSize: '12px', color: '#007185' }}>{p.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <span style={{ fontSize: '18px', color: '#B12704', marginTop: '5px' }}>₹{p.price?.toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1500px', margin: '0 auto' }}>
      {/* Hero Banner Area */}
      <section className="hero-stage">
        <div className="hero-backdrop" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="hero-eyebrow">ScalerCart</p>
            <h1 className="hero-title">Fresh Deals</h1>
            
          </div>
          <div
            className="hero-marquee"
            ref={marqueeRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="marquee-row marquee-fast">
              <div className="marquee-track">
                {heroRow.map((p) => (
                  <Link to={`/product/${p.id}`} key={`hero-${p.id}`} className="frame-card">
                    <div className="frame-image">
                      <img src={p.image_url || `https://picsum.photos/seed/${p.id}/220`} alt={p.name} />
                    </div>
                    <div className="frame-meta">
                      <span className="frame-name">{p.name}</span>
                      <span className="frame-price">₹{p.price?.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="marquee-track" aria-hidden="true">
                {heroRow.map((p) => (
                  <Link to={`/product/${p.id}`} key={`hero-dup-${p.id}`} className="frame-card">
                    <div className="frame-image">
                      <img src={p.image_url || `https://picsum.photos/seed/${p.id}/220`} alt={p.name} />
                    </div>
                    <div className="frame-meta">
                      <span className="frame-name">{p.name}</span>
                      <span className="frame-price">₹{p.price?.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ position: 'relative' }}>
        {/* Sub Category Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Fashion & Apparel</h2>
            <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80" alt="Fashion" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <Link to="/search?category=fashion-apparel" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Shop now</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Bags & Accessories</h2>
            <img src="https://plus.unsplash.com/premium_photo-1670963025497-d6d582ea9319?auto=format&fit=crop&w=300&q=80" alt="Bags" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <Link to="/search?category=bags-accessories" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Explore all</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Electronics & Gadgets</h2>
            <img src="https://images.unsplash.com/photo-1761641466573-f240b6e446de?auto=format&fit=crop&w=300&q=80" alt="Electronics" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <Link to="/search?category=electronics-gadgets" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>See more</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Footwear</h2>
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" alt="Footwear" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <Link to="/search?category=footwear" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Shop now</Link>
          </div>

        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {renderProductStrip(recommendations, recTitle)}
            {renderProductStrip(flashDeals, "Today's Flash Deals")}
            {galleryProducts.length > 0 && (
              <div className="gallery-panel">
                <div className="gallery-header">
                  <h2>Just In: Fresh Finds</h2>
                  <span>Every refresh brings a new lineup</span>
                </div>
                <div className="gallery-grid">
                  {galleryProducts.map((p) => (
                    <Link to={`/product/${p.id}`} key={`gallery-${p.id}`} className="gallery-card">
                      <div className="gallery-image">
                        <img src={p.image_url || `https://picsum.photos/seed/${p.id}/240`} alt={p.name} />
                      </div>
                      <div className="gallery-info">
                        <span>{p.name}</span>
                        <strong>₹{p.price?.toLocaleString()}</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
