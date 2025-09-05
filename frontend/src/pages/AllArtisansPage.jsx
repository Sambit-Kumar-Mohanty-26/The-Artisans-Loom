import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './AllArtisansPage.css';

const getAllArtisans = httpsCallable(functions, 'getAllArtisans');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Meet Our Artisans",
  subtitle: "Discover the talented masters preserving India's rich craft heritage.",
  loadingText: "Loading artisans...",
  searchPlaceholder: "Search by artisan name or craft...",
};

const ArtisanGridCard = ({ artisan, onNavigate }) => {
  const imageUrl = artisan.photoURL || `https://ui-avatars.com/api/?name=${artisan.displayName.replace(' ', '+')}&background=EFEAE4&color=A5805E`;
  
  return (
    <div 
        className="artisan-grid-card"
        onClick={() => onNavigate(`artisan/${artisan.id}`)}
    >
        <img src={imageUrl} alt={artisan.displayName} className="artisan-grid-image" />
        <div className="artisan-grid-info">
            <h3 className="artisan-grid-name">{artisan.displayName}</h3>
            <p className="artisan-grid-specialty">{artisan.specialization}</p>
        </div>
    </div>
  );
};

const AllArtisansPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [allArtisans, setAllArtisans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState(englishContent);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const result = await getAllArtisans();
        const sortedArtisans = result.data.artisans.sort((a, b) => 
          a.displayName.localeCompare(b.displayName)
        );
        setAllArtisans(sortedArtisans);
      } catch (error) {
        console.error("Error fetching all artisans:", error);
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
          title: translations[0],
          subtitle: translations[1],
          loadingText: translations[2],
          searchPlaceholder: translations[3],
        });
      } catch (error) {
        console.error("Failed to translate AllArtisansPage content:", error);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const filteredArtisans = allArtisans.filter(artisan => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return (
      artisan.displayName.toLowerCase().includes(lowercasedFilter) ||
      artisan.specialization.toLowerCase().includes(lowercasedFilter)
    );
  });

  return (
    <div className={`all-artisans-page ${isTranslating ? 'translating' : ''}`}>
      <div className="page-header">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
        <div className="search-container">
          <input
            type="text"
            placeholder={content.searchPlaceholder}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <p className="loading-text">{content.loadingText}</p>
      ) : (
        <div className="artisans-grid-container">
          {filteredArtisans.map(artisan => (
            <ArtisanGridCard key={artisan.id} artisan={artisan} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllArtisansPage;
