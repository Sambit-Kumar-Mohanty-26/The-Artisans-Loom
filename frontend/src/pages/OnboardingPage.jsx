import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './OnboardingPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  title: "Welcome to The Artisan's Loom!",
  subtitle: "Let's set up your profile. Just a few more details.",
  profilePhotoLabel: "Profile Photo",
  nameLabel: "Full Name / Brand Name *",
  phoneLabel: "Phone Number *",
  locationLabel: "City / State *",
  ageLabel: "Age",
  craftLabel: "Primary Craft",
  storyLabel: "Your Story / About Your Craft",
  namePlaceholderArtisan: "e.g., Meera Sharma Pottery",
  phonePlaceholder: "e.g., 9876543210",
  locationPlaceholderArtisan: "e.g., Jaipur, Rajasthan",
  agePlaceholder: "e.g., 42",
  craftPlaceholder: "e.g., Blue Pottery",
  storyPlaceholder: "Tell us about your journey, your inspiration, or the history of your craft...",
  namePlaceholderCustomer: "e.g., Priya Kumar",
  locationPlaceholderCustomer: "e.g., Mumbai, Maharashtra",
  requiredError: "Please fill out all required (*) fields.",
  saveError: "Failed to save profile. Please try again.",
  submitButton: "Complete Profile",
  savingButton: "Saving...",
  loadingProfile: "Loading profile..."
};

const OnboardingPage = ({ onNavigate }) => {
  const { userProfile, currentUser, refetchUserProfile } = useAuth();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [formData, setFormData] = useState({
    displayName: '', phoneNumber: '', location: '',
    age: '', specialization: '', story: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        location: userProfile.location || '',
        age: userProfile.age || '',
        specialization: userProfile.specialization || '',
        story: userProfile.story || '',
      });
      setImagePreview(userProfile.photoURL || null);
    }
  }, [userProfile]);

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
          title: translations[0], subtitle: translations[1], profilePhotoLabel: translations[2],
          nameLabel: translations[3], phoneLabel: translations[4], locationLabel: translations[5],
          ageLabel: translations[6], craftLabel: translations[7], storyLabel: translations[8],
          namePlaceholderArtisan: translations[9], phonePlaceholder: translations[10],
          locationPlaceholderArtisan: translations[11], agePlaceholder: translations[12],
          craftPlaceholder: translations[13], storyPlaceholder: translations[14],
          namePlaceholderCustomer: translations[15], locationPlaceholderCustomer: translations[16],
          requiredError: translations[17], saveError: translations[18],
          submitButton: translations[19], savingButton: translations[20], loadingProfile: translations[21],
        });
      } catch (err) {
        console.error("Failed to translate OnboardingPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.displayName || !formData.phoneNumber || !formData.location) {
        setError(content.requiredError);
        return;
    }
    setLoading(true);
    setError('');
    try {
      let photoURL = userProfile?.photoURL || '';
      if (imageFile) {
        const imageRef = ref(storage, `avatars/${currentUser.uid}/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }
      const updateData = {
        ...formData,
        photoURL,
        onboardingComplete: true,
      };
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updateData);
      
      await refetchUserProfile();
      
      const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
      onNavigate(destination);

    } catch (err) {
      setError(content.saveError);
      console.error("Onboarding submission error:", err);
      setLoading(false);
    }
  };

  const isArtisan = userProfile?.role === 'artisan';

  if (!userProfile) {
    return <div className="page-loader">{content.loadingProfile}</div>;
  }

  return (
    <div className="onboarding-page">
      <div className={`onboarding-container ${isTranslating ? 'translating' : ''}`}>
        <h1 className="onboarding-title">{content.title}</h1>
        <p className="onboarding-subtitle">{content.subtitle}</p>
        <form onSubmit={handleSubmit} className="onboarding-form">
          {isArtisan ? (
            <>
              <div className="form-group profile-photo-group">
                <label htmlFor="photo">{content.profilePhotoLabel}</label>
                {imagePreview && <img src={imagePreview} alt="Profile preview" className="image-preview" />}
                <input id="photo" name="photo" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" />
              </div>
              <div className="form-group">
                <label htmlFor="displayName">{content.nameLabel}</label>
                <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} required placeholder={content.namePlaceholderArtisan} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">{content.phoneLabel}</label>
                  <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder={content.phonePlaceholder} />
                </div>
                <div className="form-group">
                  <label htmlFor="location">{content.locationLabel}</label>
                  <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required placeholder={content.locationPlaceholderArtisan} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">{content.ageLabel}</label>
                  <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder={content.agePlaceholder} />
                </div>
                <div className="form-group">
                  <label htmlFor="specialization">{content.craftLabel}</label>
                  <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} placeholder={content.craftPlaceholder} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="story">{content.storyLabel}</label>
                <textarea id="story" name="story" rows="5" value={formData.story} onChange={handleChange} placeholder={content.storyPlaceholder}></textarea>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="displayName">{content.nameLabel}</label>
                <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} required placeholder={content.namePlaceholderCustomer} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">{content.phoneLabel}</label>
                  <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder={content.phonePlaceholder} />
                </div>
                <div className="form-group">
                  <label htmlFor="location">{content.locationLabel}</label>
                  <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required placeholder={content.locationPlaceholderCustomer} />
                </div>
              </div>
            </>
          )}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? content.savingButton : content.submitButton}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;