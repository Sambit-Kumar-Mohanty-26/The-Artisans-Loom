import React,{useState, useEffect } from 'react';
import { functions } from '../firebaseConfig'; 
import { httpsCallable } from 'firebase/functions';
import { useLanguage } from '../context/LanguageContext';
import ArtisanCard from '../components/ArtisanCard';
import Button from '../components/Button';
import './FeaturedArtisans.css';

const getFeaturedArtisans = httpsCallable(functions, 'getFeaturedArtisans');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  tag: "⭐ Featured Artisans",
  title: "Meet the Masters Behind the Magic",
  subtitle: "Discover the incredible stories and heritage craftsmanship of India’s most talented artists.",
  loadingText: "Loading artisans...",
  browseButton: "Discover All Artisans",
};

const FeaturedArtisans = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [artisans, setArtisans] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const result = await getFeaturedArtisans();
        setArtisans(result.data.artisans);
      } catch (error) {
        console.error("Error fetching featured artisans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
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
          loadingText: translations[3],
          browseButton: translations[4],
        });
      } catch (error) {
        console.error("Failed to translate FeaturedArtisans content:", error);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  return (
    <section className="featured-artisans-section">
      <div className={`section-header ${isTranslating ? 'translating' : ''}`}>
        <span className="section-tag">{content.tag}</span>
        <h2 className="section-title">{content.title}</h2>
        <p className="section-subtitle">{content.subtitle}</p>
      </div>
      
      {loading ? (
        <p>{content.loadingText}</p>
      ) : (
        <div className="artisans-grid">
          {artisans.map((artisan) => (
            <ArtisanCard 
              key={artisan.id} 
              artisan={artisan} 
              onNavigate={onNavigate} 
            />
          ))}
        </div>
      )}

      <div className="section-footer">
        <Button 
            text={content.browseButton}
            type="dark" 
            onClick={() => onNavigate('all-artisans')} 
        />
      </div>
    </section>
  );
};

export default FeaturedArtisans;