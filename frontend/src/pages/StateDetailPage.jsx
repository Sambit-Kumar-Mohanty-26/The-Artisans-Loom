import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './StateDetailPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  backButton: "Back to All States",
  discoverTitle: "Discover More with AI",
  factButton: "Did You Know?",
  storyButton: "Story of the Craft",
  cultureButton: "Cultural Heritage",
  featuredCraftsTitle: "Featured Crafts from",
  stateNotFound: "State Not Found",
  generatingTitle: "Generating...",
  factModalTitle: "Did you know?",
  storyModalTitle: "A Story of",
  cultureModalTitle: "Cultural Connection",
  loadingModalText: "Weaving a story for you...",
};

const CraftCard = ({ craft, onNavigate }) => (
  <div 
    className="craft-card"
    onClick={() => onNavigate(`shop`)} 
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
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {isLoading ? <p>{content}</p> : <p dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />}
        </div>
      </div>
    </div>
  );
};

const StateDetailPage = ({ stateData, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [translatedStateData, setTranslatedStateData] = useState(stateData);
  const [isTranslating, setIsTranslating] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', content: '', isLoading: false });

  useEffect(() => {
    const translateAllContent = async () => {
      if (!stateData) return;
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        setTranslatedStateData(stateData);
        return;
      }
      setIsTranslating(true);
      try {
        const staticTexts = Object.values(englishContent);
        const dynamicTexts = [
          stateData.name,
          stateData.microtext,
          stateData.fullDescription,
          ...stateData.crafts.flatMap(c => [c.name, c.description])
        ];
        
        const result = await getTranslations({
          texts: [...staticTexts, ...dynamicTexts],
          targetLanguageCode: currentLanguage.code,
        });

        const translations = result.data.translations;
        
        setContent({
          backButton: translations[0], discoverTitle: translations[1], factButton: translations[2],
          storyButton: translations[3], cultureButton: translations[4], featuredCraftsTitle: translations[5],
          stateNotFound: translations[6], generatingTitle: translations[7], factModalTitle: translations[8],
          storyModalTitle: translations[9], cultureModalTitle: translations[10], loadingModalText: translations[11],
        });

        setTranslatedStateData({
          ...stateData,
          name: translations[12],
          microtext: translations[13],
          fullDescription: translations[14],
          crafts: stateData.crafts.map((craft, index) => ({
            ...craft,
            name: translations[15 + index * 2],
            description: translations[16 + index * 2],
          })),
        });

      } catch (err) {
        console.error("Failed to translate StateDetailPage:", err);
        setContent(englishContent);
        setTranslatedStateData(stateData);
      } finally {
        setIsTranslating(false);
      }
    };
    translateAllContent();
  }, [currentLanguage, stateData]);

  const callGemini = async (prompt) => {
    const proxyUrl = "https://getgeminiresponseproxy-kl46rrctoq-uc.a.run.app";
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
      if (!response.ok) throw new Error(`Proxy call failed`);
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
    const craftName = translatedStateData.crafts[0].name;
    const stateName = translatedStateData.name;

    setModalState({ isOpen: true, title: content.generatingTitle, content: content.loadingModalText, isLoading: true });

    switch (type) {
      case 'fact':
        title = content.factModalTitle;
        prompt = `In ${currentLanguage.name}, tell me a surprising "Did you know?" fact about the cultural heritage or crafts of ${stateName}, India.`;
        break;
      case 'story':
        title = `${content.storyModalTitle} ${craftName}`;
        prompt = `In ${currentLanguage.name}, tell me a short, engaging folk tale (around 150 words) related to the traditional craft of ${craftName} from ${stateName}.`;
        break;
      case 'culture':
        title = content.cultureModalTitle;
        prompt = `In ${currentLanguage.name}, briefly explain the cultural significance of ${craftName} in the heritage of ${stateName}.`;
        break;
      default:
        setModalState({ isOpen: false, title: '', content: '', isLoading: false });
        return;
    }
    
    const response = await callGemini(prompt);
    setModalState({ isOpen: true, title, content: response, isLoading: false });
  };

  if (!translatedStateData) {
    return (
      <div className="state-detail-page-container">
        <div className="page-header">
          <h1>{content.stateNotFound}</h1>
          <button onClick={() => onNavigate('all-states')} className="back-button">
            &larr; {content.backButton}
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
      <div className={`state-detail-page-container ${isTranslating ? 'translating' : ''}`}>
        <div className="state-banner" style={{ backgroundImage: `url(${translatedStateData.image})` }}>
          <div className="banner-overlay">
            <h1 className="banner-title">{translatedStateData.name}</h1>
            <p className="banner-microtext">{translatedStateData.microtext}</p>
          </div>
        </div>
        <div className="state-content-wrapper">
          <div className="state-content">
              <button onClick={() => onNavigate('all-states')} className="back-button">
                &larr; {content.backButton}
              </button>
              <p className="state-description">{translatedStateData.fullDescription}</p>

              <div className="gemini-features">
                <h2>{content.discoverTitle}</h2>
                <div className="gemini-buttons">
                  <button onClick={() => handleGeminiClick('fact')} className="gemini-button">
                    <span>💡</span> {content.factButton}
                  </button>
                  <button onClick={() => handleGeminiClick('story')} className="gemini-button">
                    <span>📖</span> {content.storyButton}
                  </button>
                  <button onClick={() => handleGeminiClick('culture')} className="gemini-button">
                    <span>🏛️</span> {content.cultureButton}
                  </button>
                </div>
              </div>

              <h2 className="crafts-title">{content.featuredCraftsTitle} {translatedStateData.name}</h2>
              <div className="crafts-grid">
                {translatedStateData.crafts.map(craft => (
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