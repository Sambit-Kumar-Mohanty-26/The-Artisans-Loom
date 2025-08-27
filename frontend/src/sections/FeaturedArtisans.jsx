import React from 'react';
import ArtisanCard from '../components/ArtisanCard';
import Button from '../components/Button';
import './FeaturedArtisans.css';


import kamalaDeviImg from '../assets/images/kamala-devi.png';
import arjunPatelImg from '../assets/images/arjun-patel.png';
import meeraSharmaImg from '../assets/images/meera-sharma.png';

const featuredArtisansData = [
  {
    id: 'kamala-devi-1',
    name: 'Kamala Devi',
    location: 'Rajasthan, India',
    badge: 'Heritage Master',
    craft: 'Block Printing', 
    experience: 25, 
    description: 'Master of traditional Rajasthani block printing, carrying forward her grandmother’s 100-year-old techniques.', // Corrected from 'bio'
    rating: 4.9,
    products: 42,
    image: kamalaDeviImg,
  },
  {
    id: 'arjun-patel-2',
    name: 'Arjun Patel',
    location: 'Gujarat, India',
    badge: 'Verified Artist',
    craft: 'Ceramic Pottery', 
    experience: 18,
    description: 'Third-generation potter specializing in traditional Gujarati ceramics with contemporary designs.',
    rating: 4.8,
    products: 36,
    image: arjunPatelImg,
  },
  {
    id: 'meera-sharma-3',
    name: 'Meera Sharma',
    location: 'Odisha, India',
    badge: 'Cultural Guardian',
    craft: 'Palm Leaf Engraving', 
    experience: 22,
    description: 'Preserving the ancient art of palm leaf manuscripts and traditional Odishan engravings.',
    rating: 4.9,
    products: 28,
    image: meeraSharmaImg,
  },
];

const FeaturedArtisans = ({ onNavigate }) => {
  return (
    <section className="featured-artisans-section">
      <div className="section-header">
        <span className="section-tag">⭐ Featured Artisans</span>
        <h2 className="section-title">Meet the Masters Behind the Magic</h2>
        <p className="section-subtitle">
          Discover the incredible stories and heritage craftsmanship of India’s most talented artists.
        </p>
      </div>
      <div className="artisans-grid">
        {featuredArtisansData.map((artisan) => (
          <ArtisanCard 
            key={artisan.id} 
            artisan={artisan} 
            onNavigate={onNavigate} 
          />
        ))}
      </div>
      <div className="section-footer">
        <Button 
            text="Discover All Artisans" 
            type="dark" 
            onClick={() => onNavigate('all-artisans')} 
        />
      </div>
    </section>
  );
};

export default FeaturedArtisans;

