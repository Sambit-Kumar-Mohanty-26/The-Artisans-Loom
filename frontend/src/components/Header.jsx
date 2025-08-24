import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 

const Header = ({ onSignInClick, onNavigate }) => { 
  const { currentUser, logout } = useAuth();
  const [userRole, setUserRole] = useState(null);

  // This effect fetches the user's role when they log in (this code is perfect)
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
      setUserRole(null); // Reset on logout
    }
  }, [currentUser]);

  return (
    <header className="header">
      {/* Clicking the logo always navigates to 'home' */}
      <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="logo-link">
        <img src={logo} alt="The Artisan's Loom Logo" className="logo-image" />
      </a>

      <nav className="navigation">
        {/* Using <button> and className="nav-link" for consistency */}
        <button onClick={() => onNavigate('discover')} className="nav-link">Discover</button>
        <button onClick={() => onNavigate('regions')} className="nav-link">Regions</button>
        <button onClick={() => onNavigate('artisans')} className="nav-link">Artisans</button>
        <button onClick={() => onNavigate('stories')} className="nav-link">Stories</button>
      </nav>
      
      <div className="header-actions">
        {currentUser ? (
          <div className="user-info">
            <span className="user-email">{currentUser.email}</span>
            
            {/* --- DYNAMIC PRIMARY BUTTON LOGIC --- */}
            {userRole === 'artisan' ? (
              // Artisan sees the "My Dashboard" primary button
              <button onClick={() => onNavigate('addProduct')} className="nav-link nav-link--primary">
                My Dashboard
              </button>
            ) : (
              // Customer sees the "Shop" primary button
              <button onClick={() => onNavigate('shop')} className="nav-link nav-link--primary">
                Shop
              </button>
            )}
            
            {/* Sign Out is a regular link style */}
            <button onClick={logout} className="nav-link">Sign Out</button>
          </div>
        ) : (
          // Logged-out user sees a regular "Shop" link and a primary "Sign In" button
          <>
            <button onClick={() => onNavigate('shop')} className="nav-link">Shop</button>
            <button onClick={onSignInClick} className="nav-link nav-link--primary">Sign In</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;