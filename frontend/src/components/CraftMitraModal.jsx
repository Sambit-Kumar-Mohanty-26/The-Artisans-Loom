import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from "firebase/functions";
import { useAuth } from '../context/AuthContext';
import './CraftMitraModal.css';

const getCraftMitraResponse = httpsCallable(functions, 'getCraftMitraResponse');
const saveConversation = httpsCallable(functions, 'saveConversation');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Craft Mitra",
  languageLabel: "Language:",
  initialStatus: "Click the mic to start speaking...",
  processingStatus: "Processing...",
  listeningStatus: "Listening... click to stop",
  replyStatus: "Click the mic to reply...",
  errorStatus: "Sorry, an error occurred. Please try again.",
  micDeniedStatus: "Microphone access denied.",
  welcomeArtisan: "Welcome back, ARTISAN_NAME! How can I assist with your shop today?",
  welcomeCustomer: "Welcome, CUSTOMER_NAME! Looking for a special craft? Just ask!",
  welcomeDefault: "Welcome to Craft Mitra! Please log in to explore all my features.",
  loginRequired: "Please log in to use this feature.",
};

const MicOnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );
const MicOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );

const CraftMitraModal = ({ isOpen, onClose, onNavigateToPage, userProfile }) => {
  const { currentLanguage: appLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState(englishContent.initialStatus);
  const [conversationHistory, setConversationHistory] = useState([]);

  const supportedLanguages = [
    { code: 'en-IN', name: 'English (India)', voice: 'en-IN-Wavenet-C' },
    { code: 'hi-IN', name: 'Hindi (India)', voice: 'hi-IN-Wavenet-B' },
    { code: 'bn-IN', name: 'Bengali (India)', voice: 'bn-IN-Wavenet-B' },
    { code: 'ta-IN', name: 'Tamil (India)', voice: 'ta-IN-Wavenet-D' },
    { code: 'mr-IN', name: 'Marathi (India)', voice: 'mr-IN-Wavenet-B' },
  ];

  const [selectedLanguageCode, setSelectedLanguageCode] = useState(supportedLanguages[0].code);
  const [selectedVoiceName, setSelectedVoiceName] = useState(supportedLanguages[0].voice);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatDisplayRef = useRef(null);
  const speechSynthRef = useRef(window.speechSynthesis);

  const speak = (text, langCode) => {
    if (speechSynthRef.current && text) {
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      speechSynthRef.current.speak(utterance);
    }
  };

  useEffect(() => {
    const translateContent = async () => {
      if (appLanguage.code === 'en') {
        setContent(englishContent);
        setStatusText(englishContent.initialStatus);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({ texts: textsToTranslate, targetLanguageCode: appLanguage.code });
        const translations = result.data.translations;
        const newContent = {
          title: translations[0], languageLabel: translations[1], initialStatus: translations[2], 
          processingStatus: translations[3], listeningStatus: translations[4], replyStatus: translations[5], 
          errorStatus: translations[6], micDeniedStatus: translations[7], welcomeArtisan: translations[8], 
          welcomeCustomer: translations[9], welcomeDefault: translations[10], loginRequired: translations[11],
        };
        setContent(newContent);
        setStatusText(newContent.initialStatus);
      } catch (err) {
        console.error("Failed to translate CraftMitraModal content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [appLanguage]);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    if (isOpen) {
      let welcomeMessage = content.welcomeDefault;
      if (currentUser && userProfile) {
        const name = userProfile.displayName || 'Friend';
        welcomeMessage = userProfile.role === 'artisan' 
          ? content.welcomeArtisan.replace('ARTISAN_NAME', name) 
          : content.welcomeCustomer.replace('CUSTOMER_NAME', name);
      }
      setConversationHistory([{ role: 'model', parts: [{ text: welcomeMessage }] }]);
      setStatusText(content.initialStatus);
      setSelectedLanguageCode(supportedLanguages[0].code);
      speak(welcomeMessage, supportedLanguages[0].code);
    } else {
      speechSynthRef.current.cancel();
    }
  }, [isOpen, currentUser, userProfile, content]);

  const handleLanguageChange = (event) => {
    const newLangCode = event.target.value;
    setSelectedLanguageCode(newLangCode);
    const newVoice = supportedLanguages.find(l => l.code === newLangCode)?.voice || supportedLanguages[0].voice;
    setSelectedVoiceName(newVoice);
  };

  const handleCloseAndSave = async () => {
    speechSynthRef.current.cancel();
    if (currentUser && conversationHistory.length > 1) {
      try {
        await saveConversation({ history: conversationHistory });
      } catch (error) {
        console.error("Failed to save conversation:", error);
      }
    }
    onClose(); 
  };

  const handleListenToggle = async () => {
    speechSynthRef.current.cancel();
    if (isListening) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        if (!currentUser || !userProfile) {
          setStatusText(content.loginRequired);
          speak(content.loginRequired, selectedLanguageCode);
          return; 
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm; codecs=opus' };
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          setIsListening(false);
          setStatusText(content.processingStatus);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64data = reader.result.split(',')[1];
              const result = await getCraftMitraResponse({ 
                audioData: base64data,
                history: conversationHistory,
                languageCode: selectedLanguageCode,
                voiceName: selectedVoiceName,
                userRole: userProfile.role,
                onboardingComplete: userProfile.onboardingComplete,
              });
              const { transcript, responseText, responseAudio, functionCall } = result.data;
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text: transcript }] },
                { role: 'model', parts: [{ text: responseText }] }
              ]);
              if (functionCall?.name === "navigateTo" && functionCall.args.path) {
                  onNavigateToPage(functionCall.args.path);
                  onClose(); 
              }
              setStatusText(content.replyStatus);
              if (responseAudio) {
                const audio = new Audio(`data:audio/mp3;base64,${responseAudio}`);
                audio.play();
              }
            } catch (error) {
              console.error("Error calling backend function:", error);
              setStatusText(content.errorStatus);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsListening(true);
        setStatusText(content.listeningStatus);
      } catch (err) {
        console.error("Microphone access error:", err);
        setStatusText(content.micDeniedStatus);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mitra-modal-overlay" onClick={handleCloseAndSave}>
      <div className={`mitra-modal-content ${isTranslating ? 'translating' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleCloseAndSave}>&times;</button>
        <h2>{content.title}</h2>
        
        <div className="language-selector">
          <label htmlFor="language-select">{content.languageLabel}</label>
          <select id="language-select" value={selectedLanguageCode} onChange={handleLanguageChange}>
            {supportedLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="chat-display" ref={chatDisplayRef}>
          {conversationHistory.map((entry, index) => (
            <div key={index} className={`chat-bubble ${entry.role}`}>
              {entry.parts[0].text}
            </div>
          ))}
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
  );
};

export default CraftMitraModal;