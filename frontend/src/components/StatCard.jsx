import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-info">
        <p className="stat-card-title">{title}</p>
        <h3 className="stat-card-value">{value}</h3>
      </div>
      {icon && <div className="stat-card-icon">{icon}</div>}
    </div>
  );
};

export default StatCard;