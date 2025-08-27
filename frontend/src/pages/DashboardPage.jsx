import React from 'react';
import StatCard from '../components/StatCard';
import './DashboardPage.css';

const DashboardPage = ({ data }) => {
  if (!data) {
    return <div>Loading Dashboard Data...</div>;
  }

  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      
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