import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import MarketingCopyGenerator from '../components/MarketingCopyGenerator'; 
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions'; 
import { useAuth } from '../context/AuthContext'; 
import { useLanguage } from '../context/LanguageContext';
import './DashboardPage.css';

const getDashboardSummary = httpsCallable(functions, 'getDashboardSummary');
const getArtisanProducts = httpsCallable(functions, 'getArtisanProducts');
const getArtisanOrders = httpsCallable(functions, 'getArtisanOrders');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  loadingDashboard: "Loading Dashboard...",
  dashboardError: "Failed to load your dashboard. Please try refreshing the page.",
  dashboardTitle: "Dashboard",
  addProductButton: "+ Add New Product",
  backToHomeButton: "Back to Home",
  communityForumButton: "Community Forum",
  totalSalesStat: "Total Sales",
  totalProductsStat: "Total Products",
  activeArtisansStat: "Active Artisans",
  totalOrdersStat: "Total Orders",
  recentOrdersTitle: "Recent Orders",
  orderIdLabel: "Order ID:",
  customerLabel: "Customer:",
  dateLabel: "Date:",
  statusLabel: "Status:",
  itemsOrderedLabel: "Items Ordered:",
  noOrdersMessage: "You have no new orders.",
  myProductsTitle: "My Products",
  stockLabel: "Stock:",
  priceLabel: "Price:",
  noProductsMessage: "You haven't added any products yet. Click 'Add New Product' to get started!",
};

const CommunityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.962 0L14.25 6h5.25M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const DashboardPage = ({ onNavigate }) => {
 const { currentUser } = useAuth();
 const { currentLanguage } = useLanguage();
 const [summaryData, setSummaryData] = useState(null);
 const [products, setProducts] = useState([]);
 const [orders, setOrders] = useState([]);
 const [content, setContent] = useState(englishContent);
 const [isLoading, setIsLoading] = useState(true);
 const [isTranslating, setIsTranslating] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
  const fetchData = async () => {
   if (!currentUser) return;
   setIsLoading(true);
   setError('');
   try {
    const [summaryResult, productsResult, ordersResult] = await Promise.all([
     getDashboardSummary(), getArtisanProducts(), getArtisanOrders()
    ]);
    setSummaryData(summaryResult.data.summaryStats);
    setProducts(productsResult.data.products);
    setOrders(ordersResult.data.orders);
   } catch (err) {
    console.error("Error fetching dashboard data:", err);
    setError(content.dashboardError);
   } finally {
    setIsLoading(false);
   }
  };
  fetchData();
 }, [currentUser]);

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
          texts: textsToTranslate, targetLanguageCode: currentLanguage.code,
        });
        const translations = result.data.translations;
        setContent({
          loadingDashboard: translations[0], dashboardError: translations[1], dashboardTitle: translations[2],
          addProductButton: translations[3], backToHomeButton: translations[4], totalSalesStat: translations[5],
          totalProductsStat: translations[6], activeArtisansStat: translations[7], totalOrdersStat: translations[8],
          recentOrdersTitle: translations[9], orderIdLabel: translations[10], customerLabel: translations[11],
          dateLabel: translations[12], statusLabel: translations[13], itemsOrderedLabel: translations[14],
          noOrdersMessage: translations[15], myProductsTitle: translations[16], stockLabel: translations[17],
          priceLabel: translations[18], noProductsMessage: translations[19], communityForumButton: translations[20],
        });
      } catch (err) {
        console.error("Failed to translate DashboardPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

 const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
 }
 
 if (isLoading) return <div className="page-loader">{content.loadingDashboard}</div>;
 if (error) return <div className="page-error">{error}</div>;

 return (
  <div className={`dashboard-page ${isTranslating ? 'translating' : ''}`}>
   <div className="dashboard-header">
    <h1>{content.dashboardTitle}</h1>
    <div className="dashboard-actions">
      <button onClick={() => onNavigate('forum')} className="dashboard-btn-forum">
            {content.communityForumButton}
          </button>
     <button onClick={() => onNavigate('addProduct')} className="dashboard-btn">
      {content.addProductButton}
     </button>
     <button onClick={() => onNavigate('home')} className="dashboard-btn-secondary">
      {content.backToHomeButton}
     </button>
    </div>
   </div>
   
   <div className="stats-grid">
    <StatCard title={content.totalSalesStat} value={summaryData ? formatCurrency(summaryData.totalSales) : '₹0.00'} />
    <StatCard title={content.totalProductsStat} value={products.length} />
    <StatCard title={content.activeArtisansStat} value={summaryData ? summaryData.activeArtisans : 1} /> 
    <StatCard title={content.totalOrdersStat} value={orders.length} />
   </div>

    <div className="artisan-orders-section">
      <h2>{content.recentOrdersTitle}</h2>
      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="dashboard-order-card">
              <div className="order-summary">
                 <p><strong>{content.orderIdLabel}</strong> {order.id}</p>
                 <p><strong>{content.customerLabel}</strong> {order.shippingInfo.name}</p>
                 <p><strong>{content.dateLabel}</strong> {order.createdAt && typeof order.createdAt._seconds === 'number'
                    ? new Date(order.createdAt._seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                 <p><strong>{content.statusLabel}</strong> <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></p>
              </div>
              <div className="order-items">
                <h4>{content.itemsOrderedLabel}</h4>
                <ul>
                  {order.items.map(item => (
                    <li key={item.productId}>
                      <img src={item.imageUrl} alt={item.name} />
                      <span>{item.name} (Qty: {item.quantity})</span>
                      <strong>{formatCurrency(item.price / 100)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>{content.noOrdersMessage}</p>
      )}
    </div>

   <div className="artisan-products-section">
    <h2>{content.myProductsTitle}</h2>
     {products.length > 0 ? (
     <div className="products-list">
      {products.map(product => (
       <div key={product.id} className="dashboard-product-card" onClick={() => onNavigate(`product/${product.id}`)}>
        <img src={product.imageUrl} alt={product.name} className="dashboard-product-image" />
        <div className="product-info">
         <h3>{product.name}</h3>
         <p>{content.stockLabel} {product.stock}</p>
         <p>{content.priceLabel} {formatCurrency(product.price / 100)}</p>
        </div>
        <div className="product-marketing-tool" onClick={(e) => e.stopPropagation()}>
         <MarketingCopyGenerator product={product} />
        </div>
       </div>
      ))}
     </div>
    ) : (
     <p>{content.noProductsMessage}</p>
    )}
   </div>
  </div>
 );
};

export default DashboardPage;