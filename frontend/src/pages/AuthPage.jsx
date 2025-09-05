import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  brandName1: "THE",
  brandName2: "ARTISAN'S",
  brandName3: "LOOM",
  customersButton: "Customers",
  artisansButton: "Artisans",
  formTitleArtisans: "Artisans",
  formTitleCustomers: "Customers",
  signInTab: "Sign In",
  signUpTab: "Sign Up",
  emailPlaceholder: "Email",
  passwordPlaceholder: "Password",
  signInButton: "Sign In",
  signUpButton: "Sign Up",
  loadingButton: "...",
  googleButton: "Sign in with Google",
  createAccountLink: "Create an account",
  alreadyHaveAccountLink: "Already have an account? Sign In",
};

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083h-18.3v7.834h10.5c-1.5,4.5-5.5,7.5-10.5,7.5c-6.083,0-11-4.917-11-11s4.917-11,11-11c2.667,0,5.083,1,7,2.5l5.833-5.833c-3.333-3-7.667-5-12.833-5c-10.5,0-19,8.5-19,19s8.5,19,19,19c10.5,0,18.833-8.5,18.833-19C43.611,22.25,43.611,21.167,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.611,14.083l6.5,4.833c1.833-4.5,5.833-8,10.833-9.5l-5.833-5.833C13.444,6.583,8.444,9.583,6.611,14.083z" />
    <path fill="#4CAF50" d="M24.611,43.083c5.167,0,9.833-2,13.167-5.167l-6.5-5.5c-1.833,1.5-4.167,2.5-6.667,2.5c-4.833,0-8.833-3.333-10.333-7.833l-6.5,5.167C10.444,38.083,17.444,43.083,24.611,43.083z" />
    <path fill="#1976D2" d="M43.611,20.083h-18.3v7.834h10.5c-1.5,4.5-5.5,7.5-10.5,7.5c-6.083,0-11-4.917-11-11s4.917-11,11-11c2.667,0,5.083,1,7,2.5l5.833-5.833c-3.333-3-7.667-5-12.833-5c-10.5,0-19,8.5-19,19s8.5,19,19,19c10.5,0,18.833-8.5,18.833-19C43.611,22.25,43.611,21.167,43.611,20.083z" />
  </svg>
);

const AuthPage = () => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [userType, setUserType] = useState('artisan'); 
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login, loginWithGoogle } = useAuth();

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
          brandName1: translations[0], brandName2: translations[1], brandName3: translations[2],
          customersButton: translations[3], artisansButton: translations[4], formTitleArtisans: translations[5],
          formTitleCustomers: translations[6], signInTab: translations[7], signUpTab: translations[8],
          emailPlaceholder: translations[9], passwordPlaceholder: translations[10], signInButton: translations[11],
          signUpButton: translations[12], loadingButton: translations[13], googleButton: translations[14],
          createAccountLink: translations[15], alreadyHaveAccountLink: translations[16],
        });
      } catch (err) {
        console.error("Failed to translate AuthPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await signup(email, password, userType);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(userType);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false); 
    }
  };

  const handleUserTypeToggle = (type) => {
    setUserType(type);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className={`auth-page-split ${isTranslating ? 'translating' : ''}`}>
      <div className="auth-left-panel">
        <div className="logo-container">
          <p>{content.brandName1}</p>
          <p>{content.brandName2}</p>
          <p>{content.brandName3}</p>
        </div>
        <div className="user-type-toggle">
          <button className={userType === 'customer' ? 'active' : ''} onClick={() => handleUserTypeToggle('customer')}>
            {content.customersButton}
          </button>
          <button className={userType === 'artisan' ? 'active' : ''} onClick={() => handleUserTypeToggle('artisan')}>
            {content.artisansButton}
          </button>
        </div>
      </div>
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          <h2 className="form-title">{userType === 'artisan' ? content.formTitleArtisans : content.formTitleCustomers}</h2>
          <div className="tab-container">
            <button className={`tab ${isLoginMode ? 'active' : ''}`} onClick={() => setIsLoginMode(true)}>
              {content.signInTab}
            </button>
            <button className={`tab ${!isLoginMode ? 'active' : ''}`} onClick={() => setIsLoginMode(false)}>
              {content.signUpTab}
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <input 
              className="auth-input" 
              type="email" 
              placeholder={content.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              className="auth-input" 
              type="password" 
              placeholder={content.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button primary" disabled={loading}>
              {loading ? content.loadingButton : (isLoginMode ? content.signInButton : content.signUpButton)}
            </button>
          </form>
          <button className="auth-button google" onClick={handleGoogleSignIn} disabled={loading}>
            <GoogleIcon />
            {content.googleButton}
          </button>
          <p className="auth-link" onClick={() => setIsLoginMode(prev => !prev)}>
            {isLoginMode ? content.createAccountLink : content.alreadyHaveAccountLink}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;