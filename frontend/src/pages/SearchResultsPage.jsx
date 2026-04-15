import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import apiClient from '../apiClient';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isGlobalMode, setIsGlobalMode] = useState(false);
  const [globalOffset, setGlobalOffset] = useState(0);

  // Facet States
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('relevance');

  useEffect(() => {
    // Reset on param change
    setProducts([]);
    setPage(1);
    setGlobalOffset(0);
    setIsGlobalMode(false);
  }, [searchParams]);

  useEffect(() => {
    if (isGlobalMode) {
      fetchGlobalResults(globalOffset === 0);
    } else {
      fetchResults(page === 1);
    }
  }, [searchParams, page, isGlobalMode, globalOffset]);

  const fetchResults = async (isNew = false) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/products', {
        params: {
          term: query || undefined,
          category: category || undefined,
          standard_category: category || undefined,
          min_price: searchParams.get('min_price') || undefined,
          max_price: searchParams.get('max_price') || undefined,
          sort: searchParams.get('sort') || undefined,
          page: isNew ? 1 : page,
          page_size: 20
        }
      });
      if (isNew) {
        setProducts(data.items);
      } else {
        setProducts(prev => [...prev, ...data.items]);
      }
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalResults = async (isNew = false) => {
    setLoading(true);
    try {
      const offset = isNew ? 0 : globalOffset;

      // Map local slugs to Platzi Category IDs
      const categoryMap = {
        'clothes': 1, 'fashion': 1, 'new-season': 1, 'apparel': 1,
        'electronics': 2, 'tech': 2, 'gadgets': 2,
        'home': 3, 'furniture': 3, 'decor': 3,
        'shoes': 4, 'footwear': 4,
        'miscellaneous': 5, 'others': 5, 'beauty': 5, 'bags': 5, 'watches': 5
      };

      const matchedCatId = categoryMap[(category || query || '').toLowerCase()];
      let url = `https://api.escuelajs.co/api/v1/products/?offset=${offset}&limit=20`;
      
      if (matchedCatId) {
          url += `&categoryId=${matchedCatId}`;
      }
      
      // Always include title search if available for better relevance
      const searchTerm = query || category;
      if (searchTerm) {
          url += `&title=${searchTerm}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      const mapped = data.map(i => ({
        id: `ext-${i.id}`,
        name: i.title,
        price: i.price * 80, // rough INR conversion
        image_url: i.images?.[0] ? i.images[0].replace(/\["|"]/g, '') : '',
        rating: 4.5,
        review_count: Math.floor(Math.random() * 500) + 10,
        isExternal: true,
        description: i.description
      }));

      if (isNew) {
        setProducts(mapped);
      } else {
        setProducts(prev => [...prev, ...mapped]);
      }
      // Fake API doesn't return total count, we simulate an infinite stream until empty
      setTotal(prev => isNew ? mapped.length : prev + mapped.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (isGlobalMode) {
      setGlobalOffset(prev => prev + 20);
    } else {
      setPage(prev => prev + 1);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    if (minPrice) searchParams.set('min_price', minPrice);
    else searchParams.delete('min_price');
    
    if (maxPrice) searchParams.set('max_price', maxPrice);
    else searchParams.delete('max_price');
    
    if (sort) searchParams.set('sort', sort);
    
    setSearchParams(searchParams);
  };

  return (
    <div className="container" style={{ padding: '20px 0', display: 'flex', gap: '30px' }}>
      {/* Sidebar Filters */}
      <aside style={{ width: '250px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Filters</h3>
        
        <form onSubmit={applyFilters} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Price Range</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)}
                style={{ width: '80px', padding: '5px' }}
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)}
                style={{ width: '80px', padding: '5px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Sort By</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '5px', width: '100%' }}>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Average Customer Review</option>
            </select>
          </div>

          <button type="submit" className="sc-btn" style={{ width: '100%' }}>Apply Filters</button>
        </form>
      </aside>

      {/* Main Results Area */}
      <main style={{ flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
          {isGlobalMode ? "Global results for " : `${total} results for `}
          <span style={{ color: 'var(--amz-orange)' }}>"{query || category}"</span>
          {isGlobalMode && <span style={{fontSize: '14px', color: '#555', marginLeft: '10px'}}>(External Catalog)</span>}
        </h2>
        <hr style={{ margin: '15px 0', border: 'none', borderBottom: '1px solid #ddd' }} />

        {total === 0 && !loading && !isGlobalMode ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '20px', color: '#555', marginBottom: '15px' }}>
              No products available in your area under this category.
            </h3>
            <button 
              className="btn-primary" 
              onClick={() => setIsGlobalMode(true)}
              style={{ padding: '10px 20px', fontSize: '16px' }}
            >
              Show Global Products
            </button>
          </div>
        ) : total === 0 && !loading && isGlobalMode ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #ccc', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '20px', color: '#555', marginBottom: '15px' }}>
              No global products found for this search.
            </h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {products.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                <img 
                  src={p.image_url || `https://picsum.photos/seed/${p.id}/200`} 
                  alt={p.name} 
                  onError={(e) => { e.target.src = 'https://picsum.photos/200' }}
                  style={{ width: '200px', height: '200px', objectFit: 'contain', backgroundColor: '#f8f8f8' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Link to={p.isExternal ? '#' : `/product/${p.id}`} style={{ fontSize: '18px', fontWeight: 'bold', color: '#007185', textDecoration: 'none' }}>
                    {p.name}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill={i < Math.round(p.rating) ? 'var(--amz-yellow)' : 'none'} color="var(--amz-yellow)" />
                    ))}
                    <span style={{ color: '#007185', fontSize: '14px', marginLeft: '5px' }}>{p.review_count} ratings</span>
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                    <span style={{ fontSize: '14px' }}>₹</span>
                    <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{p.price.toLocaleString()}</span>
                  </div>
                  
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#565959' }}>
                    FREE delivery <strong>Tomorrow</strong><br />
                    Dispatched by {p.isExternal ? 'Global Partners' : 'ScalerCart'}
                  </div>
                </div>
              </div>
            ))}
            
            {(products.length < total || (isGlobalMode && products.length > 0 && products.length % 20 === 0)) && (
              <button 
                onClick={handleLoadMore} 
                className="sc-btn" 
                style={{ alignSelf: 'center', margin: '20px 0', padding: '10px 40px', backgroundColor: 'white' }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Products'}
              </button>
            )}
          </div>
        )}
        
        {loading && products.length === 0 && <div>Loading results...</div>}
      </main>
    </div>
  );
}
