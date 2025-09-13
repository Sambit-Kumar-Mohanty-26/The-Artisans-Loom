import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import ProductCard from '../components/ProductCard';
import ConfirmationModal from '../components/ConfirmationModal';
import './StoryDetailPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');
const getTranslatedDocument = httpsCallable(functions, 'getTranslatedDocument');
const deleteStory = httpsCallable(functions, 'deleteStory');

const englishContent = {
  loadingStory: "Loading Story...",
  storyNotFound: "Story Not Found",
  shopTheStory: "Shop the Story",
  by: "by",
  deleteStoryButton: "Delete Story",
  confirmDeleteTitle: "Confirm Deletion",
  confirmDeleteMessage: "Are you sure you want to permanently delete this story?",
  deleteLabel: "Delete",
  cancelLabel: "Cancel",
};

const StoryDetailPage = ({ storyId, onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const { userProfile } = useAuth();
  
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [story, setStory] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchStoryAndProducts = async () => {
      if (!storyId) {
        setError("Story ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        let storyData;
        if (currentLanguage.code === 'en') {
          const storyRef = doc(db, 'stories', storyId);
          const storySnap = await getDoc(storyRef);
          if (storySnap.exists()) {
            storyData = { id: storySnap.id, ...storySnap.data() };
          }
        } else {
          const result = await getTranslatedDocument({
            collectionPath: 'stories',
            docId: storyId,
            targetLanguageCode: currentLanguage.code
          });
          storyData = result.data;
        }
        if (storyData) {
          setStory(storyData);
          if (storyData.featuredProductIds && storyData.featuredProductIds.length > 0) {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('__name__', 'in', storyData.featuredProductIds));
            const productsSnap = await getDocs(q);
            const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFeaturedProducts(productsData);
          }
        } else {
          setError(content.storyNotFound);
        }
      } catch (err) {
        console.error("Error fetching story details:", err);
        setError("Failed to load story.");
      } finally {
        setLoading(false);
      }
    };
    fetchStoryAndProducts();
  }, [storyId, currentLanguage, content.storyNotFound]);

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
          loadingStory: translations[0], storyNotFound: translations[1], shopTheStory: translations[2],
          by: translations[3], deleteStoryButton: translations[4], confirmDeleteTitle: translations[5],
          confirmDeleteMessage: translations[6], deleteLabel: translations[7], cancelLabel: translations[8],
        });
      } catch (err) {
        console.error("Failed to translate StoryDetailPage UI content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateUiContent();
  }, [currentLanguage]);
  
  const handleConfirmDelete = async () => {
    try {
      await deleteStory({ storyId: story.id });
      setIsDeleteModalOpen(false);
      onNavigate('stories');
    } catch (error) {
      console.error("Failed to delete story:", error);
      alert(error.message);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return <div className="page-loader">{content.loadingStory}</div>;
  }
  
  if (error) {
    return <div className="page-error">{error}</div>;
  }

  if (!story) {
    return <div className="page-error">{content.storyNotFound}</div>;
  }

  const isAuthor = userProfile && userProfile.uid === story.featuredArtisanId;

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={content.confirmDeleteTitle}
        message={content.confirmDeleteMessage}
        confirmText={content.deleteLabel}
        cancelText={content.cancelLabel}
      />
      <div className={`story-detail-page ${isTranslating ? 'translating' : ''}`}>
        <div className="story-hero-banner" style={{backgroundImage: `url(${story.heroImageURL})`}}>
          <div className="story-hero-overlay">
              <p className="story-hero-category">{story.category}</p>
              <h1 className="story-hero-title">{story.title}</h1>
              <p className="story-hero-author">{content.by} {story.author}</p>
          </div>
        </div>
        <div className="story-content-container">
          {isAuthor && (
            <div className="story-actions-bar">
              <button className="delete-story-btn" onClick={() => setIsDeleteModalOpen(true)}>
                {content.deleteStoryButton}
              </button>
            </div>
          )}

          <div 
            className="story-body"
            dangerouslySetInnerHTML={{ __html: story.body.replace(/\n/g, '<br />') }}
          >
          </div>

          {featuredProducts.length > 0 && (
            <div className="shop-the-story-section">
              <h2>{content.shopTheStory}</h2>
              <div className="shop-product-grid">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StoryDetailPage;