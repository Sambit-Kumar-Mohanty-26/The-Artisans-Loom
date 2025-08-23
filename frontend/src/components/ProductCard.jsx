import React from 'react';
import './ProductCard.css';
import Button from './Button';

const ProductCard = ({ product }) => {
  const originalPrice = product.price / (1 - product.discount / 100);

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-tags">
          {product.tag && <span className={`tag ${product.tag.toLowerCase().replace(' ', '-')}`}>{product.tag}</span>}
          {product.discount && <span className="tag discount">{product.discount}% OFF</span>}
        </div>
        <button className="favorite-button">♡</button>
      </div>
      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-artisan">by {product.artisan}</p>
        <div className="product-rating">
          <span>⭐ {product.rating}</span> ({product.reviews})
        </div>
        <div className="product-pricing">
          <span className="current-price">₹{product.price.toLocaleString()}</span>
          <span className="original-price">₹{originalPrice.toLocaleString()}</span>
        </div>
        <Button text="Add to Cart" type="primary" block={true} />
      </div>
    </div>
  );
};

export default ProductCard;