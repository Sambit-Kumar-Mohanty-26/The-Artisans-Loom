import React from 'react';
import ArtisanCard from '../components/ArtisanCard';
import Button from '../components/Button';
import './FeaturedArtisans.css';


import kamalaDeviImg from '../assets/images/kamala-devi.png';
import arjunPatelImg from '../assets/images/arjun-patel.png';
import meeraSharmaImg from '../assets/images/meera-sharma.png';

const featuredArtisansData = [
  {
    name: 'Kamala Devi',
    location: 'Rajasthan, India',
    badge: 'Heritage Master',
    craft: 'Block Printing',
    experience: 25,
    description: 'Master of traditional Rajasthani block printing, carrying forward her grandmother’s 100-year-old techniques.',
    rating: 4.9,
    products: 42,
    image: kamalaDeviImg,
  },
  {
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

const FeaturedArtisans = () => {
  return (
    <section className="featured-artisans-section">
      <div className="section-header">
        <span className="section-tag">⭐ Featured Artisans</span>
        <h2 className="section-title">Meet the Masters Behind the Magic</h2>
        <p className="section-subtitle">
          Discover the incredible stories and heritage craftsmanship of India’s most talented artisans.
        </p>
      </div>
      <div className="artisans-grid">
        {featuredArtisansData.map((artisan) => (
          <ArtisanCard key={artisan.name} artisan={artisan} />
        ))}
      </div>
      <div className="section-footer">
        <Button text="Discover All Artisans" type="dark" />
      </div>
    </section>
  );
};

export default FeaturedArtisans;