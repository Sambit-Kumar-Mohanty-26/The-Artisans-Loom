import React, { useState } from 'react';
// Corrected Path: Go up one level from 'pages' to 'src', then into 'context'
import { useCart } from '../context/CartContext.jsx'; 
// Corrected Path: Go up one level from 'pages' to 'src' for firebaseConfig
import { functions } from '../firebaseConfig.js'; 
import { httpsCallable } from 'firebase/functions';
// Corrected Path: Assumes CheckoutPage.css is in the same 'pages' folder
import './CheckoutPage.css';

const createOrder = httpsCallable(functions, 'createOrder');

const CheckoutPage = ({ onNavigate }) => {
  const { cartItems, cartTotal, clearCart } = useCart(); // Get clearCart to empty after order
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
        setError("Your cart is empty. Cannot place an order.");
        return;
    }
    setIsLoading(true);
    setError('');

    try {
      const result = await createOrder({ shippingInfo });
      // On success, clear the cart from the context
      clearCart();
      // Then, navigate to a confirmation page with the new order ID
      onNavigate(`order-success/${result.data.orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message || 'Could not place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="order-summary-column">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item.id || item.productId} className="summary-item">
                <img src={item.imageUrl} alt={item.name} />
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">Qty: {item.quantity}</span>
                </div>
                <span className="item-price">{formatCurrency((item.price * item.quantity) / 100)}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatCurrency(cartTotal / 100)}</span>
          </div>
        </div>

        <div className="shipping-info-column">
          <h2>Shipping Information</h2>
          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={shippingInfo.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" value={shippingInfo.address} onChange={handleInputChange} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input type="text" id="city" name="city" value={shippingInfo.city} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input type="text" id="state" name="state" value={shippingInfo.state} onChange={handleInputChange} required />
                </div>
            </div>
            <div className="form-group">
              <label htmlFor="zip">ZIP Code</label>
              <input type="text" id="zip" name="zip" value={shippingInfo.zip} onChange={handleInputChange} required />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="place-order-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;