import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore'; 

const Header = ({ onSignInClick, onNavigate }) => { 
  const { currentUser, logout } = useAuth();
  const [userRole, setUserRole] = useState(null);

  // This effect fetches the user's role when they log in
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
        <a href="#discover">Discover</a>
        <a href="#regions">Regions</a>
        <a href="#artisans">Artisans</a>
        <a href="#stories">Stories</a>

        {/* --- THIS IS THE DYNAMIC LINK LOGIC --- */}
        {/* If the user is an artisan, show "Add Product" link */}
        {userRole === 'artisan' && (
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('addProduct'); }} className="nav-action-link">
            My Dashboard
          </a>
        )}

        {/* If the user is a customer or not logged in, show "Shop" link */}
        {userRole !== 'artisan' && (
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('shop'); }} className="nav-action-link">
            Shop
          </a>
        )}
        {/* --- END OF DYNAMIC LINK LOGIC --- */}
      </nav>
      
      <div className="header-actions">
        {/* ... search and favorite buttons ... */}
        {currentUser ? (
          <div className="user-info">
            <span className="user-email">{currentUser.email}</span>
            <button onClick={logout} className="sign-out-button">Sign Out</button>
          </div>
        ) : (
          <button onClick={onSignInClick} className="sign-in-button">Sign In</button>
        )}
      </div>
    </header>
  );
};

export default Header;