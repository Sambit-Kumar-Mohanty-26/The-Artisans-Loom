import React, { useState, useRef, useEffect } from 'react';
import './CraftMitraModal.css';
import { functions } from '../firebaseConfig';
import { httpsCallable } from "firebase/functions";

const transcribeAudio = httpsCallable(functions, 'transcribeAudio');

// Icon components 
const MicOnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );
const MicOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );

const CraftMitraModal = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState(''); // For transcript/error messages
  const [promptText, setPromptText] = useState('Click to start speaking'); // For the main prompt

  // --- USE REFS FROM THE ORIGINAL WORKING CODE ---
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Reset state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsListening(false);
      setStatusText('');
      setPromptText('Click to start speaking');
    }
  }, [isOpen]);

  const handleListenToggle = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        // UI will update via the 'stop' event listener
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
          setPromptText('Processing...');

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            
            transcribeAudio({ audioData: base64data })
              .then((result) => {
                const { transcript, responseAudio } = result.data;
                
                if (transcript) {
                  setPromptText(''); // Hide the prompt
                  setStatusText(`You said: "${transcript}"`); // Show the result
                  if (responseAudio) {
                    const audio = new Audio(`data:audio/mp3;base64,${responseAudio}`);
                    audio.play();
                    audio.onended = onClose;
                  } else {
                    setTimeout(onClose, 3000);
                  }
                } else {
                  setPromptText('');
                  setStatusText("I didn't quite catch that. Please try again.");
                  setTimeout(onClose, 3000);
                }
              })
              .catch((error) => {
                console.error("Error calling backend function:", error);
                setPromptText('');
                setStatusText("Sorry, something went wrong on the server.");
                setTimeout(onClose, 3000);
              });
          };
           // Clean up the stream
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
        setPromptText('Listening... click to stop');
        setStatusText('');
      } catch (err) {
        console.error("Microphone access error:", err);
        setStatusText("Microphone access denied.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mitra-modal-overlay" onClick={onClose}>
      <div className="mitra-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Craft Mitra</h2>
        <p className="mitra-subtitle">Your voice-powered craft assistant</p>
        
        <div 
          className={`mic-icon-container ${isListening ? 'listening' : ''}`} 
          onClick={handleListenToggle}
        >
          {isListening ? <MicOffIcon /> : <MicOnIcon />}
        </div>
        
        <div className="transcription-display">
          {statusText ? (
            <span className="status-message final">{statusText}</span>
          ) : (
            <span className="status-message">{promptText}</span>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CraftMitraModal;