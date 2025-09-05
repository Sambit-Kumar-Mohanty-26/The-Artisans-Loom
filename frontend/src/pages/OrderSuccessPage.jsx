import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './OrderSuccessPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Thank You!",
  subtitle: "Your order has been placed successfully.",
  orderIdLabel: "Order ID:",
  confirmationMessage: "You will receive an email confirmation shortly.",
  continueButton: "Continue Shopping",
};

const OrderSuccessPage = ({ onNavigate, orderId }) => {
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
          title: translations[0],
          subtitle: translations[1],
          orderIdLabel: translations[2],
          confirmationMessage: translations[3],
          continueButton: translations[4],
        });
      } catch (err) {
        console.error("Failed to translate OrderSuccessPage content:", err);
        setContent(englishContent); 
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  return (
    <div className="order-success-page">
      <div className={`success-card ${isTranslating ? 'translating' : ''}`}>
        <div className="success-icon">✓</div>
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
        <p className="order-number">{content.orderIdLabel} <strong>{orderId}</strong></p>
        <p>{content.confirmationMessage}</p>
        <button onClick={() => onNavigate('home')} className="home-btn">
          {content.continueButton}
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;