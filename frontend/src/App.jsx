import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore'; 

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
import ProductDetailPage from './pages/ProductDetailPage';
import OnboardingPage from './pages/OnboardingPage';
import EditProfilePage from './pages/EditProfilePage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import ForumPage from './pages/ForumPage';
import CreatePostPage from './pages/CreatePostPage';
import ForumPostPage from './pages/ForumPostPage';
import AboutUsPage from './pages/AboutUsPage';
import StoriesPage from './pages/StoriesPage';
import FaqPage from './pages/FaqPage';
import ContactUsPage from './pages/ContactUsPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';

import Hero from './sections/Hero';
import FeaturedArtisans from './sections/FeaturedArtisans';
import ExploreByRegion from './sections/ExploreByRegion';
import CuratedCollection from './sections/CuratedCollection';
import FeaturedProducts from './sections/FeaturedProducts';

const normalizePage = (page) => {
  let normalized = page.startsWith('/') ? page.substring(1) : page;
  const pageAliases = {
    'home': 'home', 'shop': 'shop', 'products': 'shop', 'browse-all-products': 'shop',
    'artisans': 'all-artisans', 'all-artisans': 'all-artisans', 'regions': 'all-states',
    'craft-atlas': 'all-states', 'all-states': 'all-states', 'dashboard': 'dashboard',
    'add-product': 'addProduct', 'addProduct': 'addProduct', 'gifting-assistant': 'gifting-assistant',
    'cart': 'cart', 'checkout': 'checkout', 'auth': 'auth', 'map': 'map.html',
    'interactive-map': 'map.html', 'map.html': 'map.html', 'forum': 'forum', 
    'create-post': 'create-post', 'edit-profile': 'edit-profile',
    'about-us': 'about-us', 'stories': 'stories', 'faq': 'faq', 
    'contact-us': 'contact-us', 'contact': 'contact-us', 'shipping': 'shipping', 'returns': 'returns'
  };
  return pageAliases[normalized] || normalized;
};

function App() {
  const { userProfile, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
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
    if (!authLoading) {
      if (userProfile && !userProfile.onboardingComplete) {
        setCurrentPage('onboarding');
      } else if (userProfile && currentPage === 'auth') {
        const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
        navigateTo(destination);
      }
    }
  }, [userProfile, authLoading, currentPage]);

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
    if (userProfile) { 
      const userDocRef = doc(db, 'users', userProfile.uid);
      const userDoc = await getDoc(userDocRef);
    }
  };

  const renderPage = () => {
    if (authLoading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }

    if (userProfile && !userProfile.onboardingComplete) {
      const handleOnboardingComplete = () => {
        const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
        navigateTo(destination);
      };
      return <OnboardingPage onComplete={handleOnboardingComplete} />;
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
    if (currentPage.startsWith('forum/')) {
      const postId = currentPage.split('/')[1];
      return <ForumPostPage postId={postId} onNavigate={navigateTo} />;
    }

    switch (currentPage) {
      case 'auth': return <AuthPage />;
      case 'shop': return <ShopPage initialSearch={searchResults} clearSearch={() => setSearchResults(null)} onNavigate={navigateTo} />;
      case 'cart': return <CartPage onNavigate={navigateTo} />;
      case 'checkout': return <CheckoutPage onNavigate={navigateTo} />;
      case 'dashboard':
        if (userProfile?.role === 'artisan') {
          return <DashboardPage onNavigate={navigateTo} />;
        } else if (userProfile?.role === 'customer') {
          return <CustomerDashboardPage onNavigate={navigateTo} />;
        }
        return renderHomepage();
      case 'all-states': return <AllStatesPage onNavigate={navigateTo} />;
      case 'all-artisans': return <AllArtisansPage onNavigate={navigateTo} />;
      case 'addProduct': return userProfile?.role === 'artisan' ? <AddProductPage /> : renderHomepage();
      case 'gifting-assistant': return <GiftingAssistantPage onNavigate={navigateTo} onSearch={handleSearch} />;
      case 'onboarding': return <OnboardingPage />;
      case 'edit-profile': return <EditProfilePage onProfileUpdate={handleProfileUpdate} onNavigate={navigateTo} />;
      case 'forum': return <ForumPage onNavigate={navigateTo} />;
      case 'create-post': return <CreatePostPage onNavigate={navigateTo} />;
      case 'about-us': return <AboutUsPage />;
      case 'stories': return <StoriesPage />;
      case 'faq': return <FaqPage />;
      case 'contact-us': return <ContactUsPage />;
      case 'shipping': return <ShippingPage />;
      case 'returns': return <ReturnsPage />;
      case 'home':
      default:
        return renderHomepage();
    }
  };

  const renderHomepage = () => (
    <>
      <Hero onNavigate={navigateTo} onSearch={handleSearch} />
      <FeaturedProducts onNavigate={navigateTo} />
      <div id="discover"></div>
      <ExploreByRegion onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} />
      <FeaturedArtisans onNavigate={navigateTo} />
      <div id="stories"></div>
      <CuratedCollection onNavigate={navigateTo} />
    </>
  );

  return (
    <WishlistProvider>
      <CartProvider>
        <div className="app-wrapper">
          <Header onSignInClick={() => navigateTo('auth')} onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} 
          currentPage={currentPage} />
          <main>{renderPage()}</main>
          <Footer onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} />
          <CraftMitraButton onClick={() => setIsMitraOpen(true)} />
          <CraftMitraModal
            isOpen={isMitraOpen}
            onClose={() => setIsMitraOpen(false)}
            onNavigateToPage={navigateTo}
            userProfile={userProfile}
          />
        </div>
      </CartProvider>
    </WishlistProvider>
  );
}

export default App;