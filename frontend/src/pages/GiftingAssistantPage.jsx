import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './GiftingAssistantPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Cross-Cultural Gifting Assistant",
  subtitle: "Find the perfect, culturally thoughtful gift for any occasion.",
  occasionLabel: "What is the occasion?",
  occasionPlaceholder: "Select or type an occasion...",
  locationLabel: "Where does the recipient live?",
  locationPlaceholder: "e.g., Kolkata, Delhi, Mumbai",
  findButton: "Find Gift Ideas",
  thinkingButton: "Thinking...",
  errorPrompt: "Please select an occasion and enter a location.",
  errorGeneral: "Sorry, something went wrong. Please try again.",
  suggestionsTitle: "Here are a few thoughtful ideas...",
  fromRegion: "from",
};

const GiftingAssistantPage = () => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [occasion, setOccasion] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

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
          title: translations[0], subtitle: translations[1], occasionLabel: translations[2],
          occasionPlaceholder: translations[3], locationLabel: translations[4], locationPlaceholder: translations[5],
          findButton: translations[6], thinkingButton: translations[7], errorPrompt: translations[8],
          errorGeneral: translations[9], suggestionsTitle: translations[10], fromRegion: translations[11],
        });
      } catch (err) {
        console.error("Failed to translate GiftingAssistantPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const getGiftSuggestions = async (occasion, location) => {
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";
    const prompt = `
      You are a cultural gifting expert for an Indian artisan marketplace.
      A user is looking for a gift for a '${occasion}' in '${location}', India.
      Based on the cultural context of that location and occasion, suggest 3 distinct, authentic Indian craft products.
      Generate the entire response, including names, regions, and reasons, in the language: ${currentLanguage.name}.
      For each suggestion, provide a "name", the "region" it's from, and a compelling "reason" (around 2-3 sentences).
      Return the response as a valid JSON array of objects. Do not include any other text or markdown.
    `;
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });
    if (!response.ok) throw new Error(`Proxy call failed`);
    const result = await response.json();
    const cleanedString = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedString);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!occasion || !location) {
      setError(content.errorPrompt);
      return;
    }
    setError('');
    setLoading(true);
    setSuggestions([]);
    try {
      const results = await getGiftSuggestions(occasion, location);
      setSuggestions(results);
    } catch (err) {
      console.error("Error calling getGiftSuggestions:", err);
      setError(content.errorGeneral);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`gifting-assistant-page ${isTranslating ? 'translating' : ''}`}>
      <div className="page-header">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="assistant-form">
        <div className="form-group">
          <label htmlFor="occasion">{content.occasionLabel}</label>
          <input 
            type="text"
            id="occasion"
            list="occasions-list"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder={content.occasionPlaceholder}
            required
          />
          <datalist id="occasions-list">
            <option value="Wedding" />
            <option value="Anniversary" />
            <option value="Birthday" />
            <option value="Housewarming" />
            <option value="Corporate Gift" />
            <option value="Diwali" />
            <option value="Holi" />
            <option value="Raksha Bandhan" />
            <option value="Eid" />
            <option value="Christmas" />
            <option value="New Year" />
            <option value="Graduation" />
            <option value="Thank You" />
            <option value="Good Luck" />
            <option value="Retirement" />
            <option value="Ganesh Chaturthi" />
            <option value="Dussehra" />
            <option value="Navratri" />
            <option value="Pongal" />
            <option value="Onam" />
            <option value="Karwa Chauth" />
            <option value="Bhai Dooj" />
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="location">{content.locationLabel}</label>
          <input 
            type="text" 
            id="location"
            placeholder={content.locationPlaceholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? content.thinkingButton : content.findButton}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>

      {loading && (
        <div className="suggestions-loader">
          <div className="spinner"></div>
          {content.thinkingButton}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions-container">
          <h2>{content.suggestionsTitle}</h2>
          <div className="suggestions-grid">
            {suggestions.map((item, index) => (
              <div key={index} className="suggestion-card">
                <h3>{item.name}</h3>
                <p className="suggestion-region">{content.fromRegion} {item.region}</p>
                <p className="suggestion-reason">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftingAssistantPage;


