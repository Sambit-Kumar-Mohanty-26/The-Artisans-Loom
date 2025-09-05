import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './Hero.css';
import artisanHero from '../assets/images/artisan-hero.jpg';
import Button from '../components/Button';
import AdvancedSearchBar from '../components/AdvancedSearchBar'; 

const getTranslations = httpsCallable(functions, 'getTranslations');
const englishContent = {
  tagline: "✨ मिट्टी से | परम्परा हाट",
  title: "The Artisan's <br /> Loom",
  subtitle: "Empowering Indian artisans with AI-powered tools while connecting the world to authentic, handmade treasures that carry centuries of cultural heritage.",
  feature1: "♡ Voice-powered listings",
  feature2: "♡ Regional discovery",
  feature3: "♡ Story-rich profiles",
  feature4: "♡ Multilingual support",
  discoverButton: "Discover Authentic Crafts",
  joinButton: "Join as Artisan",
  stat1Label: "Verified Artisans",
  stat2Label: "States Represented",
  stat3Label: "Craft Traditions",
};

const Hero = ({ onNavigate, onSearch }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }

      setIsTranslating(true);
      try {
        const textsToTranslate = [
          englishContent.tagline,
          englishContent.title.replace('<br />', ''), 
          englishContent.subtitle,
          englishContent.feature1,
          englishContent.feature2,
          englishContent.feature3,
          englishContent.feature4,
          englishContent.discoverButton,
          englishContent.joinButton,
          englishContent.stat1Label,
          englishContent.stat2Label,
          englishContent.stat3Label,
        ];

        const result = await getTranslations({ 
          texts: textsToTranslate, 
          targetLanguageCode: currentLanguage.code 
        });
        
        const translations = result.data.translations;
      
        setContent({
          tagline: translations[0],
          title: translations[1],
          subtitle: translations[2],
          feature1: translations[3],
          feature2: translations[4],
          feature3: translations[5],
          feature4: translations[6],
          discoverButton: translations[7],
          joinButton: translations[8],
          stat1Label: translations[9],
          stat2Label: translations[10],
          stat3Label: translations[11],
        });

      } catch (error) {
        console.error("Failed to translate Hero content:", error);
        setContent(englishContent);
      } finally {
        setIsTranslating(false)
      }
    };

    translateContent();
  }, [currentLanguage]);

  return (
    <section className="hero-section">
      <div className={`hero-content ${isTranslating ? 'translating' : ''}`}>
        <div className="language-toggle">{content.tagline}</div>
        <h1 
          className="hero-title"
          dangerouslySetInnerHTML={{ __html: content.title }} // Use this to render the <br /> tag
        >
        </h1>
        <p className="hero-subtitle">{content.subtitle}</p>

        <AdvancedSearchBar onSearch={onSearch} />

        <div className="features-grid">
          <div className="feature-item">{content.feature1}</div>
          <div className="feature-item">{content.feature2}</div>
          <div className="feature-item">{content.feature3}</div>
          <div className="feature-item">{content.feature4}</div>
        </div>
        <div className="hero-buttons">
          <Button 
            text={content.discoverButton}
            type="primary" 
            onClick={() => onNavigate('shop')} 
          />
          <Button 
            text={content.joinButton} 
            type="dark" 
            onClick={() => onNavigate('auth')} 
          />
        </div>
        <div className="stats">
          <div className="stat-item">
            <strong>500+</strong>
            <p>{content.stat1Label}</p>
          </div>
          <div className="stat-item">
            <strong>25</strong>
            <p>{content.stat2Label}</p>
          </div>
          <div className="stat-item">
            <strong>15+</strong>
            <p>{content.stat3Label}</p>
          </div>
        </div>
      </div>
      <div className="hero-image-container">
        <img src={artisanHero} alt="Artisan making pottery" className="hero-image" />
      </div>
    </section>
  );
};

export default Hero;