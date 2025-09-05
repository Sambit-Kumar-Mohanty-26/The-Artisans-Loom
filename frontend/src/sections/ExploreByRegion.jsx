import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './ExploreByRegion.css';
import indiaMap from '../assets/images/india-map.png';
import Button from '../components/Button';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  tag: "📍 Regional Discovery",
  title: "Follow the Threads of Tradition",
  inspireButton: "🔄 Inspire Me",
  generatingButton: "Generating...",
  subtitle: "Embark on a curated journey through India's craft corridors, or use our interactive map to forge your own path.",
  mapButton: "Launch Interactive Map",
  atlasButton: "View the Craft Atlas",
};

const initialCraftJourneys = [
  { name: 'The Desert Weavers', description: 'Journey through the vibrant textile traditions of Rajasthan and Gujarat...', icon: '🏜️' },
  { name: 'The Eastern Painters', description: 'Discover the intricate and colorful folk painting styles of Odisha, Bihar...', icon: '🎨' },
  { name: 'The Southern Temple Crafts', description: 'Explore the sacred arts of the south, from Tanjore paintings to bronze idols...', icon: '🏛️' },
  { name: 'The Himalayan Artisans', description: 'Experience the warmth of the mountains with handwoven Pashmina shawls...', icon: '🏔️' },
];

const JourneyCard = ({ journey, onNavigate }) => (
  <div className="category-card" onClick={() => onNavigate('shop')}>
    <div className="category-icon">{journey.icon}</div>
    <h3 className="category-name">{journey.name}</h3>
    <p className="category-description">{journey.description}</p>
  </div>
);

const ExploreByRegion = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [journeys, setJourneys] = useState(initialCraftJourneys);
  const [content, setContent] = useState(englishContent);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const navigateToMap = () => {
    window.location.href = '/map.html';
  };

  const fetchNewJourneys = async () => {
    setIsLoading(true);
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";
    const prompt = `
      You are a creative tour guide for an Indian artisan marketplace. 
      Generate 4 unique and evocative "Craft Journeys" in ${currentLanguage.name}. 
      Each journey must have a "name", a short "description" (around 20 words), and a single relevant "icon" (emoji).
      The journeys should group together culturally or geographically related craft traditions of India.
      Return the response as a valid JSON array of objects. Do not include any other text or markdown.
    `;

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
      if (!response.ok) throw new Error(`Proxy call failed`);
      
      const result = await response.json();
      const cleanedString = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
      const newJourneys = JSON.parse(cleanedString);
      setJourneys(newJourneys);
    } catch (error) {
      console.error("Failed to fetch new journeys:", error);
      setJourneys(initialCraftJourneys); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        setJourneys(initialCraftJourneys); 
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
          inspireButton: translations[2],
          generatingButton: translations[3],
          subtitle: translations[4],
          mapButton: translations[5],
          atlasButton: translations[6],
        });
        fetchNewJourneys();
      } catch (err) {
        console.error("Failed to translate ExploreByRegion content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  return (
    <section className="explore-region-section">
      <div className={`section-header ${isTranslating ? 'translating' : ''}`}>
        <span className="section-tag">{content.tag}</span>
        <div className="title-with-refresh">
          <h2 className="section-title">{content.title}</h2>
          <button onClick={fetchNewJourneys} disabled={isLoading} className="refresh-button">
              {isLoading ? content.generatingButton : content.inspireButton}
          </button>
        </div>
        <p className="section-subtitle">{content.subtitle}</p>
      </div>
      <div className="region-content-layout">
        <div className="map-container">
          <img src={indiaMap} alt="Map of India highlighting craft regions" />
          <Button 
            text={content.mapButton}
            type="secondary" 
            onClick={navigateToMap} 
          />
        </div>
        <div className={`category-grid ${isLoading ? 'loading-journeys' : ''}`}>
          {journeys.map((journey, index) => (
            <JourneyCard key={index} journey={journey} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
       <div className="section-footer">
        <Button 
          text={content.atlasButton} 
          type="dark" 
          onClick={() => onNavigate('all-states')} 
        />
      </div>
    </section>
  );
};

export default ExploreByRegion;
