import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import './EditProfilePage.css'; 

const EditProfilePage = ({ userProfile, onProfileUpdate, onNavigate }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let photoURL = imagePreview; 
      if (imageFile) {
        const imageRef = ref(storage, `avatars/${currentUser.uid}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(imageRef);
      }

      const updateData = { ...formData, photoURL };
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updateData);
      await onProfileUpdate();

      setSuccess('Profile updated successfully!');
      
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const isArtisan = userProfile?.role === 'artisan';

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <h1 className="edit-profile-title">Edit Your Profile</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group profile-photo-group">
            <label htmlFor="photo">Profile Photo</label>
            {imagePreview && <img src={imagePreview} alt="Profile preview" className="image-preview" />}
            <input id="photo" name="photo" type="file" onChange={handleImageChange} accept="image/*" />
          </div>
          <div className="form-group">
            <label htmlFor="displayName">Full Name / Brand Name</label>
            <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="location">City / State</label>
              <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} />
            </div>
          </div>
          {isArtisan && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="specialization">Primary Craft</label>
                  <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="story">Your Story / About Your Craft</label>
                <textarea id="story" name="story" rows="5" value={formData.story} onChange={handleChange}></textarea>
              </div>
            </>
          )}
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => onNavigate(isArtisan ? 'dashboard' : 'home')}>
              Back
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;