import React, { useState, useEffect } from 'react';
import { functions } from '../firebaseConfig'; 
import { httpsCallable } from 'firebase/functions'; 
import ProductCard from '../components/ProductCard';
import './FeaturedProducts.css';
import Button from '../components/Button';

const getFeaturedProducts = httpsCallable(functions, 'getFeaturedProducts');

const FeaturedProducts = ({ onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await getFeaturedProducts();
        setProducts(result.data.products);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); 

  if (loading) {
    return (
      <section className="featured-products-section">
        <div className="section-header">
          <h2>Discover Our Treasures</h2>
          <p>Handpicked crafts from the heart of India, curated for you.</p>
        </div>
        <p>Loading featured crafts...</p>
      </section>
    );
  }

  return (
    <section className="featured-products-section">
      <div className="section-header">
        <h2>Discover Our Treasures</h2>
        <p>Handpicked crafts from the heart of India, curated for you.</p>
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="section-footer">
        <Button 
          text="Browse All Products" 
          type="dark" 
          onClick={() => onNavigate('shop')} 
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;