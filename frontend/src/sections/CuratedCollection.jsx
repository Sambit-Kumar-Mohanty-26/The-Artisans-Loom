import React from 'react';
import './CuratedCollection.css';
import collectionImg from '../assets/images/curated-collection.jpg'; 
import Button from '../components/Button';

const CuratedCollection = () => {
  return (
    <section className="curated-collection-section">
      <div className="section-header">
        <span className="section-tag">🛒 Curated Collection</span>
        <h2 className="section-title">Stories Woven into Every Creation</h2>
        <p className="section-subtitle">
          Each product tells a unique story of heritage, craftsmanship, and the passionate artisan who created it.
        </p>
      </div>
      <div className="collection-layout">
        <div className="collection-showcase-card">
          <img src={collectionImg} alt="Collection of handmade crafts" />
          <div className="card-overlay">
            <p className="heritage-tag">Heritage Collection</p>
            <h3>Discover Authentic Handmade Treasures</h3>
            <p className="card-description">
              From intricate textiles to stunning pottery, each piece carries the soul of traditional Indian craftsmanship.
            </p>
            <Button text="Explore Collection" type="secondary" />
          </div>
        </div>
        <div className="collection-info">
          <div className="stats-grid">
            <div className="stat-box">1,200+<span>Authentic Products</span></div>
            <div className="stat-box">15<span>Craft Categories</span></div>
            <div className="stat-box">98%<span>Customer Satisfaction</span></div>
            <div className="stat-box">500+<span>Happy Customers</span></div>
          </div>
          <div className="why-choose-us">
            <h4>Why Choose Authentic Crafts?</h4>
            <ul>
              <li>Each piece supports traditional artisan families.</li>
              <li>Sustainable, eco-friendly materials and methods.</li>
              <li>Unique designs you won't find anywhere else.</li>
              <li>Detailed stories about each artisan and technique.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CuratedCollection;