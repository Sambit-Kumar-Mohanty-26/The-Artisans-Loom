import React from 'react';
import StatCard from '../components/StatCard';
import './DashboardPage.css';

// --- UPDATED: The component now receives the onNavigate function ---
const DashboardPage = ({ data, onNavigate }) => {
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
        {/* --- NEW: A dedicated container for the action buttons --- */}
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
        <StatCard title="Total Products" value={data.summaryStats.totalProducts} />
        <StatCard title="Active Artisans" value={data.summaryStats.activeArtisans} />
        <StatCard title="Orders" value={data.summaryStats.totalOrders} />
      </div>

      <div className="dashboard-main-content">
        <div className="sales-chart-container">
          <h3>Sales Chart</h3>
          <p>(Chart component goes here)</p>
        </div>
        <div className="recent-activity-container">
          <h3>Recent Activity</h3>
          <ul>
            {data.recentActivity && data.recentActivity.map(activity => (
              <li key={activity.id}>
                New order from {activity.customerName || 'a customer'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;