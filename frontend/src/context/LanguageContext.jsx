import React, { createContext, useState, useContext } from 'react';
export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' }, // Hindi
  { code: 'bn', name: 'বাংলা' }, // Bengali
  { code: 'te', name: 'తెలుగు' }, // Telugu
  { code: 'mr', name: 'मराठी' }, // Marathi
  { code: 'ta', name: 'தமிழ்' }, // Tamil
  { code: 'gu', name: 'ગુજરાતી' }, // Gujarati
];

const LanguageContext = createContext();
export function useLanguage() {
  return useContext(LanguageContext);
}
export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(supportedLanguages[0]); 

  const changeLanguage = (languageCode) => {
    const newLanguage = supportedLanguages.find(lang => lang.code === languageCode);
    if (newLanguage) {
      setCurrentLanguage(newLanguage);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    supportedLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}