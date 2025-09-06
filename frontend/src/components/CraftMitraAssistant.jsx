import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './CraftMitraAssistant.css'; 

const CraftMitraAssistant = ({ onSpeak, selectedLanguageCode }) => {
  const { currentUser, userRole, onboardingComplete, loading, loadingUserData } = useAuth();
  const [message, setMessage] = useState("");
  const [hasSpokenInitialWelcome, setHasSpokenInitialWelcome] = useState(false); 

  useEffect(() => {
    if (!loading && !loadingUserData) {
      let welcomeMessage = "";
      if (!currentUser) {
        welcomeMessage = "Welcome to Craft Mitra! Please log in to explore our features.";
      } else if (userRole === 'artisan') {
        if (!onboardingComplete) {
          welcomeMessage =
            "Welcome, artisan! Craft Mitra helps you showcase your craft. I can guide you through listing your first product. Just ask, \"How do I add a product?\""
          ;
        } else {
          welcomeMessage =
            "Welcome back, artisan! How can I assist you today? You can ask me to help you manage your products or view your profile."
          ;
        }
      } else if (userRole === 'customer') {
        welcomeMessage =
          "Welcome to Craft Mitra! Discover unique handcrafted products from talented artisans across India. Explore our curated collections, artisans by region, and more. How can I help you find something special today?"
        ;
      }
      setMessage(welcomeMessage);
      if (onSpeak && welcomeMessage && !hasSpokenInitialWelcome) {
        onSpeak(welcomeMessage, selectedLanguageCode);
        setHasSpokenInitialWelcome(true);
      }
    }
  }, [currentUser, userRole, onboardingComplete, loading, loadingUserData, onSpeak, selectedLanguageCode, hasSpokenInitialWelcome]);

  if (loading || loadingUserData) {
    return <div>Loading assistant...</div>;
  }

  return (
    <div className="craft-mitra-assistant">
      <p>{message}</p>
    </div>
  );
};

export default CraftMitraAssistant;
