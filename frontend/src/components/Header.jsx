
import React, { useState, useEffect } from 'react';
import './Header.css'; 
import logo from '../assets/images/logo.png'; 
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 

const Header = ({ onSignInClick, onNavigate, onNavigateAndScroll }) => { 
  const { currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const [userRole, setUserRole] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // State for dropdown

  useEffect(() => {
    if (currentUser) {
      const getUserRole = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      };
      getUserRole();
    } else {
      setUserRole(null);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.profile-dropdown-container') === null) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev);
  };

  return (
    <header className="header">
      <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="logo-link">
        <img src={logo} alt="The Artisan's Loom Logo" className="logo-image" />
      </a>

      <nav className="navigation">
        <button onClick={() => onNavigateAndScroll('discover')} className="nav-link">Discover</button>
        <button onClick={() => onNavigateAndScroll('regions')} className="nav-link">Regions</button>
        <button onClick={() => onNavigateAndScroll('artisans')} className="nav-link">Artisans</button>
        <button onClick={() => onNavigateAndScroll('stories')} className="nav-link">Stories</button>
      </nav>
      
      <div className="header-actions">
        <button onClick={() => onNavigate('gifting-assistant')} className="nav-link">
          🎁 Gifting Assistant
        </button>

        <button onClick={() => onNavigate('cart')} className="cart-icon-link nav-link">
          <span className="cart-icon">🛒</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        {currentUser && (
          userRole === 'artisan' ? (
            <button onClick={() => onNavigate('dashboard')} className="nav-link nav-link--primary">
              My Dashboard
            </button>
          ) : (
            <button onClick={() => onNavigate('shop')} className="nav-link nav-link--primary">
              Shop
            </button>
          )
        )}

        {currentUser ? (
          <div className="profile-dropdown-container">
            <button className="profile-icon-button" onClick={toggleProfileDropdown}>
              👤 
            </button>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                <span className="profile-email">{currentUser.email}</span>
                <button onClick={logout} className="nav-link dropdown-signout">Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button onClick={() => onNavigate('shop')} className="nav-link nav-link--primary">Shop</button>
            <button onClick={onSignInClick} className="nav-link nav-link--primary">Sign In</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;