import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './CreatePostPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Create a New Post",
  subtitle: "Share your thoughts, ask a question, or start a new conversation with the artisan community.",
  categoryLabel: "Select a Category",
  selectCategoryDefault: "Choose a category...",
  postTitleLabel: "Post Title",
  postTitlePlaceholder: "Enter a clear and engaging title...",
  contentLabel: "Your Content",
  contentPlaceholder: "Write your post here. You can ask for advice, share a technique, or discuss an event...",
  submitButton: "Publish Post",
  publishingButton: "Publishing...",
  successMessage: "Your post has been published successfully!",
  errorMessage: "Failed to publish post. Please try again.",
  cancelButton: "Cancel",
  requiredError: "Please fill out all fields.",
  authError: "You must be logged in to create a post.",
  authenticating: "Authenticating...",
};

const CreatePostPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ categoryId: '', title: '', content: '' });
  const [content, setContent] = useState(englishContent);
  
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'forumCategories');
        const snapshot = await getDocs(categoriesRef);
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const translateContent = async () => {
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
          title: translations[0], subtitle: translations[1], categoryLabel: translations[2],
          selectCategoryDefault: translations[3], postTitleLabel: translations[4], postTitlePlaceholder: translations[5],
          contentLabel: translations[6], contentPlaceholder: translations[7], submitButton: translations[8],
          publishingButton: translations[9], successMessage: translations[10], errorMessage: translations[11],
          cancelButton: translations[12], requiredError: translations[13], authError: translations[14],
          authenticating: translations[15],
        });
      } catch (err) {
        console.error("Failed to translate CreatePostPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userProfile) {
      setError(content.authError);
      return;
    }

    if (!formData.title.trim() || !formData.content.trim() || !formData.categoryId) {
      setError(content.requiredError);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const postsRef = collection(db, 'forumPosts');
      await addDoc(postsRef, {
        ...formData,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorPhotoURL: userProfile.photoURL,
        createdAt: serverTimestamp(),
        replyCount: 0,
        isFlagged: false,
        isModerated: false,
      });
      setSuccess(content.successMessage);
      setTimeout(() => {
        onNavigate('forum');
      }, 1500);

    } catch (err) {
      setError(content.errorMessage);
      console.error("Error creating post:", err);
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="page-loader">{content.authenticating}</div>;
  }

  return (
    <div className={`create-post-page ${isTranslating ? 'translating' : ''}`}>
      <div className="form-container">
        <div className="page-header">
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-group">
            <label htmlFor="categoryId">{content.categoryLabel}</label>
            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="" disabled>{content.selectCategoryDefault}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="title">{content.postTitleLabel}</label>
            <input 
              id="title" 
              name="title" 
              type="text" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder={content.postTitlePlaceholder}
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">{content.contentLabel}</label>
            <textarea 
              id="content" 
              name="content" 
              rows="10" 
              value={formData.content} 
              onChange={handleChange}
              placeholder={content.contentPlaceholder}
              required
            ></textarea>
          </div>

          {!userProfile ? (
             <p className="error-message">{content.authError}</p>
          ) : (
            <>
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => onNavigate('forum')}>{content.cancelButton}</button>
            <button type="submit" className="publish-btn" disabled={loading || !userProfile}>
              {loading ? content.publishingButton : content.submitButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;