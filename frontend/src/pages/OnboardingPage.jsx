import React, { useState } from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import './OnboardingPage.css';

const OnboardingPage = ({ userProfile, onComplete }) => {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    location: userProfile?.location || '',
    age: userProfile?.age || '',
    specialization: userProfile?.specialization || '',
    story: userProfile?.story || '',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(userProfile?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('Please fill out all required (*) fields.');
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
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        photoURL,
        onboardingComplete: true,
      };
      if (formData.age) updateData.age = formData.age;
      if (formData.specialization) updateData.specialization = formData.specialization;
      if (formData.story) updateData.story = formData.story;
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updateData);
      onComplete();

    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error("Onboarding submission error:", err);
      setLoading(false);
    }
  };

  const renderArtisanForm = () => (
    <>
      <div className="form-group profile-photo-group">
        <label htmlFor="photo">Profile Photo</label>
        {imagePreview && <img src={imagePreview} alt="Profile preview" className="image-preview" />}
        <input id="photo" name="photo" type="file" onChange={handleImageChange} accept="image/png, image/jpeg" />
      </div>
      <div className="form-group">
        <label htmlFor="displayName">Full Name / Brand Name *</label>
        <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} required placeholder="e.g., Meera Sharma Pottery" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="e.g., 9876543210" />
        </div>
        <div className="form-group">
          <label htmlFor="location">City / State *</label>
          <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required placeholder="e.g., Jaipur, Rajasthan" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="e.g., 42" />
        </div>
        <div className="form-group">
          <label htmlFor="specialization">Primary Craft</label>
          <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} placeholder="e.g., Blue Pottery" />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="story">Your Story / About Your Craft</label>
        <textarea id="story" name="story" rows="5" value={formData.story} onChange={handleChange} placeholder="Tell us about your journey, your inspiration, or the history of your craft..."></textarea>
      </div>
    </>
  );

  const renderCustomerForm = () => (
    <>
      <div className="form-group">
        <label htmlFor="displayName">Full Name *</label>
        <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} required placeholder="e.g., Priya Kumar" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="e.g., 9876543210" />
        </div>
        <div className="form-group">
          <label htmlFor="location">City / State *</label>
          <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required placeholder="e.g., Mumbai, Maharashtra" />
        </div>
      </div>
    </>
  );

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1 className="onboarding-title">Welcome to The Artisan's Loom!</h1>
        <p className="onboarding-subtitle">Let's set up your profile. Just a few more details.</p>
        <form onSubmit={handleSubmit} className="onboarding-form">
          {userProfile?.role === 'artisan' ? renderArtisanForm() : renderCustomerForm()}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;