import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import MarketingCopyGenerator from '../components/MarketingCopyGenerator'; 
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions'; 
import { useAuth } from '../context/AuthContext'; 
import './DashboardPage.css';

const getDashboardSummary = httpsCallable(functions, 'getDashboardSummary');
const getArtisanProducts = httpsCallable(functions, 'getArtisanProducts');
const getArtisanOrders = httpsCallable(functions, 'getArtisanOrders');

const DashboardPage = ({ onNavigate }) => {
 const { currentUser } = useAuth();
 const [summaryData, setSummaryData] = useState(null);
 const [products, setProducts] = useState([]);
 const [orders, setOrders] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');

 useEffect(() => {
  const fetchData = async () => {
   if (!currentUser) return;

   setIsLoading(true);
   setError('');
   try {
    const [summaryResult, productsResult, ordersResult] = await Promise.all([
     getDashboardSummary(),
     getArtisanProducts(),
     getArtisanOrders()
    ]);
    
    setSummaryData(summaryResult.data.summaryStats);
    setProducts(productsResult.data.products);
    setOrders(ordersResult.data.orders);

   } catch (err) {
    console.error("Error fetching dashboard data:", err);
    setError('Failed to load your dashboard. Please try refreshing the page.');
   } finally {
    setIsLoading(false);
   }
  };

  fetchData();
 }, [currentUser]); 

 const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
 }
 
 if (isLoading) {
  return <div className="page-loader">Loading Dashboard...</div>;
 }

 if (error) {
  return <div className="page-error">{error}</div>;
 }

 return (
  <div className="dashboard-page">
   <div className="dashboard-header">
    <h1>Dashboard</h1>
    <div className="dashboard-actions">
     <button onClick={() => onNavigate('addProduct')} className="dashboard-btn">
      + Add New Product
     </button>
     <button onClick={() => onNavigate('home')} className="dashboard-btn-secondary">
      Back to Home
     </button>
    </div>
   </div>
   
   <div className="stats-grid">
    <StatCard title="Total Sales" value={summaryData ? formatCurrency(summaryData.totalSales) : '₹0.00'} />
    <StatCard title="Total Products" value={products.length} />
    <StatCard title="Active Artisans" value={summaryData ? summaryData.activeArtisans : 1} /> 
    <StatCard title="Total Orders" value={orders.length} />
   </div>

    <div className="artisan-orders-section">
      <h2>Recent Orders</h2>
      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="dashboard-order-card">
              <div className="order-summary">
                 <p><strong>Order ID:</strong> {order.id}</p>
                 <p><strong>Customer:</strong> {order.shippingInfo.name}</p>
                 <p><strong>Date:</strong> {order.createdAt && typeof order.createdAt._seconds === 'number'
                    ? new Date(order.createdAt._seconds * 1000).toLocaleDateString()
                    : 'N/A'}
                 </p>
                 <p><strong>Status:</strong> <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></p>
              </div>
              <div className="order-items">
                <h4>Items Ordered:</h4>
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
        <p>You have no new orders.</p>
      )}
    </div>

   <div className="artisan-products-section">
    <h2>My Products</h2>
     {products.length > 0 ? (
     <div className="products-list">
      {products.map(product => (
       <div 
        key={product.id} 
        className="dashboard-product-card" 
        onClick={() => onNavigate(`product/${product.id}`)}
       >
        <img src={product.imageUrl} alt={product.name} className="dashboard-product-image" />
        <div className="product-info">
         <h3>{product.name}</h3>
         <p>Stock: {product.stock}</p>
         <p>Price: {formatCurrency(product.price / 100)}</p>
        </div>
        <div className="product-marketing-tool" onClick={(e) => e.stopPropagation()}>
         <MarketingCopyGenerator product={product} />
        </div>
       </div>
      ))}
     </div>
    ) : (
     <p>You haven't added any products yet. Click "Add New Product" to get started!</p>
    )}
   </div>
  </div>
 );
};

export default DashboardPage;