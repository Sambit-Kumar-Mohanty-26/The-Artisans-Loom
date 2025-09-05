import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import ProductCard from '../components/ProductCard';
import './CustomerDashboardPage.css';

const getCustomerDashboardData = httpsCallable(functions, 'getCustomerDashboardData');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  welcome: "Welcome back",
  dashboard: "Dashboard",
  orders: "Orders",
  wishlist: "Wishlist",
  accountSettings: "Account Settings",
  help: "Help",
  shop: "Shop",
  recentOrders: "Recent Orders",
  myWishlist: "My Wishlist",
  noRecentOrders: "You have no recent orders.",
  emptyWishlist: "Your wishlist is empty. Start exploring!",
  statusShipped: "Shipped",
  statusProcessing: "Processing",
  statusDelivered: "Delivered",
  loadingDashboard: "Loading Dashboard...",
  backToHome: "Back to Home",
};

const BackButton = ({ onNavigate, text }) => {
  return (
    <button className="back-to-home-btn" onClick={() => onNavigate('home')}>
      <span className="btn-icon">←</span>
      <span className="btn-text">{text}</span>
    </button>
  );
};

const CustomerDashboardPage = ({ onNavigate }) => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getCustomerDashboardData();
        setDashboardData(result.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
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
                welcome: translations[0], dashboard: translations[1], orders: translations[2],
                wishlist: translations[3], accountSettings: translations[4], help: translations[5],
                shop: translations[6], recentOrders: translations[7], myWishlist: translations[8],
                noRecentOrders: translations[9], emptyWishlist: translations[10],
                statusShipped: translations[11], statusProcessing: translations[12],
                statusDelivered: translations[13], loadingDashboard: translations[14], backToHome: translations[15],
            });
        } catch (err) {
            console.error("Failed to translate CustomerDashboard content:", err);
            setContent(englishContent);
        } finally {
            setIsTranslating(false);
        }
    };
    translateContent();
  }, [currentLanguage]);

  if (loading || !dashboardData) {
    return <div className="page-loader">{content.loadingDashboard}</div>;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div className="dashboard-section animated-tab">
            <h3 className="section-title">{content.orders}</h3>
            {dashboardData.recentOrders.length > 0 ? (
                <div className="orders-list">
                    {dashboardData.recentOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <img src={order.items[0].imageUrl} alt={order.items[0].name} className="order-item-image" />
                            <div className="order-details">
                                <span className="order-item-name">{order.items.length > 1 ? `${order.items[0].name} + ${order.items.length - 1} more` : order.items[0].name}</span>
                                <span className="order-date">{new Date(order.createdAt._seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="order-status-tracker">
                                <div className="status-labels">
                                    <span>{content.statusProcessing}</span>
                                    <span>{content.statusShipped}</span>
                                    <span>{content.statusDelivered}</span>
                                </div>
                                <div className="status-track">
                                    <div className={`status-dot ${['Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'complete' : ''}`}></div>
                                    <div className="status-line"></div>
                                    <div className={`status-dot ${['Shipped', 'Delivered'].includes(order.status) ? 'complete' : ''}`}></div>
                                    <div className="status-line"></div>
                                    <div className={`status-dot ${order.status === 'Delivered' ? 'complete' : ''}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p>{content.noRecentOrders}</p>}
          </div>
        );
      case 'wishlist':
        return (
          <div className="dashboard-section animated-tab">
            <h3 className="section-title">{content.myWishlist}</h3>
             {dashboardData.wishlistItems.length > 0 ? (
                <div className="wishlist-grid">
                  {dashboardData.wishlistItems.map(item => (
                    <ProductCard key={item.id} product={item} onNavigate={onNavigate} />
                  ))}
                </div>
            ) : <p>{content.emptyWishlist}</p>}
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="animated-tab">
            <div className="dashboard-section">
              <h3 className="section-title">{content.recentOrders}</h3>
              {dashboardData.recentOrders.length > 0 ? (
                <div className="orders-list">
                    {dashboardData.recentOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <img src={order.items[0].imageUrl} alt={order.items[0].name} className="order-item-image" />
                            <div className="order-details">
                                <span className="order-item-name">{order.items.length > 1 ? `${order.items[0].name} + ${order.items.length - 1} more` : order.items[0].name}</span>
                                <span className="order-date">{new Date(order.createdAt._seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="order-status-tracker">
                                <div className="status-labels">
                                    <span>{content.statusProcessing}</span>
                                    <span>{content.statusShipped}</span>
                                    <span>{content.statusDelivered}</span>
                                </div>
                                <div className="status-track">
                                    <div className={`status-dot ${['Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'complete' : ''}`}></div>
                                    <div className="status-line"></div>
                                    <div className={`status-dot ${['Shipped', 'Delivered'].includes(order.status) ? 'complete' : ''}`}></div>
                                    <div className="status-line"></div>
                                    <div className={`status-dot ${order.status === 'Delivered' ? 'complete' : ''}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              ) : <p>{content.noRecentOrders}</p>}
            </div>
            <div className="dashboard-section">
              <h3 className="section-title">{content.myWishlist}</h3>
              {dashboardData.wishlistItems.length > 0 ? (
                <div className="wishlist-grid">
                  {dashboardData.wishlistItems.map(item => (
                    <ProductCard key={item.id} product={item} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : <p>{content.emptyWishlist}</p>}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`customer-dashboard-container ${isTranslating ? 'translating' : ''}`}>
        <BackButton onNavigate={onNavigate} text={content.backToHome} />

      <div className="customer-dashboard">
        <div className="dashboard-welcome-header">
          <h1 className="main-logo-font">The Artisan's Loom</h1>
          <h2>{content.welcome}, {dashboardData.displayName}!</h2>
        </div>

        <div className="dashboard-main-content">
          <aside className="dashboard-sidebar">
            <nav>
              <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>{content.dashboard}</button>
              <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>{content.orders}</button>
              <button onClick={() => setActiveTab('wishlist')} className={activeTab === 'wishlist' ? 'active' : ''}>{content.wishlist}</button>
              <button onClick={() => onNavigate('edit-profile')} >{content.accountSettings}</button>
              <button>{content.help}</button>
            </nav>
            <button className="sidebar-cta" onClick={() => onNavigate('shop')}>{content.shop}</button>
          </aside>

          <main className="dashboard-view">
            {renderActiveTab()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;