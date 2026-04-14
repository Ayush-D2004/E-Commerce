import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
import { Star } from 'lucide-react';

export default function HomePage() {
  const [flashDeals, setFlashDeals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recTitle, setRecTitle] = useState("Recommended for you");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, recsRes] = await Promise.all([
          apiClient.get('/products/flash-deals'),
          apiClient.get('/recommendations/personalized')
        ]);
        setFlashDeals(dealsRes.data || []);
        
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
      <div style={{ 
        height: '350px', 
        background: 'linear-gradient(to bottom, #004c5c, #eaeded)',
        position: 'relative'
       }}>
      </div>

      <div className="container" style={{ position: 'relative', top: '-150px' }}>
        {/* Sub Category Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>New Season Fashion</h2>
             <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80" alt="New Season" style={{ width: '100%', height: '250px', objectFit: 'cover' }}/>
             <Link to="/search?category=new-season" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Shop now</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Premium Handbags</h2>
             <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=300&q=80" alt="Handbags" style={{ width: '100%', height: '250px', objectFit: 'cover' }}/>
             <Link to="/search?category=bags" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Explore all</Link>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Luxury Watches</h2>
             <img src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=300&q=80" alt="Watches" style={{ width: '100%', height: '250px', objectFit: 'cover' }}/>
             <Link to="/search?category=watches" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>See more</Link>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', height: '400px' }}>
             <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Footwear Collection</h2>
             <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" alt="Shoes" style={{ width: '100%', height: '250px', objectFit: 'cover' }}/>
             <Link to="/search?category=shoes" style={{ color: '#007185', display: 'block', marginTop: '15px', fontSize: '14px' }}>Shop now</Link>
          </div>

        </div>

        {loading ? (
            <p>Loading...</p>
        ) : (
            <>
                {renderProductStrip(recommendations, recTitle)}
                {renderProductStrip(flashDeals, "Today's Flash Deals")}
            </>
        )}

      </div>
    </div>
  );
}
