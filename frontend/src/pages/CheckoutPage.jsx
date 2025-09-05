import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext.jsx'; 
import { functions } from '../firebaseConfig.js'; 
import { httpsCallable } from 'firebase/functions';
import './CheckoutPage.css';

const createOrder = httpsCallable(functions, 'createOrder');
const getTranslations = httpsCallable(functions, 'getTranslations');

const englishContent = {
  orderSummaryTitle: "Order Summary",
  quantityLabel: "Qty:",
  totalLabel: "Total",
  shippingInfoTitle: "Shipping Information",
  fullNameLabel: "Full Name",
  addressLabel: "Address",
  cityLabel: "City",
  stateLabel: "State",
  zipCodeLabel: "ZIP Code",
  placeOrderButton: "Place Order",
  processingButton: "Processing...",
  emptyCartError: "Your cart is empty. Cannot place an order.",
  placeOrderError: "Could not place order. Please try again.",
};

const CheckoutPage = ({ onNavigate }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState(englishContent);
  const [shippingInfo, setShippingInfo] = useState({
    name: '', address: '', city: '', state: '', zip: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

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
          orderSummaryTitle: translations[0], quantityLabel: translations[1], totalLabel: translations[2],
          shippingInfoTitle: translations[3], fullNameLabel: translations[4], addressLabel: translations[5],
          cityLabel: translations[6], stateLabel: translations[7], zipCodeLabel: translations[8],
          placeOrderButton: translations[9], processingButton: translations[10], emptyCartError: translations[11],
          placeOrderError: translations[12],
        });
      } catch (err) {
        console.error("Failed to translate CheckoutPage content:", err);
        setContent(englishContent);
      } finally {
        setIsTranslating(false);
      }
    };
    translateContent();
  }, [currentLanguage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
        setError(content.emptyCartError);
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await createOrder({ shippingInfo });
      clearCart();
      onNavigate(`order-success/${result.data.orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message || content.placeOrderError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <div className={`checkout-page ${isTranslating ? 'translating' : ''}`}>
      <div className="checkout-container">
        <div className="order-summary-column">
          <h2>{content.orderSummaryTitle}</h2>
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item.id || item.productId} className="summary-item">
                <img src={item.imageUrl} alt={item.name} />
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">{content.quantityLabel} {item.quantity}</span>
                </div>
                <span className="item-price">{formatCurrency((item.price * item.quantity) / 100)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>{content.totalLabel}</span>
            <span>{formatCurrency(cartTotal / 100)}</span>
          </div>
        </div>

        <div className="shipping-info-column">
          <h2>{content.shippingInfoTitle}</h2>
          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label htmlFor="name">{content.fullNameLabel}</label>
              <input type="text" id="name" name="name" value={shippingInfo.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="address">{content.addressLabel}</label>
              <input type="text" id="address" name="address" value={shippingInfo.address} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="city">{content.cityLabel}</label>
                    <input type="text" id="city" name="city" value={shippingInfo.city} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="state">{content.stateLabel}</label>
                    <input type="text" id="state" name="state" value={shippingInfo.state} onChange={handleInputChange} required />
                </div>
            </div>
            <div className="form-group">
              <label htmlFor="zip">{content.zipCodeLabel}</label>
              <input type="text" id="zip" name="zip" value={shippingInfo.zip} onChange={handleInputChange} required />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="place-order-btn" disabled={isLoading || cartItems.length === 0}>
              {isLoading ? content.processingButton : content.placeOrderButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;