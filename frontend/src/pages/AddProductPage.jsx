import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage, functions } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from 'firebase/functions';
import './AddProductPage.css';

const createProduct = httpsCallable(functions, 'createProduct');
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
};

const AddProductPage = () => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [product, setProduct] = useState({
    name: '', description: '', price: '', category: 'pottery',
    stock: '', region: 'rajasthan', materials: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
          successMessage: translations[24],
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
    <div className={`add-product-page ${isTranslating ? 'translating' : ''}`}>
        <h2>{content.pageTitle}</h2>
        <p style={{textAlign: 'center', marginTop: '-1.5rem', marginBottom: '2rem'}}>{content.subtitle}</p>
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
                    <select id="category" name="category" value={product.category} onChange={handleChange}>
                        <option value="pottery">{content.categoryPottery}</option>
                        <option value="weaving">{content.categoryWeaving}</option>
                        <option value="painting">{content.categoryPainting}</option>
                        <option value="carving">{content.categoryCarving}</option>
                        <option value="embroidery">{content.categoryEmbroidery}</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="region">{content.regionLabel}</label>
                    <select id="region" name="region" value={product.region} onChange={handleChange}>
                        <option value="rajasthan">Rajasthan</option>
                        <option value="gujarat">Gujarat</option>
                        <option value="odisha">Odisha</option>
                        <option value="uttar_pradesh">Uttar Pradesh</option>
                        <option value="west_bengal">West Bengal</option>
                    </select>
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
            {message && <p className={`status-message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? content.submittingButton : content.submitButton}
            </button>
        </form>
    </div>
  );
};

export default AddProductPage;