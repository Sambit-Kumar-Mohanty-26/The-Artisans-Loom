import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './AllStatesPage.css';
import { allStatesData as englishStatesData } from '../data/artisans';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  pageTitle: "Explore by State",
  subtitle: "Discover the rich tapestry of Indian craftsmanship, one state at a time.",
  searchPlaceholder: "Search by state or craft (e.g., 'Pashmina')",
  featuredCraftsLabel: "Featured Crafts:",
};

const StateCard = ({ state, onNavigate }) => (
  <div 
    className="state-card"
    onClick={() => onNavigate(`state/${state.slug}`)}
  >
    <div className="state-card-image" style={{ backgroundImage: `url(${state.image})` }}></div>
    <div className="state-info">
      <div className="state-header">
        <span className="craft-badge">{state.badge}</span>
        <h3 className="state-name">{state.name}</h3>
      </div>
      <p className="state-microtext">{state.microtext}</p>
      <div className="state-crafts-container">
        <p className="crafts-title">{state.featuredCraftsLabel || englishContent.featuredCraftsLabel}</p>
        <div className="crafts-list">
            {state.crafts.slice(0, 2).map(craft => (
              <div key={craft.name} className="craft-item" title={craft.description}>
                <img src={craft.image} alt={craft.name} className="craft-item-image" />
                <span className="craft-item-name">{craft.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  </div>
);

const AllStatesPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState(englishContent);
  const [allStates, setAllStates] = useState(
    englishStatesData.map(s => ({...s, slug: s.name.toLowerCase().replace(/[\s&,]+/g, '-')}))
  );
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateAllContent = async () => {
      window.scrollTo(0, 0);

      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        setAllStates(englishStatesData.map(s => ({...s, slug: s.name.toLowerCase().replace(/[\s&,]+/g, '-')})));
        return;
      }

      setIsTranslating(true);
      try {
        const textsToTranslate = [
          ...Object.values(englishContent),
          ...englishStatesData.flatMap(state => [
            state.name,
            state.microtext,
            state.fullDescription,
            ...state.crafts.flatMap(craft => [craft.name, craft.description])
          ])
        ].filter(Boolean); 

        const result = await getTranslations({
          texts: textsToTranslate,
          targetLanguageCode: currentLanguage.code,
        });

        const translations = result.data.translations;
        let translationIndex = 0;
        const newContent = {
            pageTitle: translations[translationIndex++],
            subtitle: translations[translationIndex++],
            searchPlaceholder: translations[translationIndex++],
            featuredCraftsLabel: translations[translationIndex++],
        };
        setContent(newContent);

        const translatedStates = englishStatesData.map(state => {
          const translatedName = translations[translationIndex++];
          const translatedMicrotext = translations[translationIndex++];
          const translatedFullDescription = translations[translationIndex++];
          const translatedCrafts = state.crafts.map(() => ({
            name: translations[translationIndex++],
            description: translations[translationIndex++],
          }));
          return {
            ...state,
            name: translatedName,
            microtext: translatedMicrotext,
            fullDescription: translatedFullDescription,
            crafts: state.crafts.map((craft, i) => ({...craft, ...translatedCrafts[i]})),
            slug: state.name.toLowerCase().replace(/[\s&,]+/g, '-')
          };
        });
        setAllStates(translatedStates);

      } catch (err) {
        console.error("Failed to translate AllStatesPage content:", err);
        setContent(englishContent);
        setAllStates(englishStatesData.map(s => ({...s, slug: s.name.toLowerCase().replace(/[\s&,]+/g, '-')})));
      } finally {
        setIsTranslating(false);
      }
    };
    translateAllContent();
  }, [currentLanguage]);

  const filteredStates = allStates.filter(state => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return (
      state.name.toLowerCase().includes(lowercasedFilter) ||
      state.crafts.some(craft => craft.name.toLowerCase().includes(lowercasedFilter))
    );
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className={`all-states-page ${isTranslating ? 'translating' : ''}`}>
      <div className="page-header">
        <h1>{content.pageTitle}</h1>
        <p>{content.subtitle}</p>
        <div className="search-container">
          <input
            type="text"
            placeholder={content.searchPlaceholder}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="states-grid">
        {filteredStates.map(state => (
          <StateCard key={state.slug} state={{...state, featuredCraftsLabel: content.featuredCraftsLabel}} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export const findStateData = (stateSlug) => {
    return englishStatesData.find(state => state.name.toLowerCase().replace(/[\s&,]+/g, '-') === stateSlug);
};

export default AllStatesPage;
