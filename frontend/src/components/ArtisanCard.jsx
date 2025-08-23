import React from 'react';
import './ArtisanCard.css';
import Button from './Button'; 

const ArtisanCard = ({ artisan }) => {
  return (
    <div className="artisan-card">
      <div className="artisan-card-header">
        <img src={artisan.image} alt={artisan.name} className="artisan-photo" />
        <div className="artisan-info">
          <h3 className="artisan-name">{artisan.name}</h3>
          <p className="artisan-location">{artisan.location}</p>
        </div>
        <span className="artisan-badge">{artisan.badge}</span>
      </div>
      <div className="artisan-craft-info">
        <span className="artisan-craft">{artisan.craft}</span> • {artisan.experience} years
      </div>
      <p className="artisan-description">{artisan.description}</p>
      <div className="artisan-card-stats">
        <span className="artisan-rating">⭐ {artisan.rating}</span>
        <span className="artisan-products">👥 {artisan.products} products</span>
      </div>
      <div className="artisan-card-actions">
        <Button text="View Profile" type="primary" />
        <Button text="Shop Now" type="secondary" />
      </div>
    </div>
  );
};

export default ArtisanCard;