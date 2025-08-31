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

const normalizePage = (page) => {
  let normalized = page.startsWith('/') ? page.substring(1) : page;

  const pageAliases = {
    'home': 'home',
    'shop': 'shop',
    'products': 'shop', 
    'browse-all-products': 'shop',
    'artisans': 'all-artisans',
    'all-artisans': 'all-artisans',
    'regions': 'all-states',
    'craft-atlas': 'all-states', 
    'all-states': 'all-states',
    'dashboard': 'dashboard',
    'add-product': 'addProduct',
    'addProduct': 'addProduct',
    'gifting-assistant': 'gifting-assistant',
    'cart': 'cart',
    'checkout': 'checkout',
    'auth': 'auth',
    'map': 'map.html', 
    'interactive-map': 'map.html',
    'map.html': 'map.html'
  };

  return pageAliases[normalized] || normalized;
};


function App() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMitraOpen, setIsMitraOpen] = useState(false);
  const [scrollToSection, setScrollToSection] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  const navigateTo = (page) => {
    const normalizedPath = normalizePage(page);

    if (normalizedPath === 'map.html') {
      window.location.href = '/map.html'; 
    } else {
      setCurrentPage(normalizedPath); 
    }
  };

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
            if(currentPage !== 'dashboard') navigateTo('dashboard');
          } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            navigateTo('home');
          }
        }
      } else {
        setUserRole(null);
        setDashboardData(null);
        navigateTo('home');
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
      navigateTo('home');
    }
    setScrollToSection(sectionId);
  };
  const handleSearch = (searchData) => {
    setSearchResults(searchData);
    navigateTo('shop'); 
  };

  const renderPage = () => {
    if (loading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }

    if (currentPage.startsWith('artisan/')) {
      const artisanId = currentPage.split('/')[1];
      return <ArtisanProfilePage artisanId={artisanId} onNavigate={navigateTo} />;
    }

    if (currentPage.startsWith('state/')) {
      const stateSlug = currentPage.split('/')[1];
      const stateData = findStateData(stateSlug);
      return <StateDetailPage stateData={stateData} onNavigate={navigateTo} />;
    }
    
    if (currentPage.startsWith('order-success/')) {
      const orderId = currentPage.split('/')[1];
      return <OrderSuccessPage orderId={orderId} onNavigate={navigateTo} />;
    }

    switch (currentPage) {
      case 'auth': return <AuthPage />;
      case 'shop': return <ShopPage initialSearch={searchResults} clearSearch={() => { setSearchResults(null); }} />;
      case 'cart': return <CartPage onNavigate={navigateTo} />;
      case 'checkout': return <CheckoutPage onNavigate={navigateTo} />;
      case 'dashboard': return userRole === 'artisan' ? <DashboardPage data={dashboardData} onNavigate={navigateTo}/> : renderHomepage();
      case 'all-states': return <AllStatesPage onNavigate={navigateTo} />;
      case 'all-artisans': return <AllArtisansPage onNavigate={navigateTo} />;
      case 'addProduct': return userRole === 'artisan' ? <AddProductPage /> : renderHomepage();
      case 'gifting-assistant': return <GiftingAssistantPage />;
      case 'home':
      default:
        return renderHomepage();
    }
  };

  const renderHomepage = () => (
    <>
      <Hero onNavigate={navigateTo} onSearch={handleSearch} />
      <div id="discover"><FeaturedProducts onNavigate={navigateTo} /></div>
      <div id="regions"><ExploreByRegion onNavigate={navigateTo} /></div>
      <div id="artisans"><FeaturedArtisans onNavigate={navigateTo} /></div>
      <div id="stories"><CuratedCollection /></div>
    </>
  );

  return (
    <CartProvider>
      <div className="app-wrapper">
        <Header
          onSignInClick={() => navigateTo('auth')}
          onNavigate={navigateTo}
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
          onNavigateToPage={navigateTo}
        />
      </div>
    </CartProvider>
  );
}

export default App;
