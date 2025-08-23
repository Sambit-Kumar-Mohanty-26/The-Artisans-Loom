import React from 'react';
import RegionCard from '../components/RegionCard';
import './ExploreByRegion.css';
import indiaMap from '../assets/images/india-map.png';
import Button from '../components/Button';

const regionData = [
  {
    name: 'Rajasthan',
    artisans: 85,
    products: 340,
    description: 'Royal textile traditions dating back to 12th century.',
    crafts: ['Block Printing', 'Miniature Painting', 'Bandhani'],
    pinColor: '#d96a3b',
  },
  {
    name: 'Kerala',
    artisans: 62,
    products: 245,
    description: 'Coastal artistry influenced by maritime trade.',
    crafts: ['Coir Weaving', 'Kathakali Masks', 'Spice Crafts'],
    pinColor: '#3a9a8a',
  },
  {
    name: 'West Bengal',
    artisans: 94,
    products: 412,
    description: 'Rich cultural tapestry from ancient Bengal.',
    crafts: ['Kantha Embroidery', 'Terracotta', 'Dokra Art'],
    pinColor: '#e4c06a',
  },
  {
    name: 'Odisha',
    artisans: 58,
    products: 198,
    description: 'Temple art traditions spanning over 1000 years.',
    crafts: ['Palm Leaf Art', 'Pattachitra', 'Silver Filigree'],
    pinColor: '#4a7a9a',
  },
];

const ExploreByRegion = () => {
  return (
    <section className="explore-region-section">
      <div className="section-header">
        <span className="section-tag">📍 Regional Discovery</span>
        <h2 className="section-title">Explore India's Craft Heritage by Region</h2>
        <p className="section-subtitle">
          Journey through different states to discover unique traditional crafts, each telling the story of its land and people.
        </p>
      </div>
      <div className="region-content-layout">
        <div className="map-container">
          <img src={indiaMap} alt="Map of India highlighting craft regions" />
          <Button text="Launch Interactive Map" type="secondary" />
        </div>
        <div className="region-list">
          {regionData.map((region) => (
            <RegionCard key={region.name} region={region} />
          ))}
        </div>
      </div>
      <div className="section-footer">
        <Button text="View All 29 States" type="dark" />
      </div>
    </section>
  );
};

export default ExploreByRegion;