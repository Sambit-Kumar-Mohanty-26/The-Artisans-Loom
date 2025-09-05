import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import './ArtisanProfilePage.css';

const getArtisanProfile = httpsCallable(functions, 'getArtisanProfile');
const submitReview = httpsCallable(functions, 'submitReview');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  loadingProfile: "Loading Artisan Profile...",
  artisanNotFound: "Artisan not found.",
  profileLoadError: "Failed to load the artisan profile. Please try again.",
  aboutTitle: "About the Artisan",
  noStory: "No story has been provided by this artisan yet.",
  creationsTitle: "Creations by",
  noProducts: "hasn't listed any products yet.",
  reviewsTitle: "Customer Reviews",
  noReviews: "Be the first to leave a review for",
  leaveReviewTitle: "Leave a Review",
  reviewPlaceholder: "Share your thoughts about the artisan's craft...",
  submitButton: "Submit Review",
  submittingButton: "Submitting...",
};

const ArtisanProfilePage = ({ artisanId, onNavigate }) => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!artisanId) {
      setError("Artisan ID is missing.");
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getArtisanProfile({ artisanId });
        setArtisan(result.data.artisan);
        setProducts(result.data.products);
      } catch (err) {
        console.error("Error fetching artisan profile:", err);
        setError(err.message || 'Failed to load artisan profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
    const reviewsRef = collection(db, `users/${artisanId}/reviews`);
    const qReviews = query(reviewsRef, orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(fetchedReviews);
    });

    return () => unsubscribeReviews();
  }, [artisanId]);

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
          loadingProfile: translations[0], artisanNotFound: translations[1],
          profileLoadError: translations[2], aboutTitle: translations[3],
          noStory: translations[4], creationsTitle: translations[5],
          noProducts: translations[6], reviewsTitle: translations[7],
          noReviews: translations[8], leaveReviewTitle: translations[9],
          reviewPlaceholder: translations[10], submitButton: translations[11],
          submittingButton: translations[12],
        });
      } catch (err) {
        console.error("Failed to translate ArtisanProfilePage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to leave a review.");
      return;
    }
    if (newReview.rating > 0 && newReview.comment.trim()) {
      setIsSubmitting(true);
      try {
        await submitReview({ artisanId, rating: newReview.rating, comment: newReview.comment });
        setNewReview({ rating: 0, comment: '' });
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("There was an error submitting your review.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) return <div className="page-loader">{content.loadingProfile}</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!artisan) return <div className="page-error">{content.profileLoadError}</div>;
  
  return (
    <div className={`artisan-profile-page ${isTranslating ? 'translating' : ''}`}>
      <div className="profile-header">
        <img src={artisan.photoURL || `https://ui-avatars.com/api/?name=${artisan.displayName.replace(' ', '+')}`} alt={artisan.displayName} className="profile-avatar" />
        <div className="profile-header-info">
          <h1 className="artisan-name-title">{artisan.displayName}</h1>
          <p className="artisan-location">{artisan.location}</p>
          <p className="artisan-specialization">{artisan.specialization}</p>
        </div>
      </div>

      <div className="profile-body">
        <div className="about-section">
          <h2>{content.aboutTitle}</h2>
          <p>{artisan.story || content.noStory}</p>
        </div>

        <div className="gallery-section">
          <h2>{content.creationsTitle} {artisan.displayName}</h2>
          {products.length > 0 ? (
            <div className="shop-product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <p className="no-products-message">{artisan.displayName} {content.noProducts}</p>
          )}
        </div>

        <div className="reviews-section">
          <h2>{content.reviewsTitle} ({reviews.length})</h2>
          <div className="reviews-layout">
            <div className="review-list">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-rating-display">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'star-active' : ''}>★</span>
                    ))}
                  </div>
                  <p className="review-comment">"{review.comment}"</p>
                  <p className="review-author">- {review.customerName || 'Anonymous'}</p>
                </div>
              )) : <p>{content.noReviews} {artisan.displayName}!</p>}
            </div>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <h3>{content.leaveReviewTitle}</h3>
              <div className="star-rating">
                {[5, 4, 3, 2, 1].map((star) => (
                  <span 
                    key={star}
                    className={star <= (hoverRating || newReview.rating) ? 'star-active' : ''}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewReview({...newReview, rating: star})}
                  >★</span>
                ))}
              </div>
              <textarea 
                placeholder={content.reviewPlaceholder}
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                required
              ></textarea>
              <button type="submit" disabled={isSubmitting || newReview.rating === 0}>
                {isSubmitting ? content.submittingButton : content.submitButton}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanProfilePage;