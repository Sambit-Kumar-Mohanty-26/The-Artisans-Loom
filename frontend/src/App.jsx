import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { db, functions } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import Header from './components/Header';
import Footer from './components/Footer';
import CraftMitraButton from './components/CraftMitraButton';
import CraftMitraModal from './components/CraftMitraModal';

import AuthPage from './pages/AuthPage';
import AddProductPage from './pages/AddProductPage';
import ShopPage from './pages/ShopPage';
import DashboardPage from './pages/DashboardPage';
import AllStatesPage, { findStateData } from './pages/AllStatesPage';
import StateDetailPage from './pages/StateDetailPage';
import GiftingAssistantPage from './pages/GiftingAssistantPage';
import AllArtisansPage from './pages/AllArtisansPage';
import ArtisanProfilePage from './pages/ArtisanProfilePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

import Hero from './sections/Hero';
import FeaturedArtisans from './sections/FeaturedArtisans';
import ExploreByRegion from './sections/ExploreByRegion';
import CuratedCollection from './sections/CuratedCollection';
import FeaturedProducts from './sections/FeaturedProducts';

const getDashboardSummary = httpsCallable(functions, 'getDashboardSummary');

function App() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMitraOpen, setIsMitraOpen] = useState(false);
  const [scrollToSection, setScrollToSection] = useState(null);

  useEffect(() => {
    const handleAuthChange = async () => {
      setLoading(true);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const role = userDoc.exists() ? userDoc.data().role : 'customer';
        setUserRole(role);

        if (role === 'artisan') {
          try {
            const result = await getDashboardSummary();
            setDashboardData(result.data);
            if(currentPage !== 'dashboard') setCurrentPage('dashboard');
          } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setCurrentPage('home');
          }
        }
      } else {
        setUserRole(null);
        setDashboardData(null);
        setCurrentPage('home');
      }
      setLoading(false);
    };

    handleAuthChange();
  }, [currentUser]); 

  useEffect(() => {
    if (currentPage === 'home' && scrollToSection) {
      const sectionElement = document.getElementById(scrollToSection);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setScrollToSection(null);
    }
  }, [currentPage, scrollToSection]);

  const handleNavigateAndScroll = (sectionId) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
    }
    setScrollToSection(sectionId);
  };

  const renderPage = () => {
    if (loading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }
    let normalizedCurrentPage = currentPage;
    if (normalizedCurrentPage.startsWith('/')) {
      normalizedCurrentPage = normalizedCurrentPage.substring(1);
    }

    if (normalizedCurrentPage.startsWith('artisan/')) {
      const artisanId = normalizedCurrentPage.split('/')[1];
      return <ArtisanProfilePage artisanId={artisanId} onNavigate={setCurrentPage} />;
    }

    if (normalizedCurrentPage.startsWith('state/')) {
      const stateSlug = normalizedCurrentPage.split('/')[1];
      const stateData = findStateData(stateSlug);
      return <StateDetailPage stateData={stateData} onNavigate={setCurrentPage} />;
    }

    if (normalizedCurrentPage === 'artisans') {
      normalizedCurrentPage = 'all-artisans';
    }
    if (normalizedCurrentPage === 'regions') {
      normalizedCurrentPage = 'all-states';
    }
    if (normalizedCurrentPage === 'add-product') {
      normalizedCurrentPage = 'addProduct';
    }

    switch (normalizedCurrentPage) {
      case 'auth': return <AuthPage />;
      case 'shop': return <ShopPage />;
      case 'cart': return <CartPage onNavigate={setCurrentPage} />;
      case 'checkout': return <CheckoutPage onNavigate={setCurrentPage} />;
      case 'dashboard': return userRole === 'artisan' ? <DashboardPage data={dashboardData} onNavigate={setCurrentPage}/> : renderHomepage();
      case 'all-states': return <AllStatesPage onNavigate={setCurrentPage} />;
      case 'all-artisans': return <AllArtisansPage onNavigate={setCurrentPage} />;
      case 'addProduct': return userRole === 'artisan' ? <AddProductPage /> : renderHomepage();
      case 'gifting-assistant': return <GiftingAssistantPage />;
      case 'home':
      default:
        return renderHomepage();
    }
  };

  const renderHomepage = () => (
    <>
      <Hero onNavigate={setCurrentPage} />
      <div id="discover"><FeaturedProducts onNavigate={setCurrentPage} /></div>
      <div id="regions"><ExploreByRegion onNavigate={setCurrentPage} /></div>
      <div id="artisans"><FeaturedArtisans onNavigate={setCurrentPage} /></div>
      <div id="stories"><CuratedCollection /></div>
    </>
  );

  return (
    <CartProvider>
      <div className="app-wrapper">
        <Header
          onSignInClick={() => setCurrentPage('auth')}
          onNavigate={setCurrentPage}
          onNavigateAndScroll={handleNavigateAndScroll}
        />

        <main>
          {renderPage()}
        </main>

        <Footer />
        <CraftMitraButton onClick={() => setIsMitraOpen(true)} />

        <CraftMitraModal
          isOpen={isMitraOpen}
          onClose={() => setIsMitraOpen(false)}
          onNavigateToPage={setCurrentPage}
        />
      </div>
    </CartProvider>
  );
}

export default App;
