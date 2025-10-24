import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { httpsCallable } from 'firebase/functions';
import './ProductDetailPage.css';
import ARViewer from '../components/ARViewer'; // Ensure this path is correct

const translateProduct = httpsCallable(functions, 'translateProduct');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  byArtisan: "By",
  categoryLabel: "Category:",
  regionLabel: "Region:",
  materialsLabel: "Materials:",
  stockLabel: "In Stock:",
  availableSuffix: "available",
  outOfStock: "Out of Stock",
  addToCartButton: "Add to Cart",
  addingButton: "Adding...",
  inCartButton: "Added to Cart ✓",
  loginPrompt: "Please sign in to add items to your cart.",
  loadingProduct: "Loading Product...",
  productNotFound: "Product not found.",
  productLoadError: "Sorry, the product could not be loaded.",
  translatingOverlay: "Translating...",
};

const ProductDetailPage = ({ productId, onNavigate }) => {
  const [originalProduct, setOriginalProduct] = useState(null);
  const [displayProduct, setDisplayProduct] = useState(null);
  const [content, setContent] = useState(englishContent);
  const [loading, setLoading] = useState(true);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToCart, cartItems } = useCart();
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [showAR, setShowAR] = useState(false); // State to control AR viewer visibility

  useEffect(() => {
    const fetchProduct = async () => {
      window.scrollTo(0, 0);
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = {
            id: docSnap.id,
            ...docSnap.data(),
            // IMPORTANT: Replace this with your actual GLTF model URL!
            // This URL must be publicly accessible and have correct CORS headers.
            gltfModelUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
          };
          setOriginalProduct(productData);
          setDisplayProduct(productData);
        } else {
          setError(content.productNotFound);
        }
      } catch (err) {
        setError(content.productLoadError);
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    const handleLanguageChange = async () => {
      if (!originalProduct) return;

      if (currentLanguage.code === 'en') {
        setDisplayProduct(originalProduct);
        setContent(englishContent);
        return;
      }

      setTranslationLoading(true);
      try {
        const staticTexts = Object.values(englishContent);
        const staticResult = await getTranslations({
          texts: staticTexts,
          targetLanguageCode: currentLanguage.code,
        });
        const staticTranslations = staticResult.data.translations;
        setContent({
          byArtisan: staticTranslations[0], categoryLabel: staticTranslations[1], regionLabel: staticTranslations[2],
          materialsLabel: staticTranslations[3], stockLabel: staticTranslations[4], availableSuffix: staticTranslations[5],
          outOfStock: staticTranslations[6], addToCartButton: staticTranslations[7], addingButton: staticTranslations[8],
          inCartButton: staticTranslations[9], loginPrompt: staticTranslations[10], loadingProduct: staticTranslations[11],
          productNotFound: staticTranslations[12], productLoadError: staticTranslations[13], translatingOverlay: staticTranslations[14],
        });
        
        const productResult = await translateProduct({
          productId: originalProduct.id,
          targetLanguageCode: currentLanguage.code,
        });
        
        setDisplayProduct({
          ...originalProduct,
          name: productResult.data.name,
          description: productResult.data.description,
          category: productResult.data.category,
          region: productResult.data.region,
          materials: productResult.data.materials,
        });

      } catch (err) {
        console.error("Translation failed:", err);
        setDisplayProduct(originalProduct);
        setContent(englishContent);
      } finally {
        setTranslationLoading(false);
      }
    };

    handleLanguageChange();
  }, [currentLanguage, originalProduct]);

  const handleAddToCart = async () => {
    if (!currentUser) {
      setShowLoginError(true);
      setTimeout(() => setShowLoginError(false), 3000);
      return;
    }
    if (!displayProduct) return;
    setIsAdding(true);
    try {
      await addToCart(displayProduct.id, 1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
    setTimeout(() => setIsAdding(false), 1500);
  };

  const handleToggleAR = () => {
    setShowAR(prev => !prev);
  };

  if (loading) return <div className="page-loader">{content.loadingProduct}</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!displayProduct) return <div className="page-error">{content.productLoadError}</div>;
  
  const isAlreadyInCart = cartItems.some(item => item.productId === displayProduct.id);
  const price = (displayProduct.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="product-detail-page">
      {/* IMPORTANT: Only render ARViewer when showAR is true.
          This ensures A-Frame/AR.js initializes and cleans up properly. */}
      {showAR && <ARViewer modelUrl={displayProduct.gltfModelUrl} onClose={handleToggleAR} />}

      <div className="product-detail-image-container">
        <img src={displayProduct.imageUrl} alt={displayProduct.name} className="product-detail-image" />
      </div>
      <div className="product-detail-info">
        {translationLoading && <div className="translation-overlay">{content.translatingOverlay}</div>}
        
        <p className="artisan-name" onClick={() => onNavigate(`artisan/${displayProduct.artisanId}`)}>
          {content.byArtisan} {displayProduct.artisanName}
        </p>
        <h1 className="product-title">{displayProduct.name}</h1>
        <p className="product-price">{price}</p>
        <p className="product-description">{displayProduct.description}</p>

        <div className="product-meta">
          <div className="meta-item"><strong>{content.categoryLabel}</strong> <span>{displayProduct.category}</span></div>
          <div className="meta-item"><strong>{content.regionLabel}</strong> <span>{displayProduct.region}</span></div>
          <div className="meta-item"><strong>{content.materialsLabel}</strong> <span>{Array.isArray(displayProduct.materials) ? displayProduct.materials.join(', ') : displayProduct.materials}</span></div>
          <div className="meta-item"><strong>{content.stockLabel}</strong> <span>{displayProduct.stock > 0 ? `${displayProduct.stock} ${content.availableSuffix}` : content.outOfStock}</span></div>
        </div>
        
        <div className="add-to-cart-container">
          <button 
            className={`add-to-cart-button ${isAdding ? 'adding' : ''} ${isAlreadyInCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={isAlreadyInCart || displayProduct.stock === 0 || isAdding}
          >
            {displayProduct.stock === 0
                ? content.outOfStock
                : isAlreadyInCart && !isAdding
                ? content.inCartButton
                : isAdding
                ? content.addingButton
                : content.addToCartButton}
          </button>
          <button
            className="view-in-ar-button"
            onClick={handleToggleAR}
          >
            {showAR ? "Exit AR/VR" : "View in AR/VR"}
          </button>
           {showLoginError && (
            <div className="login-prompt-message">
              {content.loginPrompt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;