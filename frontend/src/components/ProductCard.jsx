import React, { useState, useEffect } from 'react';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  by: "by",
  outOfStock: "Out of Stock",
  addedToCart: "Added to Cart ✓",
  adding: "Adding...",
  addToCart: "Add to Cart",
  loginError: "Please log in to add items.",
  verifiedTooltip: "Verified Artisan",
};

const ProductCard = ({ product, onNavigate }) => {
  const { currentUser } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { wishlist, toggleItem } = useWishlist();
  const { currentLanguage } = useLanguage();

  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);

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
          by: translations[0],
          outOfStock: translations[1],
          addedToCart: translations[2],
          adding: translations[3],
          addToCart: translations[4],
          loginError: translations[5],
          verifiedTooltip: translations[6],
        });
      } catch (err) {
        console.error("Failed to translate ProductCard content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const isAlreadyInCart = cartItems.some(
    (item) => item.productId === product.id
  );

  const imageUrl = product.image || product.imageUrl || 'https://via.placeholder.com/300';
  const originalPrice = product.originalPrice;
  const displayPrice = product.price / 100;
  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      setShowLoginError(true);
      setTimeout(() => setShowLoginError(false), 2500);
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 1500);
  };

  const handleNavigate = () => {
    if (typeof onNavigate === 'function') {
      onNavigate(`product/${product.id}`);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleItem(product.id);
  };

  return (
    <div className={`product-card ${isTranslating ? 'translating' : ''}`} onClick={handleNavigate}>
      <button className={`favorite-button ${isWishlisted ? 'wishlisted' : ''}`} onClick={handleWishlistClick}>
        {isWishlisted ? '♥' : '♡'}
      </button>

      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" />
        <div className="product-tags">
          {product.tag && (
            <span className={`product-tag-ribbon ${product.tag.toLowerCase().replace(/\s/g, '-')}`}>
              {product.tag}
            </span>
          )}
          {product.discount > 0 && (
            <span className="discount-pill">{product.discount}% OFF</span>
          )}
        </div>
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name || 'Untitled Product'}</h3>
        {product.artisanName && (
          <div className="artisan-info-badge">
            <p className="product-artisan">{content.by} {product.artisanName}</p>
            {product.artisanIsVerified && (
              <span className="verified-badge-small" data-tooltip={content.verifiedTooltip}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4-5.5z" clipRule="evenodd" /></svg>
              </span>
            )}
          </div>
        )}
        {product.reviews > 0 && (
          <div className="product-rating">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className={`star ${index < Math.round(product.rating) ? 'filled' : ''}`}>★</span>
            ))}
            <span className="rating-text">{product.rating.toFixed(1)} ({product.reviews})</span>
          </div>
        )}
        <div className="product-pricing">
          <span className="current-price">₹{displayPrice ? displayPrice.toLocaleString('en-IN') : 'N/A'}</span>
          {originalPrice && (
            <span className="original-price">₹{(originalPrice / 100).toLocaleString('en-IN')}</span>
          )}
        </div>
        <div className="btn-container">
          <button
            className={`add-to-cart-btn ${isAdding ? 'adding' : ''} ${isAlreadyInCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={isAlreadyInCart || product.stock === 0 || isAdding}
          >
            {product.stock === 0
              ? content.outOfStock
              : isAlreadyInCart && !isAdding
              ? content.addedToCart
              : isAdding
              ? content.adding
              : content.addToCart}
          </button>
          {showLoginError && (
            <div className="login-error-message">
              <span className="error-icon">✖</span> {content.loginError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;