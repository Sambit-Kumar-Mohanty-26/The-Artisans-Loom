import React from 'react';
// Corrected Path: Assumes OrderSuccessPage.css is in the same 'pages' folder.
import './OrderSuccessPage.css';

const OrderSuccessPage = ({ onNavigate, orderId }) => {
  return (
    <div className="order-success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Thank You!</h1>
        <p>Your order has been placed successfully.</p>
        <p className="order-number">Order ID: <strong>{orderId}</strong></p>
        <p>You will receive an email confirmation shortly.</p>
        <button onClick={() => onNavigate('home')} className="home-btn">
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;