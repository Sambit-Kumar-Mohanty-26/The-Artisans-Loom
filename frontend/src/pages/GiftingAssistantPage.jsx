import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './GiftingAssistantPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');
const getAiCuratedCollection = httpsCallable(functions, 'getAiCuratedCollection');
const getGiftSuggestionsProxy = async (prompt) => {
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";
    const response = await fetch(proxyUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });
    if (!response.ok) throw new Error(`Proxy call failed`);
    const result = await response.json();
    const cleanedString = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedString);
};

const englishContent = {
  giftFinderTab: "Gift Finder",
  decorAssistantTab: "Decor Assistant",
  title: "Cross-Cultural Gifting Assistant",
  subtitle: "Find the perfect, culturally thoughtful gift for any occasion.",
  occasionLabel: "What is the occasion?",
  occasionPlaceholder: "Select or type an occasion...",
  locationLabel: "Where does the recipient live?",
  locationPlaceholder: "e.g., Kolkata, Delhi, Mumbai",
  findButton: "Find Gift Ideas",
  thinkingButton: "Thinking...",
  errorPrompt: "Please fill in all fields.",
  errorGeneral: "Sorry, something went wrong. Please try again.",
  suggestionsTitle: "Here are a few thoughtful ideas...",
  fromRegion: "from",
  decorTitle: "AI Interior Designer",
  decorSubtitle: "Describe your vision, and let our AI curate a collection for you.",
  themeLabel: "What is the theme or style?",
  themePlaceholder: "e.g., Coastal Serenity, Minimalist, Royal Rajasthani...",
  budgetLabel: "What is your budget (in ₹)?",
  budgetPlaceholder: "e.g., 10000",
  curateButton: "Curate My Collection",
  curatingButton: "Curating...",
};

const GiftingAssistantPage = ({ onNavigate, onSearch }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [activeTab, setActiveTab] = useState('gift');
  
  const [occasion, setOccasion] = useState('');
  const [location, setLocation] = useState('');
  const [giftSuggestions, setGiftSuggestions] = useState([]);
  
  const [theme, setTheme] = useState('');
  const [budget, setBudget] = useState('');
  const [decorCollection, setDecorCollection] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
          giftFinderTab: translations[0], decorAssistantTab: translations[1], title: translations[2], 
          subtitle: translations[3], occasionLabel: translations[4], occasionPlaceholder: translations[5], 
          locationLabel: translations[6], locationPlaceholder: translations[7], findButton: translations[8], 
          thinkingButton: translations[9], errorPrompt: translations[10], errorGeneral: translations[11], 
          suggestionsTitle: translations[12], fromRegion: translations[13], decorTitle: translations[14], 
          decorSubtitle: translations[15], themeLabel: translations[16], themePlaceholder: translations[17], 
          budgetLabel: translations[18], budgetPlaceholder: translations[19], curateButton: translations[20], 
          curatingButton: translations[21],
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

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    if (!occasion || !location) {
      setError(content.errorPrompt);
      return;
    }
    setError('');
    setLoading(true);
    setGiftSuggestions([]);
    try {
        const prompt = `
            You are a cultural gifting expert for an Indian artisan marketplace.
            A user is looking for a gift for a '${occasion}' in '${location}', India.
            Based on the cultural context, suggest 3 distinct TYPES of authentic Indian craft products.
            Generate the entire response in the language: ${currentLanguage.name}.
            For each suggestion, provide a "name" (e.g., "Pattachitra Painting"), the "region" it's from, a compelling "reason", and a simple "searchTerm" (e.g., "pattachitra").
            Return as a valid JSON array of objects. Do not include markdown.
        `;
        const results = await getGiftSuggestionsProxy(prompt);
        setGiftSuggestions(results);
    } catch(err) {
        console.error("Error getting gift suggestions:", err);
        setError(content.errorGeneral);
    } 
    finally { setLoading(false); }
  };

  const handleDecorSubmit = async (e) => {
    e.preventDefault();
    if (!theme || !budget) {
      setError(content.errorPrompt);
      return;
    }
    setError('');
    setLoading(true);
    setDecorCollection(null);
    try {
        const result = await getAiCuratedCollection({
            theme: theme,
            budget: Number(budget),
            language: currentLanguage.name
        });
        setDecorCollection(result.data);
    } catch(err) {
        console.error("Error curating collection:", err);
        setError(content.errorGeneral);
    } finally {
        setLoading(false);
    }
  };

  const handleSuggestionClick = (searchTerm) => {
    if (typeof onSearch === 'function') {
      onSearch({ type: 'text', payload: searchTerm });
    }
  };

  return (
    <div className={`gifting-assistant-page ${isTranslating ? 'translating' : ''}`}>
      <div className="assistant-tabs">
        <button onClick={() => setActiveTab('gift')} className={`tab-btn ${activeTab === 'gift' ? 'active' : ''}`}>
          {content.giftFinderTab}
        </button>
        <button onClick={() => setActiveTab('decor')} className={`tab-btn ${activeTab === 'decor' ? 'active' : ''}`}>
          {content.decorAssistantTab}
        </button>
      </div>

      {activeTab === 'gift' && (
        <div className="assistant-content">
          <div className="page-header">
            <h1>{content.title}</h1>
            <p>{content.subtitle}</p>
          </div>
          <form onSubmit={handleGiftSubmit} className="assistant-form">
            <div className="form-group">
              <label htmlFor="occasion">{content.occasionLabel}</label>
              <input 
                type="text" id="occasion" list="occasions-list"
                value={occasion} onChange={(e) => setOccasion(e.target.value)}
                placeholder={content.occasionPlaceholder} required
              />
              <datalist id="occasions-list">
                <option value="Wedding" /> <option value="Anniversary" /> <option value="Birthday" />
                <option value="Housewarming" /> <option value="Corporate Gift" /> <option value="Thank You" />
                <option value="Graduation" /> <option value="Retirement" /> <option value="Good Luck" />
                <option value="New Baby" /> <option value="Diwali" /> <option value="Holi" />
                <option value="Raksha Bandhan" /> <option value="Eid" /> <option value="Christmas" />
                <option value="New Year" /> <option value="Ganesh Chaturthi" /> <option value="Dussehra" />
                <option value="Navratri" /> <option value="Pongal" /> <option value="Onam" />
                <option value="Karwa Chauth" /> <option value="Bhai Dooj" />
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="location">{content.locationLabel}</label>
              <input 
                type="text" id="location"
                placeholder={content.locationPlaceholder}
                value={location} onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? content.thinkingButton : content.findButton}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>

          {loading && <div className="suggestions-loader"><div className="spinner"></div>{content.thinkingButton}</div>}

          {giftSuggestions.length > 0 && (
            <div className="suggestions-container">
              <h2>{content.suggestionsTitle}</h2>
              <div className="suggestions-grid">
                {giftSuggestions.map((item, index) => (
                  <div key={index} className="suggestion-card clickable" onClick={() => handleSuggestionClick(item.searchTerm || item.name)}>
                    <h3>{item.name}</h3>
                    <p className="suggestion-region">{content.fromRegion} {item.region}</p>
                    <p className="suggestion-reason">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'decor' && (
        <div className="assistant-content">
          <div className="page-header">
            <h1>{content.decorTitle}</h1>
            <p>{content.decorSubtitle}</p>
          </div>
          <form onSubmit={handleDecorSubmit} className="assistant-form">
             <div className="form-group">
                <label htmlFor="theme">{content.themeLabel}</label>
                <input type="text" id="theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder={content.themePlaceholder} required />
            </div>
            <div className="form-group">
                <label htmlFor="budget">{content.budgetLabel}</label>
                <input type="number" id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={content.budgetPlaceholder} required />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
                {loading ? content.curatingButton : content.curateButton}
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>

          {loading && <div className="suggestions-loader"><div className="spinner"></div>{content.curatingButton}</div>}
          
          {decorCollection && (
            <div className="decor-collection-result">
                <h2 className="collection-title">{decorCollection.collectionTitle}</h2>
                <p className="collection-description">{decorCollection.collectionDescription}</p>
                <div className="suggestions-grid">
                    {decorCollection.suggestedCrafts.map((item, index) => (
                        <div key={index} className="suggestion-card clickable" onClick={() => handleSuggestionClick(item.searchTerm)}>
                            <h3>{item.name}</h3>
                            <p className="suggestion-region">{item.region}</p>
                            <p className="suggestion-reason">{item.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftingAssistantPage;