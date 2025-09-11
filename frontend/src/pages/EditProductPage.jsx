import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './AddProductPage.css';
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  pageTitle: "Edit Product",
  subtitle: "Update the details for your creation.",
  nameLabel: "Product Name",
  descriptionLabel: "Description",
  priceLabel: "Price (in ₹)",
  stockLabel: "Available Stock",
  categoryLabel: "Category",
  regionLabel: "Region / State",
  materialsLabel: "Materials (comma separated)",
  imageLabel: "Product Image",
  saveButton: "Save Changes",
  savingButton: "Saving...",
  successMessage: "Product updated successfully!",
  errorMessage: "Failed to update product. Please try again.",
  authError: "You don't have permission to edit this product.",
  loadingProduct: "Loading product details...",
  productNotFound: "Product not found.",
  categoryPlaceholder: "e.g., Pottery, Weaving...",
  regionPlaceholder: "e.g., Rajasthan, West Bengal...",
  materialsPlaceholder: "e.g., silk, zari, cotton",
};

const EditProductPage = ({ productId, onNavigate }) => {
  const { currentUser } = useAuth();
  const { currentLanguage } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [content, setContent] = useState(englishContent);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setPageLoading(true);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            ...data,
            materials: Array.isArray(data.materials) ? data.materials.join(', ') : '',
            price: data.price / 100
          });
          setImagePreview(data.imageUrl);
        } else {
          setMessage(content.productNotFound);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setMessage("Error loading product data.");
      } finally {
        setPageLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId, content.productNotFound]);

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage.code === 'en') {
        setContent(englishContent);
        return;
      }
      setIsTranslating(true);
      try {
        const textsToTranslate = Object.values(englishContent);
        const result = await getTranslations({ texts: textsToTranslate, targetLanguageCode: currentLanguage.code });
        const translations = result.data.translations;
        setContent({
          pageTitle: translations[0], subtitle: translations[1], nameLabel: translations[2],
          descriptionLabel: translations[3], priceLabel: translations[4], stockLabel: translations[5],
          categoryLabel: translations[6], regionLabel: translations[7], materialsLabel: translations[8],
          imageLabel: translations[9], saveButton: translations[10], savingButton: translations[11],
          successMessage: translations[12], errorMessage: translations[13], authError: translations[14],
          loadingProduct: translations[15], productNotFound: translations[16],
          categoryPlaceholder: translations[17], regionPlaceholder: translations[18], materialsPlaceholder: translations[19],
        });
      } catch (err) {
        console.error("Failed to translate EditProductPage content:", err);
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
    if (!currentUser || currentUser.uid !== product.artisanId) {
      setMessage(content.authError);
      return;
    }
    setLoading(true);
    setMessage('');
    
    try {
      let imageUrl = product.imageUrl;
      
      if (imageFile) {
        const imageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      const productDocRef = doc(db, 'products', productId);
      
      await updateDoc(productDocRef, {
        name: product.name,
        description: product.description,
        price: Number(product.price) * 100,
        stock: Number(product.stock),
        category: product.category,
        region: product.region,
        materials: product.materials.split(',').map(item => item.trim()).filter(Boolean),
        imageUrl: imageUrl,
      });

      setMessage(content.successMessage);
      setTimeout(() => onNavigate('dashboard'), 1500);

    } catch (error) {
      console.error("Error updating product:", error);
      setMessage(content.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="page-loader">{content.loadingProduct}</div>;
  }

  if (!product) {
    return <div className="page-error">{message || 'Product could not be loaded.'}</div>;
  }

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
                <textarea id="description" name="description" value={product.description} onChange={handleChange} rows="5" required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="price">{content.priceLabel}</label>
                    <input id="price" type="number" name="price" value={product.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">{content.stockLabel}</label>
                    <input id="stock" type="number" name="stock" value={product.stock} onChange={handleChange} required />
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
                <input id="materials" type="text" name="materials" value={product.materials} placeholder={content.materialsPlaceholder} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label htmlFor="image">{content.imageLabel}</label>
                {imagePreview && <img src={imagePreview} alt="Product preview" className="image-preview" />}
                <input id="image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" />
            </div>
            {message && <p className={`status-message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? content.savingButton : content.saveButton}
            </button>
        </form>
    </div>
  );
};

export default EditProductPage;