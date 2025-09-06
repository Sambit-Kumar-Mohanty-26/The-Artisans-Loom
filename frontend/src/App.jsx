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
import CraftMitraAssistant from './components/CraftMitraAssistant'; 

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
import ProductDetailPage from './pages/ProductDetailPage';
import OnboardingPage from './pages/OnboardingPage';
import EditProfilePage from './pages/EditProfilePage';
import CustomerDashboardPage from './pages/CustomerDashboardPage'; 

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
  const { currentUser, userRole, onboardingComplete, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [userProfile, setUserProfile] = useState(null); 
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
    const handleAuthAndProfile = async () => {
      if (authLoading) return; 

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profileData = { uid: currentUser.uid, ...userDoc.data() };
          setUserProfile(profileData); 

          if (!profileData.onboardingComplete) {
            setCurrentPage('onboarding');
          } else if (profileData.role === 'artisan' && currentPage !== 'dashboard') {
            navigateTo('dashboard');
          } else if (profileData.role === 'customer') { 
            navigateTo('home');
          }
        } else {
          console.error("User document not found in Firestore for authenticated user.");
          setUserProfile(null);
          navigateTo('home');
        }
      } else {
        setUserProfile(null);
        navigateTo('home');
      }
      setLoading(false);
    };

    handleAuthAndProfile();
  }, [currentUser, authLoading]); 

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
  const handleProfileUpdate = async () => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // setUserProfile({ uid: currentUser.uid, ...userDoc.data() }); 
      }
    }
  };

  const renderPage = () => {
    if (loading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }
    if (currentPage === 'edit-profile') {
      return <EditProfilePage
               userProfile={userProfile} 
               onProfileUpdate={handleProfileUpdate}
               onNavigate={navigateTo}
             />;
    }
    if (currentPage === 'onboarding' && userProfile) { 
      const handleOnboardingComplete = async () => { 
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef); 
        if (docSnap.exists()) {
          setUserProfile({ uid: currentUser.uid, ...docSnap.data() });
        }

        const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
        navigateTo(destination);
      };
      return <OnboardingPage userProfile={userProfile} onComplete={handleOnboardingComplete} />;
    }

    if (currentPage.startsWith('product/')) {
      const productId = currentPage.split('/')[1];
      return <ProductDetailPage productId={productId} onNavigate={navigateTo} />;
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
      case 'shop': return <ShopPage 
                            initialSearch={searchResults} 
                            clearSearch={() => setSearchResults(null)} 
                            onNavigate={navigateTo} 
                         />;
      case 'cart': return <CartPage onNavigate={navigateTo} />;
      case 'checkout': return <CheckoutPage onNavigate={navigateTo} />;
      case 'dashboard':
          if (userProfile?.role === 'artisan') {
            return <DashboardPage onNavigate={navigateTo}/>;
          } else if (userProfile?.role === 'customer') {
            return <CustomerDashboardPage userProfile={userProfile} onNavigate={navigateTo} />;
          } else {
            return renderHomepage();
          }
      case 'all-states': return <AllStatesPage onNavigate={navigateTo} />;
      case 'all-artisans': return <AllArtisansPage onNavigate={navigateTo} />;
      case 'addProduct': return userProfile?.role === 'artisan' ? <AddProductPage /> : renderHomepage();
      case 'gifting-assistant': return <GiftingAssistantPage />;
      case 'home':
      default:
        if (currentUser && !userProfile?.onboardingComplete && !loading) {
          return <div className="loading-fullscreen">Loading...</div>;
        }
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

        <Footer onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} />
        <CraftMitraButton onClick={() => setIsMitraOpen(true)} />

        <CraftMitraModal
          isOpen={isMitraOpen}
          onClose={() => setIsMitraOpen(false)}
          onNavigateToPage={navigateTo}
        >
          <CraftMitraAssistant />
        </CraftMitraModal>
      </div>
    </CartProvider>
  );
}

export default App;
