import React, { useState, useEffect, useRef } from 'react';
import StatCard from '../components/StatCard';
import MarketingCopyGenerator from '../components/MarketingCopyGenerator';
import ConfirmationModal from '../components/ConfirmationModal';
import ReelScriptModal from '../components/ReelScriptModal';
import ArtisanAuctionSubmission from '../components/ArtisanAuctionSubmission';
import { db, functions } from '../firebaseConfig'; // Import db here
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Add Firestore imports
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './DashboardPage.css';

const getDashboardSummary = httpsCallable(functions, 'getDashboardSummary');
const getArtisanProducts = httpsCallable(functions, 'getArtisanProducts');
const getArtisanOrders = httpsCallable(functions, 'getArtisanOrders');
const deleteProduct = httpsCallable(functions, 'deleteProduct');
const getReelScript = httpsCallable(functions, 'getReelScript');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  loadingDashboard: "Loading Dashboard...",
  dashboardError: "Failed to load your dashboard. Please try refreshing the page.",
  dashboardTitle: "Dashboard",
  addProductButton: "+ Add New Product",
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
  noProductsMessage: "You haven't added any products yet. Click 'Add New Product' to get started!",
  edit: "Edit",
  delete: "Delete",
  confirmDeleteTitle: "Confirm Deletion",
  confirmDeleteMessage: "Are you sure you want to permanently delete this product? This action cannot be undone.",
  cancel: "Cancel",
  backToHomeButton: "Back to Home",
  createReelScriptTooltip: "Create Reel Script",
  submitMasterpieceButton: "Submit Masterpiece for Auction",
};

const CommunityIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.962 0L14.25 6h5.25M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> );
const MoreIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg> );
const ReelIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" /></svg> );

const ProductOptions = ({ onEdit, onDelete, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className={`product-options-container ${isOpen ? 'is-active-dropdown' : ''}`} ref={dropdownRef}>
      <button className="options-btn" onClick={() => setIsOpen(p => !p)}><MoreIcon /></button>
      {isOpen && (
        <div className="options-dropdown-menu">
          <button onClick={() => { onEdit(); setIsOpen(false); }}>{content.edit}</button>
          <button onClick={() => { onDelete(); setIsOpen(false); }} className="delete">{content.delete}</button>
        </div>
      )}
    </div>
  );
};

const DashboardBackButton = ({ onNavigate, text }) => {
  return (
    <button className="dashboard-back-btn" onClick={() => onNavigate('home')}>
      <span className="back-btn-icon">←</span>
      <span className="back-btn-text">{text}</span>
    </button>
  );
};

const DashboardPage = ({ onNavigate }) => {
  const { currentUser, userProfile } = useAuth();
  const { currentLanguage } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [content, setContent] = useState(englishContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, productId: null });
  const [reelScript, setReelScript] = useState(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [activeProductForReel, setActiveProductForReel] = useState(null);
  const [showAuctionSubmission, setShowAuctionSubmission] = useState(false);
  const [artisanAuctionPieces, setArtisanAuctionPieces] = useState([]);
  const [loadingAuctionPieces, setLoadingAuctionPieces] = useState(true);
  const [auctionPiecesError, setAuctionPiecesError] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true); // Declare loadingSummary
  const [summaryError, setSummaryError] = useState(null); // Declare summaryError
  const [loadingProducts, setLoadingProducts] = useState(true); // Declare loadingProducts
  const [productsError, setProductsError] = useState(null); // Declare productsError

  const getDashboardSummary = httpsCallable(functions, 'getDashboardSummary');
  const getArtisanProducts = httpsCallable(functions, 'getArtisanProducts');
  const getArtisanOrders = httpsCallable(functions, 'getArtisanOrders');
  const deleteProduct = httpsCallable(functions, 'deleteProduct');
  const getReelScript = httpsCallable(functions, 'getReelScript');
  const getTranslations = httpsCallable(functions, 'getTranslations');

  // New function to fetch artisan's auction pieces
  const fetchArtisanAuctionPieces = async () => {
    if (!currentUser?.uid) return;
    setLoadingAuctionPieces(true);
    try {
      const q = query(
        collection(db, "auctionPieces"),
        where("artisanId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const pieces = await Promise.all(querySnapshot.docs.map(async auctionDoc => {
        const data = { id: auctionDoc.id, ...auctionDoc.data() };
        if (data.status === 'sold' && data.winningBidderId) {
          const userDoc = await getDoc(doc(db, 'users', data.winningBidderId));
          if (userDoc.exists()) {
            data.winningBidderName = userDoc.data().displayName || "Collector";
          }
        }
        return data;
      }));
      setArtisanAuctionPieces(pieces);
      setAuctionPiecesError(null);
    } catch (err) {
      console.error("Error fetching artisan's auction pieces:", err);
      setAuctionPiecesError("Failed to load your auction pieces.");
    } finally {
      setLoadingAuctionPieces(false);
    }
  };

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
  }, [currentUser, content.dashboardError]);

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
          addProductButton: translations[3], communityForumButton: translations[4], totalSalesStat: translations[5],
          totalProductsStat: translations[6], activeArtisansStat: translations[7], totalOrdersStat: translations[8],
          recentOrdersTitle: translations[9], orderIdLabel: translations[10], customerLabel: translations[11],
          dateLabel: translations[12], statusLabel: translations[13], itemsOrderedLabel: translations[14],
          noOrdersMessage: translations[15], myProductsTitle: translations[16], noProductsMessage: translations[17],
          edit: translations[18], delete: translations[19], confirmDeleteTitle: translations[20], 
          confirmDeleteMessage: translations[21], cancel: translations[22], backToHomeButton: translations[23],
          createReelScriptTooltip: translations[24], submitMasterpieceButton: translations[25],
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

  useEffect(() => {
    if (currentUser?.uid) {
      // Fetch dashboard summary
      getDashboardSummary()
        .then(result => {
          setSummaryData(result.data.summaryStats);
          setLoadingSummary(false);
        })
        .catch(err => {
          console.error("Error fetching dashboard summary:", err);
          setSummaryError("Failed to load summary.");
          setLoadingSummary(false);
        });

      // Fetch artisan's products
      getArtisanProducts()
        .then(result => {
          setProducts(result.data.products);
          setLoadingProducts(false);
        })
        .catch(err => {
          console.error("Error fetching artisan products:", err);
          setProductsError("Failed to load your products.");
          setLoadingProducts(false);
        });

      // Fetch artisan's auction pieces
      fetchArtisanAuctionPieces(); // Call new fetch function

    } else if (!currentUser && !userProfile) {
      setLoadingSummary(false);
      setLoadingProducts(false);
      setLoadingAuctionPieces(false); // Set loading to false if no user
      // Optionally redirect to auth or show a message
    }
  }, [currentUser, userProfile]);

  const handleDeleteRequest = (productId) => {
    setDeleteConfirmation({ isOpen: true, productId: productId });
  };
  
  const handleConfirmDelete = async () => {
    const { productId } = deleteConfirmation;
    if (!productId) return;
    try {
      await deleteProduct({ productId });
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error.message);
    } finally {
      setDeleteConfirmation({ isOpen: false, productId: null });
    }
  };
  
  const handleCreateReelScript = async (product) => {
    setActiveProductForReel(product);
    setIsReelModalOpen(true);
    setLoadingScript(true);
    setReelScript(null);
    try {
      const result = await getReelScript({
        productId: product.id,
        language: currentLanguage.name
      });
      setReelScript(result.data.script);
    } catch (error) {
      console.error("Error generating reel script:", error);
    } finally {
      setLoadingScript(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }
 
  if (isLoading) return <div className="page-loader">{content.loadingDashboard}</div>;
  if (error) return <div className="page-error">{error}</div>;

  if (showAuctionSubmission) {
    return <ArtisanAuctionSubmission />;
  }

  return (
    <>
      <ReelScriptModal
        isOpen={isReelModalOpen}
        onClose={() => setIsReelModalOpen(false)}
        script={reelScript}
        isLoading={loadingScript}
        productName={activeProductForReel?.name || ''}
      />
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, productId: null })}
        onConfirm={handleConfirmDelete}
        title={content.confirmDeleteTitle}
        message={content.confirmDeleteMessage}
        confirmText={content.delete}
        cancelText={content.cancel}
      />
      <div className={`dashboard-page ${isTranslating ? 'translating' : ''}`}>
        <DashboardBackButton onNavigate={onNavigate} text={content.backToHomeButton} />
        <div className="dashboard-header">
          <h1>{content.dashboardTitle}</h1>
          <div className="dashboard-actions">
            <button onClick={() => onNavigate('forum')} className="dashboard-btn-forum">
              <CommunityIcon />
              <span>{content.communityForumButton}</span>
            </button>
            <button onClick={() => onNavigate('addProduct')} className="dashboard-btn">
              {content.addProductButton}
            </button>
            <button onClick={() => setShowAuctionSubmission(true)} className="dashboard-btn">
              {content.submitMasterpieceButton}
            </button>
          </div>
        </div>
   
        <div className="stats-grid">
          <StatCard title={content.totalSalesStat} value={summaryData ? formatCurrency(summaryData.totalSales) : '₹0.00'} />
          <StatCard title={content.totalProductsStat} value={products.length} />
          <StatCard title={content.activeArtisansStat} value={summaryData ? summaryData.activeArtisans : 1} /> 
          <StatCard title={content.totalOrdersStat} value={orders.length} />
        </div>

        <div className="dashboard-section">
          <h2>{content.myProductsTitle}</h2>
          {products.length > 0 ? (
            <div className="products-list">
              {products.map(product => (
                <div key={product.id} className="dashboard-product-card">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="dashboard-product-image"
                    onClick={() => onNavigate(`product/${product.id}`)}
                  />
                  <div className="product-info" onClick={() => onNavigate(`product/${product.id}`)}>
                    <h3>{product.name}</h3>
                    <p>Stock: {product.stock}</p>
                    <p>Price: {formatCurrency(product.price / 100)}</p>
                  </div>
                  <div className="card-actions">
                    <div className="product-marketing-tool">
                      <MarketingCopyGenerator product={product} />
                    </div>
                    <button className="action-icon-btn" onClick={() => handleCreateReelScript(product)} data-tooltip={content.createReelScriptTooltip}>
                      <ReelIcon />
                    </button>
                    <ProductOptions 
                      content={content}
                      onEdit={() => onNavigate(`edit-product/${product.id}`)}
                      onDelete={() => handleDeleteRequest(product.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{content.noProductsMessage}</p>
          )}
        </div>

        <div className="dashboard-section">
          <h2>{content.recentOrdersTitle}</h2>
          {orders.length > 0 ? (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="dashboard-order-card">
                  <div className="order-summary">
                     <p><strong>{content.orderIdLabel}</strong> {order.id.substring(0,8)}...</p>
                     <p><strong>{content.customerLabel}</strong> {order.shippingInfo.name}</p>
                     <p><strong>{content.dateLabel}</strong> {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
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

        <div className="dashboard-section">
          <h2>{content.myAuctionPieces}</h2> {/* New title for auction pieces section */}
          {loadingAuctionPieces ? (
            <p>{content.loadingAuctionPieces}</p>
          ) : auctionPiecesError ? (
            <p className="error-message">{auctionPiecesError}</p>
          ) : artisanAuctionPieces.length === 0 ? (
            <p>{content.noAuctionPieces}</p>
          ) : (
            <div className="auction-pieces-list">
              {artisanAuctionPieces.map(piece => (
                <div key={piece.id} className="auction-piece-item">
                  <h3>{piece.name}</h3>
                  <p><strong>Status:</strong> {piece.status.toUpperCase()}</p>
                  {piece.status === 'sold' && (
                    <>
                      <p><strong>Winning Bid:</strong> ₹{piece.winningBidAmount.toLocaleString()}</p>
                      <p><strong>Winner:</strong> {piece.winningBidderName || 'N/A'}</p>
                      <p>Closed on: {piece.closedAt ? new Date(piece.closedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    </>
                  )}
                  {piece.status === 'unsold' && (
                    <p>Closed on: {piece.closedAt ? new Date(piece.closedAt.toDate()).toLocaleDateString() : 'N/A'}. Did not meet reserve price.</p>
                  )}
                  {piece.status === 'live' && piece.currentHighestBid && (
                    <p><strong>Current Highest Bid:</strong> ₹{piece.currentHighestBid.toLocaleString()}</p>
                  )}
                  {piece.status === 'appraised' && (
                    <p><strong>Reserve Price:</strong> ₹{piece.reservePrice.toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;