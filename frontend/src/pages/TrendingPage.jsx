import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import ProductCard from '../components/ProductCard';
import './TrendingPage.css';

const getTrendingProducts = httpsCallable(functions, 'getTrendingProducts');
const getTrendingInsights = httpsCallable(functions, 'getTrendingInsights');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Trending on the Loom",
  subtitle: "Discover the most loved and sought-after crafts from our artisan community.",
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  loading: "Discovering trends...",
  noResults: "No trending products found for this period. Check back soon!",
  insightsTitle: "Mitra's Market Insights",
  backToHome: "Back to Home",
};

const BackButton = ({ onNavigate, text }) => {
  return (
    <button className="back-to-home-btn" onClick={() => onNavigate('home')}>
      <span className="btn-icon">←</span>
      <span className="btn-text">{text}</span>
    </button>
  );
};

const TrendingPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [activeFilter, setActiveFilter] = useState('week');

  const filters = [
    { key: 'day', label: content.today },
    { key: 'week', label: content.week },
    { key: 'month', label: content.month },
    { key: 'year', label: content.year },
  ];

  const fetchTrendingData = useCallback(async (filter) => {
    setLoading(true);
    setLoadingInsight(true);
    setProducts([]);
    setInsight('');
    try {
      const productsResult = await getTrendingProducts({ filter: filter, limit: 12 });
      const trendingProducts = productsResult.data.products;
      setProducts(trendingProducts);

      if (trendingProducts.length > 0) {
        const insightResult = await getTrendingInsights({
          trendingProducts: trendingProducts.slice(0, 3), 
          filter: filters.find(f => f.key === filter)?.label || filter,
          language: currentLanguage.name,
        });
        setInsight(insightResult.data.insight);
      }
    } catch (error) {
      console.error(`Error fetching trending data for filter "${filter}":`, error);
    } finally {
      setLoading(false);
      setLoadingInsight(false);
    }
  }, [currentLanguage.name]);

  useEffect(() => {
    fetchTrendingData(activeFilter);
  }, [activeFilter, fetchTrendingData]);

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({ texts: textsToTranslate, targetLanguageCode: currentLanguage.code });
        const translations = result.data.translations;
        setContent({
          title: translations[0], subtitle: translations[1], today: translations[2],
          week: translations[3], month: translations[4], year: translations[5],
          loading: translations[6], noResults: translations[7], insightsTitle: translations[8], backToHome: translations[9],
        });
        fetchTrendingData(activeFilter);
      } catch (err) {
        console.error("Failed to translate TrendingPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage, activeFilter, fetchTrendingData]);

  return (
    <div className={`trending-page ${isTranslating ? 'translating' : ''}`}>
      <BackButton onNavigate={onNavigate} text={content.backToHome} />

      <div className="trending-hero">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </div>

      <div className="filter-bar-container">
        <div className="filter-bar">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-btn ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="trending-results">
        {(loadingInsight || insight) && (
            <div className="ai-insight-box">
                <h3>{content.insightsTitle}</h3>
                {loadingInsight ? (
                    <p className="insight-loading">Crafting an analysis for you...</p>
                ) : (
                    <p>{insight}</p>
                )}
            </div>
        )}

        {loading ? (
          <div className="page-loader">{content.loading}</div>
        ) : products.length > 0 ? (
          <div className="shop-product-grid">
            {products.map((product, index) => (
              <div key={product.id} className="grid-item-animated" style={{ animationDelay: `${index * 0.05}s` }}>
                <ProductCard product={product} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results-message">{content.noResults}</p>
        )}
      </div>
    </div>
  );
};

export default TrendingPage;