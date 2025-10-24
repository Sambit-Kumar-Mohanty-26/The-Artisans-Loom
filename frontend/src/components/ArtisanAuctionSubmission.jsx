import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage, functions } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from 'firebase/functions';
import './ArtisanAuctionSubmission.css';

const submitAuctionPiece = httpsCallable(functions, 'submitAuctionPiece');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  pageTitle: "Submit Your Masterpiece for Auction",
  subtitle: "Showcase your exceptional craft in our exclusive Silent Auction.",
  nameLabel: "Piece Name",
  descriptionLabel: "Description of your Masterpiece",
  materialsLabel: "Materials Used (comma separated)",
  materialsPlaceholder: "e.g., silk, natural dyes, gold thread",
  dimensionsLabel: "Dimensions (e.g., 36x24 inches)",
  yearCreatedLabel: "Year Created",
  imageLabel: "Masterpiece Image",
  submitButton: "Submit for Valuation",
  submittingButton: "Submitting...",
  uploadImageError: "Please upload an image of your masterpiece.",
  authError: "Error: Artisan not found. Please try logging in again.",
  genericError: "An error occurred:",
  successMessage: "Your masterpiece has been submitted for AI valuation! You will be notified once the appraisal is complete and the auction goes live.",
  categoryLabel: "Category",
  categoryPlaceholder: "e.g., Painting, Sculpture, Textile",
  regionLabel: "Region / Origin",
  regionPlaceholder: "e.g., Rajasthan, Bengal, Karnataka",
};

const ArtisanAuctionSubmission = () => {
  const { currentUser, userProfile } = useAuth();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [submission, setSubmission] = useState({
    name: '', description: '', materials: '', dimensions: '', yearCreated: '', category: '', region: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [durationHours, setDurationHours] = useState(168); // Default to 7 days

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
          descriptionLabel: translations[3], materialsLabel: translations[4], materialsPlaceholder: translations[5],
          dimensionsLabel: translations[6], yearCreatedLabel: translations[7], imageLabel: translations[8],
          submitButton: translations[9], submittingButton: translations[10], uploadImageError: translations[11],
          authError: translations[12], genericError: translations[13], successMessage: translations[14],
          categoryLabel: translations[15], categoryPlaceholder: translations[16], regionLabel: translations[17],
          regionPlaceholder: translations[18],
        });
      } catch (err) {
        console.error("Failed to translate ArtisanAuctionSubmission content:", err);
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
    setSubmission(prev => ({ ...prev, [name]: value }));
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
    if (!currentUser || userProfile?.role !== 'artisan') {
      setMessage(content.authError);
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      let finalSubmissionData = { ...submission };
      if (currentLanguage.code !== 'en') {
        // Translate name and description back to English for AI processing if necessary
        const texts = [finalSubmissionData.name, finalSubmissionData.description];
        const result = await getTranslations({ texts, targetLanguageCode: 'en' });
        finalSubmissionData.name = result.data.translations[0];
        finalSubmissionData.description = result.data.translations[1];
      }

      const imageRef = ref(storage, `auction_pieces/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);
      
      const newAuctionPieceData = {
        ...finalSubmissionData,
        artisanId: currentUser.uid,
        artisanName: userProfile.displayName || currentUser.email,
        imageUrl,
        materials: finalSubmissionData.materials.split(',').map(item => item.trim()).filter(Boolean),
        status: 'pending_valuation', // Initial status
        createdAt: new Date().toISOString(),
        durationHours: durationHours,
      };
      
      await submitAuctionPiece(newAuctionPieceData);

      setMessage(content.successMessage);
      setSubmission({ name: '', description: '', materials: '', dimensions: '', yearCreated: '', category: '', region: '' });
      setImageFile(null);
      setImagePreview(null);
      e.target.reset();
    } catch (error) {
      console.error("Detailed error from submitAuctionPiece call:", error);
      setMessage(`${content.genericError} ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className={`artisan-auction-submission ${isTranslating ? 'translating' : ''}`}>
      <div className="submission-header">
        <h2>{content.pageTitle}</h2>
        <p>{content.subtitle}</p>
      </div>
      
      <form className="auction-submission-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">{content.nameLabel}</label>
          <input id="name" type="text" name="name" value={submission.name} onChange={handleChange} required />
        </div>
        <div className="form-group full-width"> {/* Apply full-width here */}
          <label htmlFor="description">{content.descriptionLabel}</label>
          <textarea id="description" name="description" value={submission.description} onChange={handleChange} required />
        </div>
        {/* Removed form-row here to enforce single column layout */}
        <div className="form-group">
          <label htmlFor="category">{content.categoryLabel}</label>
          <input id="category" type="text" name="category" value={submission.category} onChange={handleChange} placeholder={content.categoryPlaceholder} list="category-suggestions" required />
          <datalist id="category-suggestions">
            <option value="Painting" /> <option value="Sculpture" /> <option value="Textile" />
            <option value="Pottery" /> <option value="Metalwork" /> <option value="Woodwork" />
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="region">{content.regionLabel}</label>
          <input id="region" type="text" name="region" value={submission.region} onChange={handleChange} placeholder={content.regionPlaceholder} list="region-suggestions" required />
          <datalist id="region-suggestions">
            <option value="Rajasthan" /> <option value="Gujarat" /> <option value="Odisha" />
            <option value="Uttar Pradesh" /> <option value="West Bengal" /> <option value="Tamil Nadu" />
          </datalist>
        </div>
        <div className="form-group full-width"> {/* Apply full-width here */}
          <label htmlFor="materials">{content.materialsLabel}</label>
          <input id="materials" type="text" name="materials" placeholder={content.materialsPlaceholder} value={submission.materials} onChange={handleChange} />
        </div>
        {/* Removed form-row here to enforce single column layout */}
        <div className="form-group">
          <label htmlFor="dimensions">{content.dimensionsLabel}</label>
          <input id="dimensions" type="text" name="dimensions" value={submission.dimensions} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="yearCreated">{content.yearCreatedLabel}</label>
          <input id="yearCreated" type="number" name="yearCreated" value={submission.yearCreated} onChange={handleChange} />
        </div>
        <div className="form-group full-width"> {/* Make this full-width for better spacing */}
          <label htmlFor="auctionDuration">Auction Duration (Hours)</label>
          <input id="auctionDuration" type="number" name="durationHours" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} min="1" required />
        </div>
        <div className="form-group full-width image-upload-group"> {/* Use a new class for image upload */}
          <label htmlFor="image-file-input">{content.imageLabel}</label> {/* Label for the hidden input */}
          <div className="image-uploader-area" onClick={() => document.getElementById('image-file-input').click()}>
            <i className="fas fa-cloud-upload-alt upload-icon"></i> {/* Cloud upload icon */}
            <p className="upload-text">Drag & drop your masterpiece image here, or click to browse.</p>
            <p className="upload-subtext">{imageFile ? imageFile.name : 'No file chosen'}</p>
            <input id="image-file-input" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" />
          </div>
          {imagePreview && (
            <div className="image-preview-container">
              <p>Image Preview:</p>
              <img src={imagePreview} alt="Masterpiece preview" className="image-preview" />
            </div>
          )}
        </div>
        {message && <p className={`status-message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? content.submittingButton : <><i className="fas fa-gavel"></i> {content.submitButton}</>} {/* Gavel icon */}
        </button>
      </form>
    </div>
  );
};

export default ArtisanAuctionSubmission;
