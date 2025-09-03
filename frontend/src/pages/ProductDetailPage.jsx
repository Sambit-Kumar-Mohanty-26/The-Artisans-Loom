import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetailPage.css';

const ProductDetailPage = ({ productId, onNavigate }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, cartItems } = useCart();
  const { currentUser } = useAuth(); 
  const [isAdding, setIsAdding] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      window.scrollTo(0, 0);
      
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError('Failed to fetch product data. Please try again.');
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      setShowLoginError(true);
      setTimeout(() => setShowLoginError(false), 3000);
      return;
    }
    if (!product) return;
    
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
    setTimeout(() => setIsAdding(false), 1500);
  };

  if (loading) {
    return <div className="page-loader">Loading Product...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  if (!product) {
    return <div className="page-error">Sorry, the product could not be loaded.</div>;
  }
  
  const isAlreadyInCart = cartItems.some(item => item.productId === product.id);
  const price = (product.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="product-detail-page">
      <div className="product-detail-image-container">
        <img src={product.imageUrl} alt={product.name} className="product-detail-image" />
      </div>
      <div className="product-detail-info">
        <p className="artisan-name" onClick={() => onNavigate(`artisan/${product.artisanId}`)}>
          By {product.artisanName}
        </p>
        <h1 className="product-title">{product.name}</h1>
        <p className="product-price">{price}</p>
        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <div className="meta-item">
            <strong>Category:</strong> <span>{product.category}</span>
          </div>
          <div className="meta-item">
            <strong>Region:</strong> <span>{product.region}</span>
          </div>
          <div className="meta-item">
            <strong>Materials:</strong> <span>{product.materials.join(', ')}</span>
          </div>
          <div className="meta-item">
            <strong>In Stock:</strong> <span>{product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</span>
          </div>
        </div>
        
        <div className="add-to-cart-container">
          <button 
            className={`add-to-cart-button ${isAdding ? 'adding' : ''} ${isAlreadyInCart ? 'in-cart' : ''}`}
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
            <div className="login-prompt-message">
              Please sign in to add items to your cart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;