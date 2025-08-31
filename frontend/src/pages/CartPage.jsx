// File: frontend/src/pages/CartPage.jsx

import React from 'react';
// Corrected Path: Go up one level from 'pages' to 'src', then into 'context'
import { useCart } from '../context/CartContext';
// Corrected Path: Assumes CartPage.css is in the same 'pages' folder
import './CartPage.css';

const CartPage = ({ onNavigate }) => {
  // ✅ FIX 1: Get cartTotal and loading directly from the context
  const { cartItems, updateItemQuantity, removeItem, clearCart, cartTotal, loading } = useCart();

  // The manual `calculatedTotal` is no longer needed.

  const formatCurrency = (amountInPaise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amountInPaise / 100); // Always divide by 100 before formatting
  };
  
  // Show a simple loading message while fetching the initial cart
  if (loading && cartItems.length === 0) {
      return <div className="cart-page-container"><p>Loading your cart...</p></div>;
  }

  return (
    <div className="cart-page-container">
      <h2>Your Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is currently empty.</p>
          <button onClick={() => onNavigate('shop')} className="shop-now-btn">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.productId} className="cart-item-card">
                <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>Price: {formatCurrency(item.price)}</p>
                  <div className="quantity-selector">
                    {/* ✅ FIX 2: Disable buttons while loading */}
                    <button onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1 || loading}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} disabled={loading}>+</button>
                  </div>
                </div>
                <div className="cart-item-actions">
                    <p className="item-subtotal">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button onClick={() => removeItem(item.productId)} className="remove-item-btn" disabled={loading}>
                      Remove
                    </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Summary</h3>
            <div className="summary-line">
              <span>Subtotal</span>
              {/* ✅ FIX 3: Use cartTotal directly from the context */}
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span>FREE</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button onClick={() => onNavigate('checkout')} className="checkout-btn" disabled={loading || cartItems.length === 0}>
              Proceed to Checkout
            </button>
            <button onClick={clearCart} className="clear-cart-btn" disabled={loading || cartItems.length === 0}>
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;