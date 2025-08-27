import React from 'react';
import './AllArtisansPage.css';
// --- UPDATED: Import the data from the central file ---
import { allArtisansData } from '../data/artisans';

const ArtisanGridCard = ({ artisan, onNavigate }) => (
    <div 
        className="artisan-grid-card"
        onClick={() => onNavigate(`artisan/${artisan.id}`)}
    >
        <img src={artisan.image} alt={artisan.name} className="artisan-grid-image" />
        <div className="artisan-grid-info">
            <h3 className="artisan-grid-name">{artisan.name}</h3>
            <p className="artisan-grid-specialty">{artisan.specialty}</p>
        </div>
    </div>
);

const AllArtisansPage = ({ onNavigate }) => {
  // --- REMOVED: The local data array has been deleted ---
  // It now uses the imported allArtisansData

  return (
    <div className="all-artisans-page">
      <div className="page-header">
        <h1>Meet Our Artisans</h1>
        <p>Discover the talented masters preserving India's rich craft heritage.</p>
      </div>
      <div className="artisans-grid-container">
        {allArtisansData.map(artisan => (
          <ArtisanGridCard key={artisan.id} artisan={artisan} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export default AllArtisansPage;

