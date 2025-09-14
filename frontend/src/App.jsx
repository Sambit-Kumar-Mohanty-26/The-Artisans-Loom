import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { db, functions } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import Header from './components/Header';
import Footer from './components/Footer';
import CraftMitraButton from './components/CraftMitraButton';
import CraftMitraModal from './components/CraftMitraModal';
import AnimatedBackButton from './components/AnimatedBackButton';

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
import TrendingPage from './pages/TrendingPage';
import StoriesPage from './pages/StoriesPage';
import StoryDetailPage from './pages/StoryDetailPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import FaqPage from './pages/FaqPage';
import ReturnsPage from './pages/ReturnsPage';
import ShippingPage from './pages/ShippingPage';

import Hero from './sections/Hero';
import FeaturedArtisans from './sections/FeaturedArtisans';
import TrendingSection from './sections/TrendingSection';
import ExploreByRegion from './sections/ExploreByRegion';
import CuratedCollection from './sections/CuratedCollection';
import FeaturedProducts from './sections/FeaturedProducts';

const getTranslations = httpsCallable(functions, 'getTranslations');

const normalizePage = (page) => {
  let normalized = page.startsWith('/') ? page.substring(1) : page;
  if (normalized.includes('/')) {
    return normalized;
  }
  const pageAliases = {
    'home': 'home', 'shop': 'shop', 'products': 'shop', 'browse-all-products': 'shop',
    'artisans': 'all-artisans', 'all-artisans': 'all-artisans', 'regions': 'all-states',
    'craft-atlas': 'all-states', 'all-states': 'all-states', 'dashboard': 'dashboard',
    'add-product': 'addProduct', 'addProduct': 'addProduct', 'gifting-assistant': 'gifting-assistant',
    'cart': 'cart', 'checkout': 'checkout', 'auth': 'auth', 'map': 'map.html',
    'interactive-map': 'map.html', 'map.html': 'map.html', 'forum': 'forum', 
    'create-post': 'create-post', 'edit-profile': 'edit-profile', 'trending': 'trending',
    'stories': 'stories', 'about-us': 'about-us', 'contact-us': 'contact-us', 
    'faq': 'faq', 'returns': 'returns', 'shipping': 'shipping'
  };
  return pageAliases[normalized] || page;
};

function App() {
  return (
    <WishlistProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </WishlistProvider>
  );
}

const AppContent = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname.substring(1);
    return normalizePage(path) || 'home';
  });
  const [isMitraOpen, setIsMitraOpen] = useState(false);
  const [scrollToSection, setScrollToSection] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [backButtonText, setBackButtonText] = useState('Back');

  const navigateTo = (page, replace = false) => {
    const normalizedPath = normalizePage(page);
    if (normalizedPath === 'map.html') {
      window.location.href = '/map.html';
      return;
    }
    if (normalizedPath !== currentPage) {
      setCurrentPage(normalizedPath);
      const url = normalizedPath === 'home' ? '/' : `/${normalizedPath}`;
      if (replace) {
        window.history.replaceState({ page: normalizedPath }, '', url);
      } else {
        window.history.pushState({ page: normalizedPath }, '', url);
      }
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const newPage = event.state?.page || 'home';
      setCurrentPage(newPage);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (userProfile && !userProfile.onboardingComplete) {
        navigateTo('onboarding', true);
      } else if (userProfile && userProfile.onboardingComplete && currentPage === 'onboarding') {
        const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
        navigateTo(destination, true);
      } else if (userProfile && currentPage === 'auth') {
        const destination = userProfile.role === 'artisan' ? 'dashboard' : 'home';
        navigateTo(destination, true);
      }
    }
  }, [userProfile, authLoading, currentPage]);

  useEffect(() => {
    if (!scrollToSection) {
      window.scrollTo(0, 0);
    }
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === 'home' && scrollToSection) {
      const scrollTimer = setTimeout(() => {
        const sectionElement = document.getElementById(scrollToSection);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setScrollToSection(null);
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [currentPage, scrollToSection]);

  useEffect(() => {
    const translateBackText = async () => {
      if (currentLanguage.code === 'en') {
        setBackButtonText('Back');
        return;
      }
      try {
        const result = await getTranslations({
          texts: ['Back'],
          targetLanguageCode: currentLanguage.code,
        });
        setBackButtonText(result.data.translations[0]);
      } catch (error) {
        console.error("Failed to translate back button:", error);
        setBackButtonText('Back');
      }
    };
    translateBackText();
  }, [currentLanguage]);

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
      await getDoc(userDocRef);
      console.log("Profile update signal received by App.jsx");
    }
  };

  const renderPage = () => {
    if (authLoading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }
    if (userProfile && !userProfile.onboardingComplete) {
      return <OnboardingPage onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('product/')) {
      const productId = currentPage.split('/')[1];
      return <ProductDetailPage productId={productId} onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('artisan/')) {
      const artisanId = currentPage.split('/')[1];
      return <ArtisanProfilePage artisanId={artisanId} onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('edit-product/')) {
      const productId = currentPage.split('/')[1];
      return <EditProductPage productId={productId} onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('state/')) {
      const stateSlug = currentPage.split('/')[1];
      const stateData = findStateData(stateSlug);
      return <StateDetailPage stateData={stateData} onNavigate={navigateTo} onSearch={handleSearch} />;
    }
    if (currentPage.startsWith('order-success/')) {
      const orderId = currentPage.split('/')[1];
      return <OrderSuccessPage orderId={orderId} onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('forum/')) {
      const postId = currentPage.split('/')[1];
      return <ForumPostPage postId={postId} onNavigate={navigateTo} />;
    }
    if (currentPage.startsWith('story/')) {
      const storyId = currentPage.split('/')[1];
      return <StoryDetailPage storyId={storyId} onNavigate={navigateTo} />;
    }

    switch (currentPage) {
      case 'trending': return <TrendingPage onNavigate={navigateTo} />;
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
      case 'onboarding': return <OnboardingPage onNavigate={navigateTo} />;
      case 'edit-profile': return <EditProfilePage onProfileUpdate={handleProfileUpdate} onNavigate={navigateTo} />;
      case 'forum': return <ForumPage onNavigate={navigateTo} />;
      case 'create-post': return <CreatePostPage onNavigate={navigateTo} />;
      case 'stories': return <StoriesPage onNavigate={navigateTo} />;
      case 'about-us': return <AboutUsPage />;
      case 'contact-us': return <ContactUsPage />;
      case 'faq': return <FaqPage />;
      case 'returns': return <ReturnsPage />;
      case 'shipping': return <ShippingPage />;
      case 'home':
      default:
        return renderHomepage();
    }
  };

  const renderHomepage = () => (
    <>
      <Hero onNavigate={navigateTo} onSearch={handleSearch} />
      <div id="discover"><FeaturedProducts onNavigate={navigateTo} /></div>
      <div id="trending"><TrendingSection onNavigate={navigateTo} /></div>
      <div id="regions"><ExploreByRegion onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} /></div>
      <div id="artisans"><FeaturedArtisans onNavigate={navigateTo} /></div>
      <div id="stories"><CuratedCollection onNavigate={navigateTo} /></div>
    </>
  );

  return (
    <>
      {currentPage !== 'home' && currentPage !== 'dashboard' && (<AnimatedBackButton text={backButtonText} onClick={handleGoBack} />)}
      <div className="app-wrapper">
        <Header onSignInClick={() => navigateTo('auth')} onNavigate={navigateTo} onNavigateAndScroll={handleNavigateAndScroll} currentPage={currentPage} />
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
    </>
  );
};

export default App;