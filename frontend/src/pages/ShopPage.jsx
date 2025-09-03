import React, { useState, useEffect, useCallback } from 'react';
import './ShopPage.css';
import { functions } from '../firebaseConfig';
import { httpsCallable } from "firebase/functions";
import ProductCard from '../components/ProductCard';

const searchProducts = httpsCallable(functions, 'searchProducts');
const getAiRecommendations = httpsCallable(functions, 'getAiRecommendations');

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShopPage = ({ initialSearch = null, clearSearch = () => {}, onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    region: '',
    minPrice: '',
    maxPrice: '',
    materials: '',
    sortBy: 'createdAt_desc',
  });

  const fetchProducts = useCallback(async (currentFilters) => {
    setLoading(true);
    setError('');
    setAiRecommendations([]);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([, value]) => value !== '' && value !== null)
      );
      
      if (activeFilters.minPrice) activeFilters.minPrice = Number(activeFilters.minPrice) * 100;
      if (activeFilters.maxPrice) activeFilters.maxPrice = Number(activeFilters.maxPrice) * 100;

      const result = await searchProducts(activeFilters);
      setProducts(result.data.products);
    } catch (err) {
      setError('Could not fetch products. Please try again later.');
      console.error("Firebase function error:", err);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    const fetchAiRecs = async () => {
      if (isSearchResult && products.length > 0) {
        setIsRecsLoading(true);
        setAiRecommendations([]);
        try {
          const mainProduct = products[0];
          const result = await getAiRecommendations({ mainProduct });
          setAiRecommendations(result.data.recommendations || []);
        } catch (err) {
          console.error("Failed to fetch AI recommendations:", err);
        } finally {
          setIsRecsLoading(false);
        }
      }
    };
    fetchAiRecs();
  }, [products, isSearchResult]);

  useEffect(() => {
    const performSearch = async () => {
      setAiRecommendations([]); 
      if (initialSearch) {
        setLoading(true);
        setError('');
        setIsSearchResult(true);
        if (initialSearch.type === 'visual') {
          setProducts(initialSearch.payload);
        } else if (initialSearch.type === 'text') {
          try {
            const result = await searchProducts({ q: initialSearch.payload });
            setProducts(result.data.products);
          } catch (err) {
            setError('Could not fetch products for your search.');
            console.error("Text search error:", err);
          }
        }
        setLoading(false);
      } else {
        setIsSearchResult(false);
        fetchProducts({ sortBy: 'createdAt_desc' });
      }
    };
    performSearch();
  }, [initialSearch, fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    clearSearch();
    fetchProducts(filters);
  };

  const handleClearSearch = () => {
    clearSearch(); 
    setAiRecommendations([]);
    setIsSearchResult(false);
  };

  const renderProductGrid = () => {
    if (loading) return <p>Loading products...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (products.length > 0) {
      return (
        <div className="shop-product-grid">
          {products.map(product => {
            const productCardData = {
              id: product.id,
              name: product.name,
              artisan: product.artisanName,
              price: product.price / 100,
              image: product.imageUrl,
            };
            return <ProductCard key={product.id} product={productCardData} onNavigate={onNavigate} />;
          })}
        </div>
      );
    }
    return <p className="no-products-message">No products found matching your criteria.</p>;
  };

  return (
    <div className="shop-page">
      <aside className="filter-sidebar">
        <h3>Filters</h3>
        <form onSubmit={handleApplyFilters}>
          <div className="filter-group">
            <label>Sort By</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}><option value="createdAt_desc">Newest Arrivals</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option></select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}><option value="">All</option><option value="weaving">Weaving</option><option value="pottery">Pottery</option><option value="painting">Painting</option><option value="carving">Carving</option></select>
          </div>
          <div className="filter-group">
            <label>Material</label>
            <select name="materials" value={filters.materials} onChange={handleFilterChange}><option value="">All</option><option value="silk">Silk</option><option value="cotton">Cotton</option><option value="terracotta">Terracotta</option><option value="wood">Wood</option><option value="brass">Brass</option></select>
          </div>
          <div className="filter-group">
            <label>Region</label>
            <select name="region" value={filters.region} onChange={handleFilterChange}><option value="">All</option><option value="rajasthan">Rajasthan</option><option value="gujarat">Gujarat</option><option value="odisha">Odisha</option><option value="uttar_pradesh">Uttar Pradesh</option></select>
          </div>
          <div className="filter-group">
            <label>Price Range (in ₹)</label>
            <div className="price-inputs"><input type="number" name="minPrice" placeholder="Min" value={filters.minPrice} onChange={handleFilterChange} /><span>-</span><input type="number" name="maxPrice" placeholder="Max" value={filters.maxPrice} onChange={handleFilterChange} /></div>
          </div>
          <button type="submit" className="apply-filters-btn">Apply Filters</button>
        </form>
      </aside>

      <section className="product-grid-container">
        {isSearchResult && (
          <div className="search-result-header">
            <h2>Search Results</h2>
            <button onClick={handleClearSearch} className="clear-search-btn">
              <CloseIcon /> Clear Search
            </button>
          </div>
        )}
        
        {renderProductGrid()}
        {isRecsLoading && (
          <div className="recommendations-loader">
            <div className="spinner"></div>
            Generating personalized recommendations...
          </div>
        )}

        {aiRecommendations.length > 0 && (
          <div className="ai-recommendations-section">
            <h2 className="recommendations-title">A Weaver's Journey: Related Crafts</h2>
            <div className="recommendation-cards-container">
              {aiRecommendations.map(rec => (
                <div key={rec.id} className="recommendation-card">
                  <img src={rec.imageUrl} alt={rec.name} className="recommendation-image" />
                  <div className="recommendation-content">
                    <h3 className="recommendation-name">{rec.name}</h3>
                    <p className="recommendation-artisan">from {rec.region}</p>
                    <p className="recommendation-reason">
                      <span className="reason-icon">✨</span> {rec.reason}
                    </p>
                    <button className="recommendation-button">View Product</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ShopPage;