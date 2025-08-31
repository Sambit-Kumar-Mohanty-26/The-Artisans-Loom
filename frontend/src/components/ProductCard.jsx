import React, { useState } from 'react';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { currentUser } = useAuth();
  const { addToCart, cartItems } = useCart();

  const [isAdding, setIsAdding] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);

  const isAlreadyInCart = cartItems.some(
    (item) => item.productId === product.id
  );

  const imageUrl =
    product.image || product.imageUrl || 'https://via.placeholder.com/300';
  const originalPrice = product.originalPrice;
  const displayPrice = product.price;

  const handleAddToCart = async () => {
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

  return (
    <div className="product-card">
      <button className="favorite-button">♡</button>

      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" />

        <div className="product-tags">
          {product.tag && (
            <span
              className={`product-tag-ribbon ${product.tag
                .toLowerCase()
                .replace(/\s/g, '-')}`}
            >
              {product.tag}
            </span>
          )}

          {product.discount > 0 && (
            <span className="discount-pill">{product.discount}% OFF</span>
          )}
        </div>
      </div>

      <div className="product-details">
        <h3 className="product-name">
          {product.name || 'Untitled Product'}
        </h3>

        {product.artisan && (
          <p className="product-artisan">by {product.artisan}</p>
        )}

        {product.reviews > 0 && (
          <div className="product-rating">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`star ${
                  index < Math.round(product.rating) ? 'filled' : ''
                }`}
              >
                ★
              </span>
            ))}
            <span className="rating-text">
              {product.rating.toFixed(1)} ({product.reviews})
            </span>
          </div>
        )}

        <div className="product-pricing">
          <span className="current-price">
            ₹
            {displayPrice
              ? displayPrice.toLocaleString('en-IN')
              : 'N/A'}
          </span>
          {originalPrice && (
            <span className="original-price">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="btn-container">
          <button
            className={`add-to-cart-btn 
              ${isAdding ? 'adding' : ''} 
              ${isAlreadyInCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={isAlreadyInCart || product.stock === 0 || isAdding}
          >
            {product.stock === 0
              ? 'Out of Stock'
              : isAlreadyInCart && !isAdding
              ? 'Added to Cart ✓'
              : isAdding
              ? 'Adding...'
              : 'Add to Cart'}
          </button>

          {showLoginError && (
            <div className="login-error-message">
              <span className="error-icon">✖</span> Please log in to add items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
