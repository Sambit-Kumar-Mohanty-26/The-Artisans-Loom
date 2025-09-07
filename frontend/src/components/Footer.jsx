import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './Footer.css';
import logo from '../assets/images/logo.png';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  aboutText: "Connecting the world to authentic, handmade treasures from the heart of India.",
  quickLinksTitle: "Quick Links",
  discoverLink: "Discover",
  artisansLink: "Artisans",
  aboutUsLink: "About Us",
  storiesLink: "Stories",
  supportTitle: "Support",
  faqLink: "FAQ",
  contactLink: "Contact Us",
  shippingLink: "Shipping",
  returnsLink: "Returns",
  subscribeTitle: "Stay Connected",
  subscribeText: "Get updates on new arrivals and special offers.",
  emailPlaceholder: "Your email address",
  copyright: "© 2025 The Artisan's Loom. All Rights Reserved.",
};

const Footer = ({ onNavigate, onNavigateAndScroll }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({
          texts: textsToTranslate,
          targetLanguageCode: currentLanguage.code,
        });
        const translations = result.data.translations;
        setContent({
          aboutText: translations[0], quickLinksTitle: translations[1], discoverLink: translations[2],
          artisansLink: translations[3], aboutUsLink: translations[4], storiesLink: translations[5],
          supportTitle: translations[6], faqLink: translations[7], contactLink: translations[8],
          shippingLink: translations[9], returnsLink: translations[10], subscribeTitle: translations[11],
          subscribeText: translations[12], emailPlaceholder: translations[13], copyright: translations[14],
        });
      } catch (err) {
        console.error("Failed to translate Footer content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleLinkClick = (e, page) => {
    e.preventDefault();
    onNavigate(page);
  };
  
  const handleScrollLinkClick = (e, sectionId) => {
    e.preventDefault();
    onNavigateAndScroll(sectionId);
  };

  return (
    <footer className={`footer ${isTranslating ? 'translating' : ''}`}>
      <div className="footer-content">
        <div className="footer-section about">
          <img src={logo} alt="The Artisan's Loom Logo" className="footer-logo-image" />
          <p>{content.aboutText}</p>
        </div>
        <div className="footer-links-wrapper">
          <div className="footer-section links">
            <h3>{content.quickLinksTitle}</h3>
            <ul>
              <li><a href="#" onClick={(e) => handleScrollLinkClick(e, 'discover')}>{content.discoverLink}</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'all-artisans')}>{content.artisansLink}</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'about-us')}>{content.aboutUsLink}</a></li>
              <li><a href="#" onClick={(e) => handleScrollLinkClick(e, 'stories')}>{content.storiesLink}</a></li>
            </ul>
          </div>
          <div className="footer-section links">
            <h3>{content.supportTitle}</h3>
            <ul>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'faq')}>{content.faqLink}</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'contact')}>{content.contactLink}</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'shipping')}>{content.shippingLink}</a></li>
              <li><a href="#" onClick={(e) => handleLinkClick(e, 'returns')}>{content.returnsLink}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-section subscribe">
          <h3>{content.subscribeTitle}</h3>
          <p>{content.subscribeText}</p>
          <form className="subscribe-form">
            <input type="email" placeholder={content.emailPlaceholder} />
            <button type="submit">→</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{content.copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;