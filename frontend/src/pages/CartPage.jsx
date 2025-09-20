import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext.jsx'; 
import { functions } from '../firebaseConfig.js'; 
import { httpsCallable } from 'firebase/functions';
import './CartPage.css';

const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  loadingCart: "Loading your cart...",
  pageTitle: "Your Shopping Cart",
  emptyCartMessage: "Your cart is currently empty.",
  continueShoppingButton: "Continue Shopping",
  priceLabel: "Price:",
  removeButton: "Remove",
  summaryTitle: "Summary",
  subtotalLabel: "Subtotal",
  shippingLabel: "Shipping",
  shippingValue: "FREE",
  totalLabel: "Total",
  checkoutButton: "Proceed to Checkout",
  clearCartButton: "Clear Cart",
};

const MinusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg> );
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg> );

const CartPage = ({ onNavigate }) => {
  const { cartItems, updateItemQuantity, removeItem, clearCart, cartTotal, loading } = useCart();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = React.useState(englishContent);
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
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
          loadingCart: translations[0], pageTitle: translations[1], emptyCartMessage: translations[2],
          continueShoppingButton: translations[3], priceLabel: translations[4], removeButton: translations[5],
          summaryTitle: translations[6], subtotalLabel: translations[7], shippingLabel: translations[8],
          shippingValue: translations[9], totalLabel: translations[10], checkoutButton: translations[11],
          clearCartButton: translations[12],
        });
      } catch (err) {
        console.error("Failed to translate CartPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const formatCurrency = (amountInPaise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amountInPaise / 100);
  };
  
  if (loading && cartItems.length === 0) {
      return <div className="cart-page-container"><p>{content.loadingCart}</p></div>;
  }

  return (
    <div className={`cart-page-container ${isTranslating ? 'translating' : ''}`}>
      <h2 className="page-title">{content.pageTitle}</h2>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>{content.emptyCartMessage}</p>
          <button onClick={() => onNavigate('shop')} className="shop-now-btn">
            {content.continueShoppingButton}
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
                  <p className="item-price">{content.priceLabel} {formatCurrency(item.price)}</p>
                  <div className="quantity-selector">
                    <button 
                      onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} 
                      disabled={item.quantity <= 1 || loading}
                      className="quantity-btn"
                    >
                      <MinusIcon />
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} 
                      disabled={loading}
                      className="quantity-btn"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
                <div className="cart-item-actions">
                    <p className="item-subtotal">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <button onClick={() => removeItem(item.productId)} className="remove-item-btn" disabled={loading}>
                      {content.removeButton}
                    </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>{content.summaryTitle}</h3>
            <div className="summary-line">
              <span>{content.subtotalLabel}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="summary-line">
              <span>{content.shippingLabel}</span>
              <span>{content.shippingValue}</span>
            </div>
            <div className="summary-total">
              <span>{content.totalLabel}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button onClick={() => onNavigate('checkout')} className="checkout-btn" disabled={loading || cartItems.length === 0}>
              {content.checkoutButton}
            </button>
            <button onClick={clearCart} className="clear-cart-btn" disabled={loading || cartItems.length === 0}>
              {content.clearCartButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;