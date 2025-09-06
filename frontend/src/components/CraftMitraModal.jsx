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
  subtitle: "Your voice-powered craft assistant",
  initialStatus: "Click the mic to start speaking...",
  processingStatus: "Processing...",
  listeningStatus: "Listening... click to stop",
  replyStatus: "Click the mic to reply...",
  errorStatus: "Sorry, an error occurred. Please try again.",
  micDeniedStatus: "Microphone access denied.",
};

const MicOnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );
const MicOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );

const CraftMitraModal = ({ isOpen, onClose, onNavigateToPage, children }) => {
  const { currentLanguage: appLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState(englishContent.initialStatus);
  const [conversationHistory, setConversationHistory] = useState([]);
  const { currentUser, userRole, onboardingComplete } = useAuth(); // Destructure all needed values here

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
        const result = await getTranslations({
          texts: textsToTranslate,
          targetLanguageCode: appLanguage.code,
        });
        const translations = result.data.translations;
        const newContent = {
          title: translations[0], languageLabel: translations[1], subtitle: translations[2],
          initialStatus: translations[3], processingStatus: translations[4], listeningStatus: translations[5],
          replyStatus: translations[6], errorStatus: translations[7], micDeniedStatus: translations[8],
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
      setConversationHistory([]);
      setStatusText(content.initialStatus);
      setSelectedLanguageCode(supportedLanguages[0].code);
      setSelectedVoiceName(supportedLanguages[0].voice);
    }
  }, [isOpen, content.initialStatus]);

  const getVoiceForLanguage = (langCode) => {
    const lang = supportedLanguages.find(l => l.code === langCode);
    return lang ? lang.voice : supportedLanguages[0].voice;
  };

  const handleLanguageChange = (event) => {
    const newLangCode = event.target.value;
    setSelectedLanguageCode(newLangCode);
    setSelectedVoiceName(getVoiceForLanguage(newLangCode));
  };

  const handleCloseAndSave = async () => {
    if (currentUser && conversationHistory.length > 0) {
      try {
        await saveConversation({ history: conversationHistory });
      } catch (error) {
        console.error("Failed to save conversation:", error);
      }
    }
    speechSynthRef.current.cancel();
    onClose();
  };

  const handleListenToggle = async () => {
    if (isListening) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
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
          setStatusText(content.processingStatus);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              if (!currentUser) throw new Error("User is not logged in.");
              await currentUser.getIdToken(true);
              const base64data = reader.result.split(',')[1];
              
              const result = await getCraftMitraResponse({ 
                audioData: base64data,
                history: conversationHistory,
                languageCode: selectedLanguageCode,
                voiceName: selectedVoiceName,
                userRole: userRole,
                onboardingComplete: onboardingComplete,
              });

              const { transcript, responseText, responseAudio, functionCall } = result.data;
              
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text: transcript }] },
                { role: 'model', parts: [{ text: responseText }] }
              ]);

              if (functionCall && functionCall.name === "navigateTo") {
                const { path } = functionCall.args;
                if (path) {
                  onNavigateToPage(path);
                  onClose(); 
                }
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

  const speak = (text, langCode) => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode || selectedLanguageCode;
      speechSynthRef.current.speak(utterance);
    }
  };

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
          {conversationHistory.length === 0 && (
             <p className="mitra-subtitle">{content.subtitle}</p>
          )}
          {React.cloneElement(children, { onSpeak: speak, selectedLanguageCode: selectedLanguageCode })}
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
