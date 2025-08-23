import React from 'react';
import './RegionCard.css';

const RegionCard = ({ region }) => {
  return (
    <div className="region-card">
      <div className="region-card-header">
        <h3 className="region-name">{region.name}</h3>
        <span className="region-pin" style={{ backgroundColor: region.pinColor }}>📍</span>
      </div>
      <p className="region-stats">{region.artisans} artisans • {region.products} products</p>
      <p className="region-description">{region.description}</p>
      <div className="region-craft-tags">
        {region.crafts.map((craft) => (
          <span key={craft} className="craft-tag">{craft}</span>
        ))}
      </div>
      <a href="#" className="explore-link">
        Explore {region.name} →
      </a>
    </div>
  );
};

export default RegionCard;