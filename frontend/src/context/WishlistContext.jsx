import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, functions } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const toggleWishlistItem = httpsCallable(functions, 'toggleWishlistItem');

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    if (currentUser) {
      setLoading(true);
      const wishlistRef = collection(db, `users/${currentUser.uid}/wishlist`);
      unsubscribe = onSnapshot(wishlistRef, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.id);
        setWishlist(ids);
        setLoading(false);
      });
    } else {
      setWishlist([]);
      setLoading(false);
    }
    return () => unsubscribe();
  }, [currentUser]);

  const toggleItem = async (productId) => {
    const isInWishlist = wishlist.includes(productId);
    if (isInWishlist) {
      setWishlist(prev => prev.filter(id => id !== productId));
    } else {
      setWishlist(prev => [...prev, productId]);
    }

    try {
      await toggleWishlistItem({ productId });
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      if (isInWishlist) {
        setWishlist(prev => [...prev, productId]);
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
      }
    }
  };

  const value = {
    wishlist,
    toggleItem,
    loading,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}