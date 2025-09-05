import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import './Header.css';
import logo from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  discover: "Discover",
  regions: "Regions",
  artisans: "Artisans",
  stories: "Stories",
  giftingAssistant: "🎁 Gifting Assistant",
  myDashboard: "My Dashboard",
  shop: "Shop",
  editProfile: "Edit Profile",
  signOut: "Sign Out",
  signIn: "Sign In",
};

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
  </svg>
);

const Header = ({ onSignInClick, onNavigate, onNavigateAndScroll }) => {
  const { currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();

  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const navigationRef = useRef(null);
  const mobileMenuIconRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const getUserProfile = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      };
      getUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (navigationRef.current && !navigationRef.current.contains(event.target) &&
          mobileMenuIconRef.current && !mobileMenuIconRef.current.contains(event.target) &&
          isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

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
          discover: translations[0],
          regions: translations[1],
          artisans: translations[2],
          stories: translations[3],
          giftingAssistant: translations[4],
          myDashboard: translations[5],
          shop: translations[6],
          editProfile: translations[7],
          signOut: translations[8],
          signIn: translations[9],
        });
      } catch (err) {
        console.error("Failed to translate Header content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(prev => !prev);
  const toggleLangDropdown = () => setIsLangDropdownOpen(prev => !prev);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleDropdownNavigate = (page) => {
    onNavigate(page);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };
  
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLangDropdownOpen(false);
  };
  
  const handleScrollAndCloseMenu = (section) => {
      onNavigateAndScroll(section);
      setIsMobileMenuOpen(false);
  }

  return (
    <header className={`header ${isTranslating ? 'translating' : ''} ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="logo-link">
        <img src={logo} alt="The Artisan's Loom Logo" className="logo-image" />
      </a>

      <nav className={`navigation ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`} ref={navigationRef}>
        <button onClick={() => handleScrollAndCloseMenu('discover')} className="nav-link">{content.discover}</button>
        <button onClick={() => handleScrollAndCloseMenu('regions')} className="nav-link">{content.regions}</button>
        <button onClick={() => handleScrollAndCloseMenu('artisans')} className="nav-link">{content.artisans}</button>
        <button onClick={() => handleScrollAndCloseMenu('stories')} className="nav-link">{content.stories}</button>
      </nav>

      <button className="mobile-menu-icon" onClick={toggleMobileMenu} ref={mobileMenuIconRef}>
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      <div className="header-actions">
        <div className="language-selector-container" ref={langDropdownRef}>
          <button className="language-button" onClick={toggleLangDropdown}>
            <GlobeIcon />
            <span>{currentLanguage.name}</span>
          </button>
          {isLangDropdownOpen && (
            <div className="language-dropdown-menu">
              {supportedLanguages.map(lang => (
                <button
                  key={lang.code}
                  className={`language-option ${lang.code === currentLanguage.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => onNavigate('gifting-assistant')} className="nav-link gifting-assistant-link">
          {content.giftingAssistant}
        </button>

        <button onClick={() => onNavigate('cart')} className="cart-icon-link nav-link">
          <span className="cart-icon">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        {currentUser && (
          userProfile?.role === 'artisan' ? (
            <button onClick={() => onNavigate('dashboard')} className="nav-link nav-link--primary">
              {content.myDashboard}
            </button>
          ) : (
            <button onClick={() => onNavigate('shop')} className="nav-link nav-link--primary">
              {content.shop}
            </button>
          )
        )}

        {currentUser ? (
          <div className="profile-dropdown-container" ref={profileDropdownRef}>
            <button className="profile-button" onClick={toggleProfileDropdown}>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="profile-image" />
              ) : (
                <span className="profile-icon">👤</span>
              )}
            </button>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                <span className="profile-email">{currentUser.email}</span>
                {userProfile?.role === 'customer' && (
                  <button
                    onClick={() => handleDropdownNavigate('dashboard')}
                    className="nav-link dropdown-action"
                  >
                    {content.myDashboard}
                  </button>
                )}
                <button
                  onClick={() => handleDropdownNavigate('edit-profile')}
                  className="nav-link dropdown-action"
                >
                  {content.editProfile}
                </button>
                <button onClick={logout} className="nav-link dropdown-signout">
                  {content.signOut}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button onClick={() => onNavigate('shop')} className="nav-link nav-link--primary">{content.shop}</button>
            <button onClick={onSignInClick} className="nav-link nav-link--primary">{content.signIn}</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;