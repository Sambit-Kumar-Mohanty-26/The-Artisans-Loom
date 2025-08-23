import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import Header from './components/Header';
import Footer from './components/Footer';
import CraftMitraButton from './components/CraftMitraButton';
import CraftMitraModal from './components/CraftMitraModal';
import AuthPage from './pages/AuthPage';
import AddProductPage from './pages/AddProductPage';
import ShopPage from './pages/ShopPage';

import Hero from './sections/Hero';
import FeaturedArtisans from './sections/FeaturedArtisans';
import ExploreByRegion from './sections/ExploreByRegion';
import CuratedCollection from './sections/CuratedCollection';
import FeaturedProducts from './sections/FeaturedProducts';


function App() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('home'); 
  const [userRole, setUserRole] = useState(null);
  const [isMitraOpen, setIsMitraOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const getUserRole = async () => {
        setLoadingRole(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole('customer'); 
        }
        setLoadingRole(false);
      };
      getUserRole();
      setCurrentPage('home');
    } else {
      setUserRole(null);
      setLoadingRole(false);
    }
  }, [currentUser]);
  const renderPage = () => {
    if (loadingRole && currentUser) {
      return <div>Loading Dashboard...</div>;
    }
    
    switch (currentPage) {
      case 'auth':
        return <AuthPage />;
      case 'shop':
        return <ShopPage />;
      case 'addProduct':
        return userRole === 'artisan' ? <AddProductPage /> : renderHomepage();
      case 'home':
      default:
        return renderHomepage();
    }
  };

  const renderHomepage = () => (
    <>
      <Hero />
      <FeaturedArtisans />
      <ExploreByRegion />
      <CuratedCollection />
      <FeaturedProducts />
    </>
  );

  return (
    <div className="app-wrapper">
      <Header 
        onSignInClick={() => setCurrentPage('auth')} 
        onNavigate={(page) => setCurrentPage(page)}
        onShopClick={() => setCurrentPage('shop')}
      />
      
      <main>
        {renderPage()}
      </main>
      
      {/* Only show Footer and Mitra button on the home page */}
      {currentPage === 'home' && (
        <>
          <Footer />
          <CraftMitraButton onClick={() => setIsMitraOpen(true)} />
        </>
      )}
      
      <CraftMitraModal 
        isOpen={isMitraOpen} 
        onClose={() => setIsMitraOpen(false)} 
      />
    </div>
  );
}

export default App;