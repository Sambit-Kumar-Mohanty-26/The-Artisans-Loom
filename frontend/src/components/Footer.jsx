import React from 'react';
import './Footer.css';
import logo from '../assets/images/logo.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section about">
          <img src={logo} alt="The Artisan's Loom Logo" className="footer-logo-image" />
          <p>Connecting the world to authentic, handmade treasures from the heart of India.</p>
        </div>
        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Discover</a></li>
            <li><a href="#">Artisans</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Stories</a></li>
          </ul>
        </div>
        <div className="footer-section links">
          <h3>Support</h3>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Shipping</a></li>
            <li><a href="#">Returns</a></li>
          </ul>
        </div>
        <div className="footer-section subscribe">
          <h3>Stay Connected</h3>
          <p>Get updates on new arrivals and special offers.</p>
          <form className="subscribe-form">
            <input type="email" placeholder="Your email address" />
            <button type="submit">→</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 The Artisan's Loom. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;