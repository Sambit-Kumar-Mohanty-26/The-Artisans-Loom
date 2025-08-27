import React, { useState } from 'react';
import './StateDetailPage.css';

const CraftCard = ({ craft, onNavigate }) => (
  <div 
    className="craft-card"
    onClick={() => onNavigate(`craft/${craft.name.toLowerCase().replace(/\s+/g, '-')}`)}
  >
    <img src={craft.image} alt={craft.name} className="craft-image" />
    <div className="craft-info">
      <h3 className="craft-name">{craft.name}</h3>
      <p className="craft-description">{craft.description}</p>
    </div>
  </div>
);

const GeminiModal = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ opacity: 1 }}>
      <div className="modal-content" style={{ transform: 'scale(1)' }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {isLoading ? <p>Weaving a story for you...</p> : <p dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />}
        </div>
      </div>
    </div>
  );
};

const StateDetailPage = ({ stateData, onNavigate }) => {
  const [modalState, setModalState] = useState({ isOpen: false, title: '', content: '', isLoading: false });

  const callGemini = async (prompt) => {

    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        if (!response.ok) {
            throw new Error(`Proxy call failed with status: ${response.status}`);
        }
        const result = await response.json();
        return result.response || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Proxy function call error:", error);
        return "An error occurred while contacting the AI.";
    }
  };

  const handleGeminiClick = async (type) => {
    let prompt = '';
    let title = '';

    setModalState({ isOpen: true, title: 'Generating...', content: '', isLoading: true });

    switch (type) {
      case 'fact':
        title = `Did you know?`;
        prompt = `Tell me a surprising or little-known "Did you know?" fact about the cultural heritage or crafts of ${stateData.name}, India.`;
        break;
      case 'story':
        title = `A Story of ${stateData.crafts[0].name}`;
        prompt = `Tell me a short, engaging folk tale (around 150 words) related to the traditional craft of ${stateData.crafts[0].name} from ${stateData.name}.`;
        break;
      case 'culture':
        title = `Cultural Connection`;
        prompt = `Briefly explain the cultural significance of ${stateData.crafts[0].name} in the heritage of ${stateData.name}.`;
        break;
      default:
        setModalState({ isOpen: false, title: '', content: '', isLoading: false });
        return;
    }
    
    const response = await callGemini(prompt);
    setModalState({ isOpen: true, title, content: response, isLoading: false });
  };

  if (!stateData) {
    return (
      <div className="state-detail-page-container">
        <div className="page-header">
          <h1>State Not Found</h1>
          <button onClick={() => onNavigate('all-states')} className="back-button">
            &larr; Back to All States
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeminiModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        content={modalState.content}
        isLoading={modalState.isLoading}
      />
      <div className="state-detail-page-container">
        <div className="state-banner" style={{ backgroundImage: `url(${stateData.image})` }}>
          <div className="banner-overlay">
            <h1 className="banner-title">{stateData.name}</h1>
            <p className="banner-microtext">{stateData.microtext}</p>
          </div>
        </div>

        <div className="state-content-wrapper">
          <div className="state-content">
              <button onClick={() => onNavigate('all-states')} className="back-button">
                &larr; Back to All States
              </button>
              <p className="state-description">{stateData.fullDescription}</p>

              <div className="gemini-features">
                <h2>✨ Discover More with AI</h2>
                <div className="gemini-buttons">
                  <button onClick={() => handleGeminiClick('fact')} className="gemini-button">
                    <span>💡</span> Did You Know?
                  </button>
                  <button onClick={() => handleGeminiClick('story')} className="gemini-button">
                    <span>📖</span> Story of the Craft
                  </button>
                  <button onClick={() => handleGeminiClick('culture')} className="gemini-button">
                    <span>🏛️</span> Cultural Heritage
                  </button>
                </div>
              </div>

              <h2 className="crafts-title">Featured Crafts from {stateData.name}</h2>
              <div className="crafts-grid">
                {stateData.crafts.map(craft => (
                  <CraftCard key={craft.name} craft={craft} onNavigate={onNavigate} />
                ))}
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StateDetailPage;