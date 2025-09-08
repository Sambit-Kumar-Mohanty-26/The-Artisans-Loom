import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import './TrendingSection.css';

const getTrendingProducts = httpsCallable(functions, 'getTrendingProducts');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  tag: "🔥 Trending Now",
  title: "Hot on the Loom",
  subtitle: "See what's capturing the hearts of our community this week.",
  viewAllButton: "View All Trending",
  loading: "Loading trends...",
};

const TrendingSection = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const result = await getTrendingProducts({ filter: 'week', limit: 6 }); 
        setProducts(result.data.products);
      } catch (error) {
        console.error("Error fetching homepage trending products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
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
          tag: translations[0],
          title: translations[1],
          subtitle: translations[2],
          viewAllButton: translations[3],
          loading: translations[4],
        });
      } catch (err) {
        console.error("Failed to translate TrendingSection content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleWheelScroll = (e) => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <section className={`trending-section ${isTranslating ? 'translating' : ''}`}>
      <div className="swoop-divider top"></div>
      <div className="section-header">
        <span className="section-tag">{content.tag}</span>
        <h2 className="section-title">{content.title}</h2>
        <p className="section-subtitle">{content.subtitle}</p>
      </div>
      
      {loading ? (
        <p className="loading-text">{content.loading}</p>
      ) : (
        <div 
          className="trending-products-carousel" 
          ref={scrollContainerRef}
          onWheel={handleWheelScroll}
        >
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="carousel-item" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} onNavigate={onNavigate} />
            </div>
          ))}
        </div>
      )}

      <div className="section-footer">
        <Button 
          text={content.viewAllButton}
          type="dark" 
          onClick={() => onNavigate('trending')} 
        />
      </div>
    </section>
  );
};

export default TrendingSection;