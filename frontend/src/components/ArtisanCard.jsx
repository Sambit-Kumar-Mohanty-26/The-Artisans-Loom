import React from 'react';
import './ArtisanCard.css';

const ArtisanCard = ({ artisan, onNavigate }) => {
  const name = artisan?.displayName || 'Unnamed Artisan';
  const location = artisan?.location || 'India';
  const imageUrl = artisan?.photoURL || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=EFEAE4&color=A5805E`; // Generates a fallback avatar
  
  const craft = artisan?.specialization || 'Master Artisan';
  const story = artisan?.story || 'A dedicated artisan preserving traditional crafts. Click to view profile and learn more.';
  
  const rating = artisan?.rating || null;
  const experience = artisan?.experience || null; 

  const handleViewProfile = (e) => {
    e.stopPropagation();
    onNavigate(`artisan/${artisan.id}`);
  };

  const handleShopNow = (e) => {
    e.stopPropagation();
    onNavigate('shop'); 
  };
  
  return (
    <div className="artisan-card" onClick={handleViewProfile}>
      <div className="artisan-card-image-container">
        <img src={imageUrl} alt={name} className="artisan-card-image" />
        <span className="artisan-card-badge">{craft}</span>
      </div>
      <div className="artisan-card-content">
        <h3 className="artisan-card-name">{name}</h3>
        <p className="artisan-card-location">{location}</p>
        <p className="artisan-card-story">
          {story.substring(0, 100)}{story.length > 100 ? '...' : ''}
        </p>
        <div className="artisan-card-stats">
          {rating && (
            <div className="stat">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{rating.toFixed(1)}</span>
            </div>
          )}
          {experience && (
            <div className="stat">
              <span className="stat-icon">🕰️</span>
              <span className="stat-value">{experience}+ years</span>
            </div>
          )}
        </div>
        <div className="artisan-card-actions">
          <button className="action-btn primary" onClick={handleViewProfile}>View Profile</button>
          <button className="action-btn secondary" onClick={handleShopNow}>Shop Now</button>
        </div>
      </div>
    </div>
  );
};

export default ArtisanCard;