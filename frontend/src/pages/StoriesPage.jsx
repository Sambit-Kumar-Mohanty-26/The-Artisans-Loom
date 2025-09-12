import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './StoriesPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');
const getTranslatedDocument = httpsCallable(functions, 'getTranslatedDocument');

const englishContent = {
  title: "The Loom",
  subtitle: "Weaving together the stories, traditions, and people behind the craft.",
  readStory: "Read Full Story",
  moreStories: "More Stories",
  loading: "Gathering stories...",
  noStories: "No stories have been published yet. Check back soon!",
};

const StoriesPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (currentLanguage.code === 'en') {
        setStories(storiesData);
      } else {
        try {
          const translationPromises = storiesData.map(story => 
            getTranslatedDocument({
              collectionPath: 'stories',
              docId: story.id,
              targetLanguageCode: currentLanguage.code
            })
          );
          const translatedResults = await Promise.all(translationPromises);
          setStories(translatedResults.map(res => res.data));
        } catch (error) {
          console.error("Failed to fetch translated stories:", error);
          setStories(storiesData); // Fallback to English on error
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLanguage]);

  useEffect(() => {
    const translateUiContent = async () => {
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
          title: translations[0],
          subtitle: translations[1],
          readStory: translations[2],
          moreStories: translations[3],
          loading: translations[4],
          noStories: translations[5],
        });
      } catch (err) {
        console.error("Failed to translate StoriesPage UI content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateUiContent();
  }, [currentLanguage]);

  if (loading) {
    return <div className="page-loader">{content.loading}</div>;
  }
  
  const featuredStory = stories[0];
  const otherStories = stories.slice(1);

  return (
    <div className={`stories-page ${isTranslating ? 'translating' : ''}`}>
      <div className="stories-header">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
      </div>

      {stories.length === 0 && (
        <p className="no-stories-message">{content.noStories}</p>
      )}

      {featuredStory && (
        <div className="featured-story-card" onClick={() => onNavigate(`story/${featuredStory.id}`)}>
          <div 
            className="featured-image-container" 
            style={{ backgroundImage: `url(${featuredStory.heroImageURL})` }}
          ></div>
          <div className="featured-content">
            <span className="story-category">{featuredStory.category}</span>
            <h2>{featuredStory.title}</h2>
            <p>{featuredStory.excerpt}</p>
            <span className="read-story-link">{content.readStory} →</span>
          </div>
        </div>
      )}
      
      {otherStories.length > 0 && (
        <div className="more-stories-section">
          <h2>{content.moreStories}</h2>
          <div className="stories-grid">
            {otherStories.map(story => (
              <div key={story.id} className="story-card" onClick={() => onNavigate(`story/${story.id}`)}>
                <div className="story-card-image">
                  <img src={story.heroImageURL} alt={story.title} />
                </div>
                <div className="story-card-content">
                  <span className="story-category">{story.category}</span>
                  <h3>{story.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;