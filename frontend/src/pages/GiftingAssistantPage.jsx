
import React, { useState } from 'react';
import './GiftingAssistantPage.css';


const GiftingAssistantPage = () => {
  const [occasion, setOccasion] = useState('');
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getGiftSuggestions = async (occasion, location) => {
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";

    const prompt = `
      You are a cultural gifting expert for an Indian artisan marketplace. 
      A user is looking for a gift for a '${occasion}' in '${location}', India.
      Based on the cultural context of that location and occasion, suggest 3 distinct, authentic Indian craft products from different regions of India.
      For each suggestion, provide a "name", the "region" it's from, and a compelling "reason" (around 2-3 sentences) explaining why it's a thoughtful and culturally appropriate gift.
      
      Return the response as a JSON array of objects. Do not include any other text or markdown.
    `;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      throw new Error(`Proxy call failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    const cleanedString = result.response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedString);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!occasion || !location) {
      setError('Please select an occasion and enter a location.');
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
      setError('Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gifting-assistant-page">
      <div className="page-header">
        <h1>Cross-Cultural Gifting Assistant</h1>
        <p>Find the perfect, culturally thoughtful gift for any occasion.</p>
      </div>

      <form onSubmit={handleSubmit} className="assistant-form">
        <div className="form-group">
          <label htmlFor="occasion">What is the occasion?</label>
          
          <input 
            type="text"
            id="occasion"
            list="occasions-list"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="Select or type an occasion..."
            required
          />
          <datalist id="occasions-list">
            <option value="Wedding" />
            <option value="Housewarming" />
            <option value="Diwali" />
            <option value="Birthday" />
            <option value="Anniversary" />
            <option value="Holi" />
            <option value="Raksha Bandhan" />
            <option value="Eid" />
            <option value="Christmas" />
            <option value="New Year" />
            <option value="Corporate Gift" />
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="location">Where does the recipient live?</label>
          <input 
            type="text" 
            id="location"
            placeholder="e.g., Kolkata, Delhi, Mumbai"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Thinking...' : 'Find Gift Ideas'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>

      {suggestions.length > 0 && (
        <div className="suggestions-container">
          <h2>Here are a few thoughtful ideas...</h2>
          <div className="suggestions-grid">
            {suggestions.map((item, index) => (
              <div key={index} className="suggestion-card">
                <h3>{item.name}</h3>
                <p className="suggestion-region">from {item.region}</p>
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


