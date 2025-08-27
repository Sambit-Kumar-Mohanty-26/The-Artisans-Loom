import React from 'react';
import './Hero.css';
import artisanHero from '../assets/images/artisan-hero.jpg';
import Button from '../components/Button';

const Hero = ({ onNavigate }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="language-toggle">✨ मिट्टी से | परम्परा हाट</div>
        <h1 className="hero-title">
          The Artisan's <br /> Loom
        </h1>
        <p className="hero-subtitle">
          Empowering Indian artisans with AI-powered tools while connecting the world to authentic, handmade treasures that carry centuries of cultural heritage.
        </p>
        <div className="features-grid">
          <div className="feature-item">♡ Voice-powered listings</div>
          <div className="feature-item">♡ Regional discovery</div>
          <div className="feature-item">♡ Story-rich profiles</div>
          <div className="feature-item">♡ Multilingual support</div>
        </div>
        <div className="hero-buttons">
          <Button 
            text="Discover Authentic Crafts" 
            type="primary" 
            onClick={() => onNavigate('shop')} 
          />
          <Button text="Join as Artisan" type="dark" onClick={() => onNavigate('auth')} />
        </div>
        <div className="stats">
          <div className="stat-item">
            <strong>500+</strong>
            <p>Verified Artisans</p>
          </div>
          <div className="stat-item">
            <strong>25</strong>
            <p>States Represented</p>
          </div>
          <div className="stat-item">
            <strong>15+</strong>
            <p>Craft Traditions</p>
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