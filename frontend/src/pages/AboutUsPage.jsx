import React from 'react';
import './AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="about-us-container">
      <h1 className="about-us-title">About The Artisan's Loom</h1>
      <section className="about-us-section">
        <p>
          The Artisan's Loom is dedicated to connecting the world to authentic, handmade treasures from the heart of India. 
          We believe in the power of traditional craftsmanship and aim to empower skilled artisans by providing 
          a global platform for their unique creations. Our mission is to preserve India's rich artistic heritage 
          while fostering sustainable livelihoods for artisan communities.
        </p>
        <p>
          Through our platform, customers can discover a diverse range of handcrafted products, each telling a story 
          of culture, tradition, and dedication. We are committed to fair trade practices, ensuring that artisans 
          receive fair compensation for their invaluable work.
        </p>
      </section>
      <section className="about-us-section">
        <h2 className="team-title">Our Visionaries</h2>
        <ul className="team-list">
          <li>Mr. Sambit Kumar Mohanty</li>
          <li>Mr. Rudranarayan Ray</li>
          <li>Mr. Chandrasekhar Mishra</li>
        </ul>
      </section>
    </div>
  );
};

export default AboutUsPage;
