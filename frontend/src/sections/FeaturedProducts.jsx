import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, getDocs, limit, query, where } from 'firebase/firestore'; 
import ProductCard from '../components/ProductCard';
import './FeaturedProducts.css';
import Button from '../components/Button';

const FeaturedProducts = ({ onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, limit(3)); 
        
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="featured-products-section">
        <p>Loading featured crafts...</p>
      </section>
    );
  }

  return (
    <section className="featured-products-section">
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