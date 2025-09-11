import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './VoiceListingModal.css'; 

const MicOnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );
const MicOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );

const VoiceListingModal = ({ isOpen, onClose, onDataExtracted }) => {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Select your language and click the mic to start.');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const supportedLanguages = [
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'bn-IN', name: 'Bengali (India)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'mr-IN', name: 'Marathi (India)' },
    { code: 'te-IN', name: 'Telugu (India)' },
    { code: 'gu-IN', name: 'Gujarati (India)' },
  ];

  const [selectedLanguageCode, setSelectedLanguageCode] = useState(supportedLanguages[0].code);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setStatusText('Select your language and click the mic to start.');
    }
  }, [isOpen]);

  const handleListenToggle = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm; codecs=opus' };
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          setIsListening(false);
          setStatusText('Processing your description...');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onDataExtracted(audioBlob, selectedLanguageCode); // Pass the raw blob
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
        setStatusText('Listening... Click to stop recording.');
      } catch (err) {
        console.error("Microphone access error:", err);
        setStatusText("Microphone access denied. Please enable it in your browser settings.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content voice-listing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">List with your Voice</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <p className="instruction-text">
            Simply describe your product naturally. Include details like the name, price, materials, stock, and a short description.
          </p>
          <div className="language-selector">
            <label htmlFor="voice-language-select">Recording Language:</label>
            <select 
              id="voice-language-select" 
              value={selectedLanguageCode} 
              onChange={(e) => setSelectedLanguageCode(e.target.value)}
              disabled={isListening}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="mic-and-status">
            <div 
              className={`mic-icon-container ${isListening ? 'listening' : ''}`} 
              onClick={handleListenToggle}
            >
              {isListening ? <MicOffIcon /> : <MicOnIcon />}
            </div>
            <div className="transcription-display">
              <span className="status-message">{statusText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceListingModal;