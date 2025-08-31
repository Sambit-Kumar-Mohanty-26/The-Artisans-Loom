import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const getCart = httpsCallable(functions, 'getCart');
const updateCart = httpsCallable(functions, 'updateCart');

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!currentUser) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    setError(null); 
    try {
      const result = await getCart();
      setCartItems(Array.isArray(result.data.cart) ? result.data.cart : []);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Could not load cart.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const updateItemQuantity = async (productId, quantity) => {
    setLoading(true);
    try {
      await updateCart({ productId, quantity: Number(quantity) });
      await refreshCart(); 
    } catch(err) {
      console.error("Error updating quantity:", err);
      setError("Could not update item quantity.");
    } finally {
        setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const existingItem = cartItems.find(item => item.productId === productId);
    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    await updateItemQuantity(productId, newQuantity);
  };
  
  const removeItem = async (productId) => {
    await updateItemQuantity(productId, 0); 
  };
  
  const clearCart = async () => {
    setLoading(true);
    try {
      const clearPromises = cartItems.map(item => 
        updateCart({ productId: item.productId, quantity: 0 })
      );
      await Promise.all(clearPromises);
      await refreshCart(); 
    } catch (err) {
        console.error("Error clearing cart:", err);
        setError("Could not clear the cart.");
    } finally {
        setLoading(false);
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal, 
    loading,
    error,
    addToCart,
    updateItemQuantity, 
    removeItem, 
    clearCart, 
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};