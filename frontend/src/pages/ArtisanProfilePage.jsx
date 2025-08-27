import React, { useState, useEffect } from 'react';
import './ArtisanProfilePage.css';
import { allArtisansData } from '../data/artisans';
import { useAuth } from '../context/AuthContext';
import { functions, db } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const submitReview = httpsCallable(functions, 'submitReview');

const sampleProducts = [
    { name: 'Wooden Bowl', price: 45, image: 'https://placehold.co/200x200/8D6E63/FFFFFF?text=Bowl' },
    { name: 'Wooden Vase', price: 50, image: 'https://placehold.co/200x200/A1887F/FFFFFF?text=Vase' },
    { name: 'Carved Spoon', price: 25, image: 'https://placehold.co/200x200/BCAAA4/FFFFFF?text=Spoon' },
    { name: 'Coaster Set', price: 35, image: 'https://placehold.co/200x200/D7CCC8/FFFFFF?text=Coasters' },
];

const ArtisanProfilePage = ({ artisanId, onNavigate }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const artisan = allArtisansData.find(a => a.id === artisanId);

  useEffect(() => {
    if (!artisanId) return;
    const reviewsRef = collection(db, `users/${artisanId}/reviews`);
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReviews = [];
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [artisanId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("Please log in to leave a review.");
        return;
    }
    if (newReview.rating > 0 && newReview.comment) {
      setIsSubmitting(true);
      try {
        await submitReview({ 
            artisanId: artisan.id, 
            rating: newReview.rating, 
            comment: newReview.comment 
        });
        setNewReview({ rating: 0, comment: '' }); 
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!artisan) {
    return (
        <div className="artisan-profile-page">
            <div className="profile-content">
                <h2>Artisan Not Found</h2>
                <button onClick={() => onNavigate('all-artisans')} className="shop-now-button">
                    &larr; Back to All Artisans
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="artisan-profile-page">
      <div className="profile-banner" style={{backgroundImage: `url(${artisan.bannerImage})`}}></div>
      
      <div className="profile-header">
        <img src={artisan.image} alt={artisan.name} className="profile-avatar" />
        <div className="profile-header-info">
          <h1>{artisan.name}</h1>
          <p>Handcrafted {artisan.specialty.toLowerCase()} from {artisan.location}</p>
          <div className="reviews-summary">
            <span>⭐⭐⭐⭐⭐</span> {reviews.length} reviews
          </div>
        </div>
      </div>

      <div className="profile-body">
        <button onClick={() => onNavigate('home')} className="back-button">
            &larr; Back to Home
        </button>

        <div className="about-section">
          <h2>About the Artisan</h2>
          <p>{artisan.bio}</p>
          <p><strong>Specialization:</strong> {artisan.specialty}</p>
        </div>

        <div className="gallery-section">
          <h2>Product Gallery</h2>
          <div className="product-gallery-grid">
            {sampleProducts.map(product => (
                <div key={product.name} className="gallery-product-card">
                    <img src={product.image} alt={product.name} />
                    <h3>{product.name}</h3>
                    <p>${product.price}</p>
                    <span>⭐⭐⭐⭐⭐</span>
                    <button className="buy-now-button">Buy Now</button>
                </div>
            ))}
          </div>
        </div>

        <div className="reviews-section">
            <h2>Customer Reviews</h2>
            <div className="reviews-layout">
                <div className="review-list">
                    {reviews.length > 0 ? reviews.map((review) => (
                        <div key={review.id} className="review-item">
                            <p className="review-author"><strong>{review.customerName}</strong></p>
                            <div className="review-rating-display">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < review.rating ? 'star-active' : ''}>★</span>
                                ))}
                            </div>
                            <p className="review-comment">{review.comment}</p>
                            <p className="review-date">{review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                        </div>
                    )) : <p>No reviews yet. Be the first to leave one!</p>}
                </div>
                <form onSubmit={handleReviewSubmit} className="review-form">
                    <h3>Leave a Review</h3>
                    <div className="star-rating">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <span 
                                key={star}
                                className={star <= (hoverRating || newReview.rating) ? 'star-active' : ''}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewReview({...newReview, rating: star})}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <textarea 
                        placeholder="Share your thoughts..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        required
                    ></textarea>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanProfilePage;