import React, { useState } from 'react';
import './ExploreByRegion.css';
import indiaMap from '../assets/images/india-map.png';
import Button from '../components/Button';

const initialCraftJourneys = [
  {
    name: 'The Desert Weavers',
    description: 'Journey through the vibrant textile traditions of Rajasthan and Gujarat, from Bandhani tie-dye to Kutchi embroidery.',
    icon: '🏜️',
  },
  {
    name: 'The Eastern Painters',
    description: 'Discover the intricate and colorful folk painting styles of Odisha, Bihar, and West Bengal.',
    icon: '🎨',
  },
  {
    name: 'The Southern Temple Crafts',
    description: 'Explore the sacred arts of the south, from Tanjore paintings to the bronze idols of Tamil Nadu.',
    icon: '🏛️',
  },
  {
    name: 'The Himalayan Artisans',
    description: 'Experience the warmth of the mountains with handwoven Pashmina shawls and intricate woodwork.',
    icon: '🏔️',
  },
];

const JourneyCard = ({ journey, onNavigate }) => (
  <div 
    className="category-card"
    onClick={() => onNavigate('shop')}
  >
    <div className="category-icon">{journey.icon}</div>
    <h3 className="category-name">{journey.name}</h3>
    <p className="category-description">{journey.description}</p>
  </div>
);


const ExploreByRegion = ({ onNavigate }) => {
  const [journeys, setJourneys] = useState(initialCraftJourneys);
  const [isLoading, setIsLoading] = useState(false);

  const navigateToMap = () => {
    window.location.href = '/map.html';
  };

  const fetchNewJourneys = async () => {
    setIsLoading(true);
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";

    const prompt = `
      You are a creative tour guide for an Indian artisan marketplace. 
      Generate 4 unique and evocative "Craft Journeys". Each journey should have a "name", a short "description" (around 20 words), and a single relevant "icon" (emoji).
      The journeys should group together culturally or geographically related craft traditions of India.
      Return the response as a valid JSON array of objects. Do not include any other text or markdown.
    `;

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
      if (!response.ok) {
        throw new Error(`Proxy call failed with status: ${response.status}`);
      }
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

  return (
    <section className="explore-region-section">
      <div className="section-header">
        <span className="section-tag">📍 Regional Discovery</span>
        <div className="title-with-refresh">
          <h2 className="section-title">Follow the Threads of Tradition</h2>
          <button onClick={fetchNewJourneys} disabled={isLoading} className="refresh-button">
              {isLoading ? 'Generating...' : '🔄 Inspire Me'}
          </button>
        </div>
        <p className="section-subtitle">
          Embark on a curated journey through India's craft corridors, or use our interactive map to forge your own path.
        </p>
      </div>
      <div className="region-content-layout">
        <div className="map-container">
          <img src={indiaMap} alt="Map of India highlighting craft regions" />
          <Button 
            text="Launch Interactive Map" 
            type="secondary" 
            onClick={navigateToMap} 
          />
        </div>
        <div className="category-grid">
          {journeys.map((journey) => (
            <JourneyCard key={journey.name} journey={journey} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="section-footer">
        <Button 
          text="View the Craft Atlas" 
          type="dark" 
          onClick={() => onNavigate('all-states')} 
        />
        </div>
      </div>
    </section>
  );
};

export default ExploreByRegion;
