import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from "firebase/functions";
import ProductCard from '../components/ProductCard';
import './ShopPage.css';

const searchProducts = httpsCallable(functions, 'searchProducts');
const getAiRecommendations = httpsCallable(functions, 'getAiRecommendations');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  filtersTitle: "Filters",
  sortByLabel: "Sort By",
  newestOption: "Newest Arrivals",
  priceLowHighOption: "Price: Low to High",
  priceHighLowOption: "Price: High to Low",
  categoryLabel: "Category",
  allOption: "All",
  materialLabel: "Material",
  regionLabel: "Region",
  priceRangeLabel: "Price Range (in ₹)",
  minPlaceholder: "Min",
  maxPlaceholder: "Max",
  applyButton: "Apply Filters",
  searchResultsTitle: "Search Results",
  clearSearchButton: "Clear Search",
  loadingProducts: "Loading products...",
  noProducts: "No products found matching your criteria.",
  recsLoading: "Generating personalized recommendations...",
  recsTitle: "A Weaver's Journey: Related Crafts",
  viewProductButton: "View Product",
};

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ShopPage = ({ initialSearch = null, clearSearch = () => {}, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [products, setProducts] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [isRecsLoading, setIsRecsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [filters, setFilters] = useState({
    category: '', region: '', minPrice: '', maxPrice: '', materials: '', sortBy: 'createdAt_desc',
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
          filtersTitle: translations[0], sortByLabel: translations[1], newestOption: translations[2],
          priceLowHighOption: translations[3], priceHighLowOption: translations[4], categoryLabel: translations[5],
          allOption: translations[6], materialLabel: translations[7], regionLabel: translations[8],
          priceRangeLabel: translations[9], minPlaceholder: translations[10], maxPlaceholder: translations[11],
          applyButton: translations[12], searchResultsTitle: translations[13], clearSearchButton: translations[14],
          loadingProducts: translations[15], noProducts: translations[16], recsLoading: translations[17],
          recsTitle: translations[18], viewProductButton: translations[19],
        });
      } catch (err) {
        console.error("Failed to translate ShopPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

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
    if (loading) return <p>{content.loadingProducts}</p>;
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
    return <p className="no-products-message">{content.noProducts}</p>;
  };

  return (
    <div className={`shop-page ${isTranslating ? 'translating' : ''}`}>
      <aside className="filter-sidebar">
        <h3>{content.filtersTitle}</h3>
        <form onSubmit={handleApplyFilters}>
          <div className="filter-group">
            <label>{content.sortByLabel}</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt_desc">{content.newestOption}</option>
              <option value="price_asc">{content.priceLowHighOption}</option>
              <option value="price_desc">{content.priceHighLowOption}</option>
            </select>
          </div>
          <div className="filter-group">
            <label>{content.categoryLabel}</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">{content.allOption}</option>
              <option value="weaving">Weaving</option>
              <option value="pottery">Pottery</option>
              <option value="painting">Painting</option>
              <option value="carving">Carving</option>
            </select>
          </div>
          <div className="filter-group">
            <label>{content.materialLabel}</label>
            <select name="materials" value={filters.materials} onChange={handleFilterChange}>
              <option value="">{content.allOption}</option>
              <option value="silk">Silk</option>
              <option value="cotton">Cotton</option>
              <option value="terracotta">Terracotta</option>
              <option value="wood">Wood</option>
              <option value="brass">Brass</option>
            </select>
          </div>
          <div className="filter-group">
            <label>{content.regionLabel}</label>
            <select name="region" value={filters.region} onChange={handleFilterChange}>
              <option value="">{content.allOption}</option>
              <option value="rajasthan">Rajasthan</option>
              <option value="gujarat">Gujarat</option>
              <option value="odisha">Odisha</option>
              <option value="uttar_pradesh">Uttar Pradesh</option>
            </select>
          </div>
          <div className="filter-group">
            <label>{content.priceRangeLabel}</label>
            <div className="price-inputs">
              <input type="number" name="minPrice" placeholder={content.minPlaceholder} value={filters.minPrice} onChange={handleFilterChange} />
              <span>-</span>
              <input type="number" name="maxPrice" placeholder={content.maxPlaceholder} value={filters.maxPrice} onChange={handleFilterChange} />
            </div>
          </div>
          <button type="submit" className="apply-filters-btn">{content.applyButton}</button>
        </form>
      </aside>

      <section className="product-grid-container">
        {isSearchResult && (
          <div className="search-result-header">
            <h2>{content.searchResultsTitle}</h2>
            <button onClick={handleClearSearch} className="clear-search-btn">
              <CloseIcon /> {content.clearSearchButton}
            </button>
          </div>
        )}
        
        {renderProductGrid()}

        {isRecsLoading && (
          <div className="recommendations-loader">
            <div className="spinner"></div>
            {content.recsLoading}
          </div>
        )}

        {aiRecommendations.length > 0 && (
          <div className="ai-recommendations-section">
            <h2 className="recommendations-title">{content.recsTitle}</h2>
            <div className="recommendation-cards-container">
              {aiRecommendations.map(rec => (
                <div key={rec.id} className="recommendation-card">
                  <img src={rec.imageUrl} alt={rec.name} className="recommendation-image" />
                  <div className="recommendation-content">
                    <h3 className="recommendation-name">{rec.name}</h3>
                    <p className="recommendation-artisan">from {rec.region}</p>
                    <p className="recommendation-reason"><span className="reason-icon">✨</span> {rec.reason}</p>
                    <button className="recommendation-button" onClick={() => onNavigate(`product/${rec.id}`)}>{content.viewProductButton}</button>
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