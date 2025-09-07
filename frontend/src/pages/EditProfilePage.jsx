// import React, { useState, useEffect } from 'react';
// import { db, storage } from '../firebaseConfig';
// import { doc, updateDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { useAuth } from '../context/AuthContext';
// import { useLanguage } from '../context/LanguageContext'; 
// import { functions } from '../firebaseConfig';
// import { httpsCallable } from 'firebase/functions';
// import './EditProfilePage.css';

// const getTranslations = httpsCallable(functions, 'getTranslations');

// const englishContent = {
//   title: "Edit Your Profile",
//   profilePhotoLabel: "Profile Photo",
//   nameLabel: "Full Name / Brand Name",
//   phoneLabel: "Phone Number",
//   locationLabel: "City / State",
//   ageLabel: "Age",
//   craftLabel: "Primary Craft",
//   storyLabel: "Your Story / About Your Craft",
//   backButton: "Back",
//   saveButton: "Save Changes",
//   savingButton: "Saving...",
//   successMessage: "Profile updated successfully!",
//   errorMessage: "Failed to update profile. Please try again.",
// };

// const EditProfilePage = ({ userProfile, onProfileUpdate, onNavigate }) => {
//   const { currentUser } = useAuth();
//   const { currentLanguage } = useLanguage();
  
//   const [formData, setFormData] = useState({});
//   const [content, setContent] = useState(englishContent);
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [isTranslating, setIsTranslating] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   useEffect(() => {
//     if (userProfile) {
//       setFormData({
//         displayName: userProfile.displayName || '',
//         phoneNumber: userProfile.phoneNumber || '',
//         location: userProfile.location || '',
//         age: userProfile.age || '',
//         specialization: userProfile.specialization || '',
//         story: userProfile.story || '',
//       });
//       setImagePreview(userProfile.photoURL || null);
//     }
//   }, [userProfile]);

//   useEffect(() => {
//     const translateContent = async () => {
//       if (currentLanguage.code === 'en') {
//         setContent(englishContent);
//         return;
//       }
//       setIsTranslating(true);
//       try {
//         const textsToTranslate = Object.values(englishContent);
//         const result = await getTranslations({
//           texts: textsToTranslate,
//           targetLanguageCode: currentLanguage.code,
//         });
//         const translations = result.data.translations;
//         setContent({
//           title: translations[0],
//           profilePhotoLabel: translations[1],
//           nameLabel: translations[2],
//           phoneLabel: translations[3],
//           locationLabel: translations[4],
//           ageLabel: translations[5],
//           craftLabel: translations[6],
//           storyLabel: translations[7],
//           backButton: translations[8],
//           saveButton: translations[9],
//           savingButton: translations[10],
//           successMessage: translations[11],
//           errorMessage: translations[12],
//         });
//       } catch (err) {
//         console.error("Failed to translate EditProfilePage content:", err);
//         setContent(englishContent);
//       } finally {
//         setIsTranslating(false);
//       }
//     };
//     translateContent();
//   }, [currentLanguage]);

//   const handleChange = (e) => { const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//    };
//   const handleImageChange = (e) => { const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       let photoURL = imagePreview; 
//       if (imageFile) {
//         const imageRef = ref(storage, `avatars/${currentUser.uid}/${imageFile.name}`);
//         await uploadBytes(imageRef, imageFile);
//         photoURL = await getDownloadURL(imageRef);
//       }

//       const updateData = { ...formData, photoURL };
//       const userDocRef = doc(db, 'users', currentUser.uid);
//       await updateDoc(userDocRef, updateData);
//       await onProfileUpdate();

//       setSuccess(content.successMessage); 
      
//     } catch (err) {
//       setError(content.errorMessage); 
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const isArtisan = userProfile?.role === 'artisan';

//   return (
//     <div className="edit-profile-page">
//       <div className={`edit-profile-container ${isTranslating ? 'translating' : ''}`}>
//         <h1 className="edit-profile-title">{content.title}</h1>
//         <form onSubmit={handleSubmit} className="edit-profile-form">
//           <div className="form-group profile-photo-group">
//             <label htmlFor="photo">{content.profilePhotoLabel}</label>
//             {imagePreview && <img src={imagePreview} alt="Profile preview" className="image-preview" />}
//             <input id="photo" name="photo" type="file" onChange={handleImageChange} accept="image/*" />
//           </div>
//           <div className="form-group">
//             <label htmlFor="displayName">{content.nameLabel}</label>
//             <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} />
//           </div>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="phoneNumber">{content.phoneLabel}</label>
//               <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} />
//             </div>
//             <div className="form-group">
//               <label htmlFor="location">{content.locationLabel}</label>
//               <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} />
//             </div>
//           </div>
//           {isArtisan && (
//             <>
//               <div className="form-row">
//                 <div className="form-group">
//                   <label htmlFor="age">{content.ageLabel}</label>
//                   <input id="age" name="age" type="number" value={formData.age} onChange={handleChange} />
//                 </div>
//                 <div className="form-group">
//                   <label htmlFor="specialization">{content.craftLabel}</label>
//                   <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label htmlFor="story">{content.storyLabel}</label>
//                 <textarea id="story" name="story" rows="5" value={formData.story} onChange={handleChange}></textarea>
//               </div>
//             </>
//           )}
          
//           {error && <p className="error-message">{error}</p>}
//           {success && <p className="success-message">{success}</p>}
          
//           <div className="form-actions">
//             <button type="button" className="cancel-button" onClick={() => onNavigate(isArtisan ? 'dashboard' : 'home')}>
//               {content.backButton}
//             </button>
//             <button type="submit" className="submit-button" disabled={loading}>
//               {loading ? content.savingButton : content.saveButton}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditProfilePage;

import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; 
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './EditProfilePage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

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
};

const EditProfilePage = ({ onProfileUpdate, onNavigate }) => {
  const { userProfile } = useAuth();
  const { currentLanguage } = useLanguage();
  
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    location: '',
    age: '',
    specialization: '',
    story: '',
  });
  const [content, setContent] = useState(englishContent);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
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
          title: translations[0],
          profilePhotoLabel: translations[1],
          nameLabel: translations[2],
          phoneLabel: translations[3],
          locationLabel: translations[4],
          ageLabel: translations[5],
          craftLabel: translations[6],
          storyLabel: translations[7],
          backButton: translations[8],
          saveButton: translations[9],
          savingButton: translations[10],
          successMessage: translations[11],
          errorMessage: translations[12],
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
      let photoURL = userProfile.photoURL || ''; // Start with the existing URL
      if (imageFile) {
        // If a new file was chosen, upload it and get the new URL
        const imageRef = ref(storage, `avatars/${userProfile.uid}/${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      const updateData = { ...formData, photoURL };
      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, updateData);
      
      // onProfileUpdate is passed from App.jsx to signal that the context needs to re-fetch
      if(typeof onProfileUpdate === 'function') {
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
  
  const isArtisan = userProfile?.role === 'artisan';

  if (!userProfile) {
    return <div className="page-loader">Loading Profile...</div>;
  }

  return (
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
      </div>
    </div>
  );
};

export default EditProfilePage;