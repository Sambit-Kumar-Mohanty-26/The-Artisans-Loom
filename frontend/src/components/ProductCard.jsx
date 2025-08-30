import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const imageUrl = product.image || product.imageUrl || 'https://via.placeholder.com/300';
  const originalPrice = product.originalPrice;
  const displayPrice = product.price;

  return (
    <div className="product-card">
      <button className="favorite-button">♡</button>

      <div className="product-image-container">
        <img src={imageUrl} alt={product.name} className="product-image" />

        <div className="product-tags">
          {product.tag && (
            <span className={`product-tag-ribbon ${product.tag.toLowerCase().replace(/\s/g, '-')}`}>
              {product.tag}
            </span>
          )}
          {product.discount && (
            <span className="discount-pill">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>
        {product.artisan && <p className="product-artisan">by {product.artisan}</p>}

        {product.rating && product.reviews && (
          <div className="product-rating">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={`star ${index < Math.round(product.rating) ? 'filled' : ''}`}
              >
                ★
              </span>
            ))}
            <span className="rating-text">
              {product.rating} ({product.reviews})
            </span>
          </div>
        )}

        <div className="product-pricing">
          <span className="current-price">
            ₹{displayPrice?.toLocaleString('en-IN')}
          </span>
          {originalPrice && (
            <span className="original-price">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="btn-container">
          <button className="add-to-cart-btn">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
