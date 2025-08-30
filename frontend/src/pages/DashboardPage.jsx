import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import MarketingCopyGenerator from '../components/MarketingCopyGenerator'; 
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions'; 
import { useAuth } from '../context/AuthContext'; 
import './DashboardPage.css';

const getArtisanProducts = httpsCallable(functions, 'getArtisanProducts');

const DashboardPage = ({ data, onNavigate }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) return;
      console.log("Dashboard querying for artisanId:", currentUser.uid);
      try {
        const result = await getArtisanProducts({ artisanId: currentUser.uid });
        setProducts(result.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentUser]);
  
  if (!data) {
    return <div>Loading Dashboard Data...</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
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
        <StatCard title="Total Sales" value={formatCurrency(data.summaryStats.totalSales)} />
        <StatCard title="Total Products" value={products.length} />
        <StatCard title="Active Artisans" value={data.summaryStats.activeArtisans} />
        <StatCard title="Orders" value={data.summaryStats.totalOrders} />
      </div>

      <div className="artisan-products-section">
        <h2>My Products</h2>
        {isLoading ? (
          <p>Loading your products...</p>
        ) : products.length > 0 ? (
          <div className="products-list">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.imageUrl} alt={product.name} className="product-image" />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>Stock: {product.stock}</p>
                  <p>Price: {formatCurrency(product.price / 100)}</p>
                </div>
                <div className="product-marketing-tool">
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