import React, { useState, useEffect, useCallback } from 'react';
import './ShopPage.css';
import { functions } from '../firebaseConfig';
import { httpsCallable } from "firebase/functions";
import ProductCard from '../components/ProductCard';

const searchProducts = httpsCallable(functions, 'searchProducts');

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    category: '',
    region: '',
    minPrice: '',
    maxPrice: ''
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      
      if (activeFilters.minPrice) activeFilters.minPrice = Number(activeFilters.minPrice) * 100;
      if (activeFilters.maxPrice) activeFilters.maxPrice = Number(activeFilters.maxPrice) * 100;

      const result = await searchProducts(activeFilters);
      setProducts(result.data.products);
    } catch (err) {
      setError('Could not fetch products. Please try again later.');
      console.error(err);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="shop-page">
      <aside className="filter-sidebar">
        <h3>Filters</h3>
        <form onSubmit={handleApplyFilters}>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="weaving">Weaving</option>
              <option value="pottery">Pottery</option>
              <option value="painting">Painting</option>
              <option value="carving">Carving</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Region</label>
            <select name="region" value={filters.region} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="rajasthan">Rajasthan</option>
              <option value="gujarat">Gujarat</option>
              <option value="odisha">Odisha</option>
              <option value="uttar_pradesh">Uttar Pradesh</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range (in ₹)</label>
            <div className="price-inputs">
              <input 
                type="number" 
                name="minPrice" 
                placeholder="Min" 
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>-</span>
              <input 
                type="number" 
                name="maxPrice" 
                placeholder="Max" 
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <button type="submit" className="apply-filters-btn">Apply Filters</button>
        </form>
      </aside>

      <section className="product-grid-container">
        {loading && <p>Loading products...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && (
          products.length > 0 ? (
            <div className="shop-product-grid">
              {products.map(product => (
                
                <ProductCard key={product.id} product={{...product, price: product.price / 100}} />
              ))}
            </div>
          ) : (
            <p>No products found matching your criteria.</p>
          )
        )}
      </section>
    </div>
  );
};

export default ShopPage;