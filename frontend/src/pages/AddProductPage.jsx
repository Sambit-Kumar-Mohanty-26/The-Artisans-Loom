import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage, functions } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from 'firebase/functions';
import VoiceListingModal from '../components/VoiceListingModal';
import './AddProductPage.css';

const createProduct = httpsCallable(functions, 'createProduct');
const processVoiceListing = httpsCallable(functions, 'processVoiceListing');
const getListingSuggestions = httpsCallable(functions, 'getListingSuggestions');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  pageTitle: "Add a New Product",
  subtitle: "This form is for artisans to list their creations on the platform.",
  nameLabel: "Product Name",
  descriptionLabel: "Description",
  priceLabel: "Price (in ₹)",
  pricePlaceholder: "e.g., 2850",
  stockLabel: "Available Stock",
  stockPlaceholder: "e.g., 10",
  categoryLabel: "Category",
  categoryPottery: "Pottery",
  categoryWeaving: "Weaving",
  categoryPainting: "Painting",
  categoryCarving: "Carving",
  categoryEmbroidery: "Embroidery",
  regionLabel: "Region / State",
  materialsLabel: "Materials (comma separated)",
  materialsPlaceholder: "e.g., silk, zari, cotton",
  imageLabel: "Product Image",
  submitButton: "Add Product",
  submittingButton: "Submitting...",
  uploadImageError: "Please upload a product image.",
  authError: "Error: User not found. Please try logging in again.",
  authInvalidError: "Authentication Error: Your session is invalid. Please log out and log back in.",
  genericError: "An error occurred:",
  successMessage: "Product created successfully! Add another?",
  voiceCtaText: "Don't want to type? Try our new AI-powered voice listing!",
  voiceButtonText: "🎙️ List with Voice",
  voiceSuccessMessage: "Your form has been filled with your voice description. Please upload an image and submit.",
  copilotTitle: "✨ Mitra's Suggestions",
  useThisTitle: "Use this title",
  useThisDescription: "Use this description",
  pricingAdvice: "Pricing Advice",
  loadingSuggestions: "Mitra is generating suggestions for you...",
};

const AiCopilot = ({ suggestions, onSelectTitle, onSelectDescription, content }) => {
  if (!suggestions) {
    return null;
  }
  return (
    <div className="ai-copilot-container">
      <h3>{content.copilotTitle}</h3>
      
      <div className="copilot-section">
        <h4>Suggested Titles</h4>
        <div className="titles-grid">
          {suggestions.suggestedTitles?.map((title, index) => (
            <button key={index} type="button" className="suggestion-btn" onClick={() => onSelectTitle(title)}>
              {title}
            </button>
          ))}
        </div>
      </div>

      <div className="copilot-section">
        <h4>Improved Description</h4>
        <p className="suggestion-text">{suggestions.improvedDescription}</p>
        <button type="button" className="use-btn" onClick={() => onSelectDescription(suggestions.improvedDescription)}>
          {content.useThisDescription}
        </button>
      </div>

      <div className="copilot-section">
        <h4>{content.pricingAdvice}</h4>
        <p className="suggestion-text">{suggestions.pricingAnalysis}</p>
      </div>
    </div>
  );
};

const AddProductPage = () => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [product, setProduct] = useState({
    name: '', description: '', price: '', category: '',
    stock: '', region: '', materials: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
          texts: textsToTranslate, targetLanguageCode: currentLanguage.code,
        });
        const translations = result.data.translations;
        setContent({
          pageTitle: translations[0], subtitle: translations[1], nameLabel: translations[2],
          descriptionLabel: translations[3], priceLabel: translations[4], pricePlaceholder: translations[5],
          stockLabel: translations[6], stockPlaceholder: translations[7], categoryLabel: translations[8],
          categoryPottery: translations[9], categoryWeaving: translations[10], categoryPainting: translations[11],
          categoryCarving: translations[12], categoryEmbroidery: translations[13], regionLabel: translations[14],
          materialsLabel: translations[15], materialsPlaceholder: translations[16], imageLabel: translations[17],
          submitButton: translations[18], submittingButton: translations[19], uploadImageError: translations[20],
          authError: translations[21], authInvalidError: translations[22], genericError: translations[23],
          successMessage: translations[24], voiceCtaText: translations[25], voiceButtonText: translations[26],
          voiceSuccessMessage: translations[27], copilotTitle: translations[28], useThisTitle: translations[29],
          useThisDescription: translations[30], pricingAdvice: translations[31], loadingSuggestions: translations[32],
        });
      } catch (err) {
        console.error("Failed to translate AddProductPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleChange = (e) => {
    setMessage('');
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setMessage('');
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVoiceDataExtracted = async (audioBlob, languageCode) => {
    setMessage('Processing your description...');
    setSuggestions(null);
    setLoadingSuggestions(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
        try {
            const base64data = reader.result.split(',')[1];
            const result = await processVoiceListing({ audioData: base64data, languageCode });
            const { productData } = result.data;
            const filledProduct = {
                name: productData.name || '',
                description: productData.description || '',
                price: productData.price || '',
                category: productData.category || 'pottery',
                stock: productData.stock || '',
                region: productData.region || 'rajasthan',
                materials: Array.isArray(productData.materials) ? productData.materials.join(', ') : '',
            };
            setProduct(filledProduct);
            setIsVoiceModalOpen(false);
            setMessage(content.voiceSuccessMessage);
            const suggestionsResult = await getListingSuggestions({ 
                productDraft: {
                    ...productData,
                    materials: Array.isArray(productData.materials) ? productData.materials : [],
                },
                language: currentLanguage.name 
            });
            setSuggestions(suggestionsResult.data.suggestions);
        } catch (error) {
            console.error("Error processing voice listing or getting suggestions:", error);
            setMessage(`Error: ${error.message}`);
            setIsVoiceModalOpen(false);
        } finally {
            setLoadingSuggestions(false);
        }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setMessage(content.uploadImageError);
      return;
    }
    if (!currentUser) {
      setMessage(content.authError);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const imageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);
      
      const newProductData = {
        ...product,
        materials: product.materials.split(',').map(item => item.trim()).filter(Boolean),
        imageUrl
      };
      
      await createProduct(newProductData);

      setMessage(content.successMessage);
      setProduct({ name: '', description: '', price: '', category: 'pottery', stock: '', region: 'rajasthan', materials: '' });
      setImageFile(null);
      setImagePreview(null);
      setSuggestions(null);
      e.target.reset();
    } catch (error) {
      console.error("Detailed error from createProduct call:", error);
      if (error.code === 'functions/unauthenticated') {
        setMessage(content.authInvalidError);
      } else {
        setMessage(`${content.genericError} ${error.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <VoiceListingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onDataExtracted={handleVoiceDataExtracted}
      />
      <div className={`add-product-page ${isTranslating ? 'translating' : ''}`}>
          <h2>{content.pageTitle}</h2>
          <p style={{textAlign: 'center', marginTop: '-1.5rem', marginBottom: '2rem'}}>{content.subtitle}</p>
          
          <div className="voice-listing-cta">
            <p>{content.voiceCtaText}</p>
            <button type="button" className="voice-btn" onClick={() => setIsVoiceModalOpen(true)}>
              {content.voiceButtonText}
            </button>
          </div>
          
          {loadingSuggestions ? (
            <p className="loading-suggestions">{content.loadingSuggestions}</p>
          ) : (
            <AiCopilot 
              suggestions={suggestions}
              onSelectTitle={(title) => setProduct(p => ({ ...p, name: title }))}
              onSelectDescription={(desc) => setProduct(p => ({ ...p, description: desc }))}
              content={content}
            />
          )}

          <form className="add-product-form" onSubmit={handleSubmit}>
              <div className="form-group">
                  <label htmlFor="name">{content.nameLabel}</label>
                  <input id="name" type="text" name="name" value={product.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                  <label htmlFor="description">{content.descriptionLabel}</label>
                  <textarea id="description" name="description" value={product.description} onChange={handleChange} required />
              </div>
              <div className="form-row">
                  <div className="form-group">
                      <label htmlFor="price">{content.priceLabel}</label>
                      <input id="price" type="number" name="price" placeholder={content.pricePlaceholder} value={product.price} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                      <label htmlFor="stock">{content.stockLabel}</label>
                      <input id="stock" type="number" name="stock" placeholder={content.stockPlaceholder} value={product.stock} onChange={handleChange} required />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group">
                      <label htmlFor="category">{content.categoryLabel}</label>
                      <input 
                        id="category" 
                        type="text" 
                        name="category" 
                        value={product.category} 
                        onChange={handleChange} 
                        placeholder={content.categoryPlaceholder}
                        list="category-suggestions"
                        required 
                      />
                      <datalist id="category-suggestions">
                          <option value="Pottery" />
                          <option value="Weaving" />
                          <option value="Painting" />
                          <option value="Carving" />
                          <option value="Embroidery" />
                          <option value="Textile" />
                          <option value="Jewelry" />
                          <option value="Metalwork" />
                          <option value="Woodwork" />
                      </datalist>
                  </div>
                  {/* --- THIS IS THE UPGRADED REGION INPUT --- */}
                  <div className="form-group">
                      <label htmlFor="region">{content.regionLabel}</label>
                       <input 
                        id="region" 
                        type="text" 
                        name="region" 
                        value={product.region} 
                        onChange={handleChange} 
                        placeholder={content.regionPlaceholder}
                        list="region-suggestions"
                        required 
                      />
                      <datalist id="region-suggestions">
                          <option value="Rajasthan" />
                          <option value="Gujarat" />
                          <option value="Odisha" />
                          <option value="Uttar Pradesh" />
                          <option value="West Bengal" />
                          <option value="Tamil Nadu" />
                          <option value="Karnataka" />
                          <option value="Bihar" />
                          <option value="Assam" />
                      </datalist>
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="materials">{content.materialsLabel}</label>
                  <input id="materials" type="text" name="materials" placeholder={content.materialsPlaceholder} value={product.materials} onChange={handleChange} />
              </div>
              <div className="form-group">
                  <label htmlFor="image">{content.imageLabel}</label>
                  <input id="image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" required />
                  {imagePreview && <img src={imagePreview} alt="Product preview" className="image-preview" />}
              </div>
              {message && <p className={`status-message ${message.includes('successfully') || message.includes('filled') ? 'success' : 'error'}`}>{message}</p>}
              <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? content.submittingButton : content.submitButton}
              </button>
          </form>
      </div>
    </>
  );
};

export default AddProductPage;