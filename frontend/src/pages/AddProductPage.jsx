import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage, functions, db } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import VoiceListingModal from '../components/VoiceListingModal';
import './AddProductPage.css';

const createProduct = httpsCallable(functions, 'createProduct');
const processVoiceListing = httpsCallable(functions, 'processVoiceListing');
const getListingSuggestions = httpsCallable(functions, 'getListingSuggestions');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  pageTitle: "Add a New Product",
  subtitle: "Describe your creation, and let our AI help you perfect the listing.",
  nameLabel: "Product Name",
  descriptionLabel: "Description",
  priceLabel: "Price (in ₹)",
  pricePlaceholder: "e.g., 2850",
  stockLabel: "Available Stock",
  stockPlaceholder: "e.g., 10",
  categoryLabel: "Category",
  regionLabel: "Region / State",
  materialsLabel: "Materials (comma separated)",
  materialsPlaceholder: "e.g., silk, zari, cotton",
  imageLabel: "Product Image",
  submitButton: "Add Product",
  submittingButton: "Submitting...",
  uploadImageError: "Please upload a product image.",
  authError: "Error: User not found. Please try logging in again.",
  genericError: "An error occurred:",
  successMessage: "Product created successfully! Add another?",
  voiceCtaText: "Prefer to speak?",
  voiceButtonText: "🎙️ List with Voice",
  voiceSuccessMessage: "Your form has been filled. Now, ask Mitra for suggestions or add an image and submit!",
  copilotTitle: "✨ Mitra's Suggestions",
  useThisDescription: "Use This Description",
  pricingAdvice: "Pricing Advice",
  getSuggestionsButton: "✨ Ask Mitra for Suggestions",
  thinkingButton: "Mitra is thinking...",
  suggestionPrompt: "Please fill in at least the name and description before getting suggestions.",
  categoryPlaceholder: "e.g., Pottery, Weaving...",
  regionPlaceholder: "e.g., Rajasthan, West Bengal...",
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
          regionLabel: translations[9], materialsLabel: translations[10], materialsPlaceholder: translations[11],
          imageLabel: translations[12], submitButton: translations[13], submittingButton: translations[14],
          uploadImageError: translations[15], authError: translations[16], genericError: translations[17],
          successMessage: translations[18], voiceCtaText: translations[19], voiceButtonText: translations[20],
          voiceSuccessMessage: translations[21], copilotTitle: translations[22], useThisDescription: translations[23],
          pricingAdvice: translations[24], getSuggestionsButton: translations[25], thinkingButton: translations[26],
          suggestionPrompt: translations[27], categoryPlaceholder: translations[28], regionPlaceholder: translations[29],
          loadingSuggestions: translations[30],
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

  const handleGetSuggestions = async () => {
    if (!product.name.trim() || !product.description.trim()) {
      setMessage(content.suggestionPrompt);
      return;
    }
    setLoadingSuggestions(true);
    setSuggestions(null);
    setMessage('');
    try {
      const suggestionsResult = await getListingSuggestions({ 
          productDraft: {
              name: product.name,
              description: product.description,
              category: product.category,
              materials: product.materials.split(',').map(m => m.trim()),
              region: product.region,
          },
          languageCode: currentLanguage.code,
      });
      setSuggestions(suggestionsResult.data.suggestions);
    } catch (error) {
        console.error("Error getting suggestions:", error);
        setMessage(error.message);
    } finally {
        setLoadingSuggestions(false);
    }
  };

  const handleVoiceDataExtracted = async (audioBlob, languageCode) => {
    setMessage('Processing your description...');
    setSuggestions(null);
    setLoadingSuggestions(true);
    setIsVoiceModalOpen(false);
    
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
                category: productData.category || '',
                stock: productData.stock || '',
                region: productData.region || '',
                materials: Array.isArray(productData.materials) ? productData.materials.join(', ') : '',
            };
            setProduct(filledProduct);
            setMessage(content.voiceSuccessMessage);
            await handleGetSuggestions();
        } catch (error) {
            console.error("Error processing voice listing:", error);
            setMessage(`Error: ${error.message}`);
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
      let finalProductData = { ...product };
      if (currentLanguage.code !== 'en') {
        const texts = [finalProductData.name, finalProductData.description];
        const result = await getTranslations({ texts, targetLanguageCode: 'en' });
        finalProductData.name = result.data.translations[0];
        finalProductData.description = result.data.translations[1];
      }

      const imageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);
      
      const newProductData = {
        ...finalProductData,
        price: Number(finalProductData.price) * 100,
        stock: Number(finalProductData.stock),
        materials: finalProductData.materials.split(',').map(item => item.trim()).filter(Boolean),
        imageUrl
      };
      
      await createProduct(newProductData);

      setMessage(content.successMessage);
      setProduct({ name: '', description: '', price: '', category: '', stock: '', region: '', materials: '' });
      setImageFile(null);
      setImagePreview(null);
      setSuggestions(null);
      e.target.reset();
    } catch (error) {
      console.error("Detailed error from createProduct call:", error);
      setMessage(`${content.genericError} ${error.message}`);
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
                      <input id="category" type="text" name="category" value={product.category} onChange={handleChange} placeholder={content.categoryPlaceholder} list="category-suggestions" required />
                      <datalist id="category-suggestions">
                          <option value="Pottery" /> <option value="Weaving" /> <option value="Painting" />
                          <option value="Carving" /> <option value="Embroidery" /> <option value="Textile" />
                          <option value="Jewelry" /> <option value="Metalwork" /> <option value="Woodwork" />
                      </datalist>
                  </div>
                  <div className="form-group">
                      <label htmlFor="region">{content.regionLabel}</label>
                       <input id="region" type="text" name="region" value={product.region} onChange={handleChange} placeholder={content.regionPlaceholder} list="region-suggestions" required />
                      <datalist id="region-suggestions">
                          <option value="Rajasthan" /> <option value="Gujarat" /> <option value="Odisha" />
                          <option value="Uttar Pradesh" /> <option value="West Bengal" /> <option value="Tamil Nadu" />
                          <option value="Karnataka" /> <option value="Bihar" /> <option value="Assam" />
                      </datalist>
                  </div>
              </div>
              <div className="form-group">
                  <label htmlFor="materials">{content.materialsLabel}</label>
                  <input id="materials" type="text" name="materials" placeholder={content.materialsPlaceholder} value={product.materials} onChange={handleChange} />
              </div>

              <div className="get-suggestions-cta">
                <button type="button" className="suggestion-generator-btn" onClick={handleGetSuggestions} disabled={loadingSuggestions}>
                  {loadingSuggestions ? content.thinkingButton : content.getSuggestionsButton}
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