import React, { useState, useRef } from 'react';
import './AdvancedSearchBar.css';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const visualSearchForProducts = httpsCallable(functions, 'visualSearchForProducts');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" /></svg>;
const LensIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;

const AdvancedSearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); 
  const imageInputRef = useRef(null);

  const handleTextSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch({ type: 'text', payload: query });
    }
  };

  const handleVoiceSearch = () => {
    if (!recognition || status === 'listening') return;
    
    setStatus('listening');
    recognition.start();

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setQuery(spokenText); 
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setStatus('idle');
    };
    recognition.onend = () => {
      setStatus('idle');
    };
  };

  const handleImageSearch = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('searching');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64data = reader.result.split(',')[1];
        const result = await visualSearchForProducts({ imageData: base64data });
        onSearch({ type: 'visual', payload: result.data.products });
      } catch (error) {
        console.error("Visual search failed:", error);
        alert("Sorry, we couldn't find products matching that image.");
      } finally {
        setStatus('idle');
      }
    };
  };

  const triggerImageUpload = () => {
    imageInputRef.current.click();
  };

  return (
    <div className="advanced-search-container">
      {status === 'searching' && <div className="search-loader">Searching...</div>}
      <form onSubmit={handleTextSearch} className={`search-bar ${status !== 'idle' ? 'disabled' : ''}`}>
        <button type="submit" className="search-icon-btn" aria-label="Search">
          <SearchIcon />
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={status === 'listening' ? 'Listening...' : "Search for crafts, artisans, or regions..."}
          className="search-input"
          disabled={status !== 'idle'}
        />
        <div className="action-buttons">
          <button type="button" onClick={handleVoiceSearch} className="action-btn" aria-label="Search by voice" disabled={!recognition || status !== 'idle'}>
            <MicIcon />
          </button>
          <button type="button" onClick={triggerImageUpload} className="action-btn" aria-label="Search by image" disabled={status !== 'idle'}>
            <LensIcon />
          </button>
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSearch}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </form>
    </div>
  );
};

export default AdvancedSearchBar;