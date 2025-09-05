import React, { useState, useEffect } from 'react';
import { functions } from '../firebaseConfig'; 
import { httpsCallable } from 'firebase/functions'; 
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import './FeaturedProducts.css';
import Button from '../components/Button';

const getFeaturedProducts = httpsCallable(functions, 'getFeaturedProducts');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Discover Our Treasures",
  subtitle: "Handpicked crafts from the heart of India, curated for you.",
  loadingText: "Loading featured crafts...",
  browseButton: "Browse All Products",
};

const FeaturedProducts = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

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

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }

      setIsTranslating(true); 
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({
          texts: textsToTranslate,
          targetLanguageCode: currentLanguage.code,
        });
        
        const translations = result.data.translations;
        setContent({
          title: translations[0],
          subtitle: translations[1],
          loadingText: translations[2],
          browseButton: translations[3],
        });
      } catch (error) {
        console.error("Failed to translate FeaturedProducts content:", error);
        setContent(englishContent); 
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [currentLanguage]);

  if (loading) {
    return (
      <section className="featured-products-section">
        <div className="section-header">
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>
        </div>
        <p>{content.loadingText}</p>
      </section>
    );
  }

  return (
    <section className="featured-products-section">
      <div className={`section-header ${isTranslating ? 'translating' : ''}`}>
        <h2>{content.title}</h2>
        <p>{content.subtitle}</p>
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="section-footer">
        <Button 
          text={content.browseButton}
          type="dark" 
          onClick={() => onNavigate('shop')} 
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;