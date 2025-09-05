import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './CuratedCollection.css';
import collectionImg from '../assets/images/curated-collection.jpg'; 
import Button from '../components/Button';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  tag: "🛒 Curated Collection",
  title: "Stories Woven into Every Creation",
  subtitle: "Each product tells a unique story of heritage, craftsmanship, and the passionate artisan who created it.",
  cardHeritageTag: "Heritage Collection",
  cardTitle: "Discover Authentic Handmade Treasures",
  cardDescription: "From intricate textiles to stunning pottery, each piece carries the soul of traditional Indian craftsmanship.",
  cardButton: "Explore Collection",
  stat1Label: "Authentic Products",
  stat2Label: "Craft Categories",
  stat3Label: "Customer Satisfaction",
  stat4Label: "Happy Customers",
  whyChooseTitle: "Why Choose Authentic Crafts?",
  whyChoosePoint1: "Each piece supports traditional artisan families.",
  whyChoosePoint2: "Sustainable, eco-friendly materials and methods.",
  whyChoosePoint3: "Unique designs you won't find anywhere else.",
  whyChoosePoint4: "Detailed stories about each artisan and technique.",
};

const CuratedCollection = () => {
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
          tag: translations[0],
          title: translations[1],
          subtitle: translations[2],
          cardHeritageTag: translations[3],
          cardTitle: translations[4],
          cardDescription: translations[5],
          cardButton: translations[6],
          stat1Label: translations[7],
          stat2Label: translations[8],
          stat3Label: translations[9],
          stat4Label: translations[10],
          whyChooseTitle: translations[11],
          whyChoosePoint1: translations[12],
          whyChoosePoint2: translations[13],
          whyChoosePoint3: translations[14],
          whyChoosePoint4: translations[15],
        });
      } catch (err) {
        console.error("Failed to translate CuratedCollection content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  return (
    <section className={`curated-collection-section ${isTranslating ? 'translating' : ''}`}>
      <div className="section-header">
        <span className="section-tag">{content.tag}</span>
        <h2 className="section-title">{content.title}</h2>
        <p className="section-subtitle">{content.subtitle}</p>
      </div>
      <div className="collection-layout">
        <div className="collection-showcase-card">
          <img src={collectionImg} alt="Collection of handmade crafts" />
          <div className="card-overlay">
            <p className="heritage-tag">{content.cardHeritageTag}</p>
            <h3>{content.cardTitle}</h3>
            <p className="card-description">{content.cardDescription}</p>
            <Button text={content.cardButton} type="secondary" />
          </div>
        </div>
        <div className="collection-info">
          <div className="stats-grid">
            <div className="stat-box">1,200+<span>{content.stat1Label}</span></div>
            <div className="stat-box">15<span>{content.stat2Label}</span></div>
            <div className="stat-box">98%<span>{content.stat3Label}</span></div>
            <div className="stat-box">500+<span>{content.stat4Label}</span></div>
          </div>
          <div className="why-choose-us">
            <h4>{content.whyChooseTitle}</h4>
            <ul>
              <li>{content.whyChoosePoint1}</li>
              <li>{content.whyChoosePoint2}</li>
              <li>{content.whyChoosePoint3}</li>
              <li>{content.whyChoosePoint4}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CuratedCollection;