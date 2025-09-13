import React, { useState, useEffect } from 'react';
import { db, storage, functions } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; 
import { httpsCallable } from 'firebase/functions';
import ConfirmationModal from '../components/ConfirmationModal';
import './EditProfilePage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');
const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');

const englishContent = {
  title: "Edit Your Profile",
  profilePhotoLabel: "Profile Photo",
  nameLabel: "Full Name / Brand Name",
  phoneLabel: "Phone Number",
  locationLabel: "City / State",
  ageLabel: "Age",
  craftLabel: "Primary Craft",
  storyLabel: "Your Story / About Your Craft",
  backButton: "Back",
  saveButton: "Save Changes",
  savingButton: "Saving...",
  successMessage: "Profile updated successfully!",
  errorMessage: "Failed to update profile. Please try again.",
  authError: "Could not find user profile. Please log in again.",
  dangerZoneTitle: "Danger Zone",
  deleteAccountButton: "Delete My Account",
  deleteAccountWarning: "This action is permanent and cannot be undone. All of your data, including products and stories, will be removed.",
  confirmDeleteTitle: "Confirm Account Deletion",
  confirmDeletePrompt: "To confirm, please type DELETE in the box below.",
  deleteConfirmationText: "DELETE",
  cancelLabel: "Cancel",
};

const EditProfilePage = ({ onProfileUpdate, onNavigate }) => {
  const { userProfile, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    displayName: '', phoneNumber: '', location: '', age: '', specialization: '', story: '',
  });
  const [content, setContent] = useState(englishContent);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
          texts: textsToTranslate,
          targetLanguageCode: currentLanguage.code,
        });
        const translations = result.data.translations;
        setContent({
          title: translations[0], profilePhotoLabel: translations[1], nameLabel: translations[2],
          phoneLabel: translations[3], locationLabel: translations[4], ageLabel: translations[5],
          craftLabel: translations[6], storyLabel: translations[7], backButton: translations[8],
          saveButton: translations[9], savingButton: translations[10], successMessage: translations[11],
          errorMessage: translations[12], authError: translations[13], dangerZoneTitle: translations[14],
          deleteAccountButton: translations[15], deleteAccountWarning: translations[16],
          confirmDeleteTitle: translations[17], confirmDeletePrompt: translations[18],
          deleteConfirmationText: translations[19], cancelLabel: translations[20],
        });
      } catch (err) {
        console.error("Failed to translate EditProfilePage content:", err);
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
    if (!userProfile) {
      setError(content.authError);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let photoURL = userProfile.photoURL || '';
      if (imageFile) {
        const imageRef = ref(storage, `avatars/${userProfile.uid}/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      const updateData = { ...formData, photoURL };
      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, updateData);
      
      if (typeof onProfileUpdate === 'function') {
        await onProfileUpdate();
      }

      setSuccess(content.successMessage);
      
    } catch (err) {
      setError(content.errorMessage);
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccountDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteUserAccount();
      await logout();
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError(err.message || "An error occurred while deleting your account.");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };
  
  const isArtisan = userProfile?.role === 'artisan';
  
  if (!userProfile) {
    return <div className="page-loader">Loading Profile...</div>;
  }

  return (
    <>
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleAccountDelete}
        title={content.confirmDeleteTitle}
        confirmText={content.deleteAccountButton}
        cancelText={content.cancelLabel}
        isConfirmDisabled={deleteConfirmText !== content.deleteConfirmationText}
      >
        <p>{content.deleteAccountWarning}</p>
        <p className="confirm-prompt">{content.confirmDeletePrompt}</p>
        <input 
          type="text" 
          className="confirm-input"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
        />
      </ConfirmationModal>

      <div className="edit-profile-page">
        <div className={`edit-profile-container ${isTranslating ? 'translating' : ''}`}>
          <h1 className="edit-profile-title">{content.title}</h1>
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-group profile-photo-group">
              <label htmlFor="photo">{content.profilePhotoLabel}</label>
              {imagePreview && <img src={imagePreview} alt="Profile preview" className="image-preview" />}
              <input id="photo" name="photo" type="file" onChange={handleImageChange} accept="image/*" />
            </div>
            <div className="form-group">
              <label htmlFor="displayName">{content.nameLabel}</label>
              <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">{content.phoneLabel}</label>
                <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="location">{content.locationLabel}</label>
                <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} />
              </div>
            </div>
            {isArtisan && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="age">{content.ageLabel}</label>
                    <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="specialization">{content.craftLabel}</label>
                    <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="story">{content.storyLabel}</label>
                  <textarea id="story" name="story" rows="5" value={formData.story} onChange={handleChange}></textarea>
                </div>
              </>
            )}
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => onNavigate(isArtisan ? 'dashboard' : 'home')}>
                {content.backButton}
              </button>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? content.savingButton : content.saveButton}
              </button>
            </div>
          </form>

          <div className="danger-zone">
            <h3>{content.dangerZoneTitle}</h3>
            <p>{content.deleteAccountWarning}</p>
            <button className="delete-account-btn" onClick={() => setDeleteModalOpen(true)}>
              {content.deleteAccountButton}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfilePage;