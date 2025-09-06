import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,   
  getRedirectResult     
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ✅ Helper function to ensure user profile exists in Firestore
async function ensureUserProfile(user, role) {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      role: role, 
      createdAt: new Date(),
      onboardingComplete: false,
    });
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // New state for user role
  const [onboardingComplete, setOnboardingComplete] = useState(false); // New state for onboarding status
  const [loadingUserData, setLoadingUserData] = useState(false); // New state for loading user-specific data

  // Track auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        setLoadingUserData(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setOnboardingComplete(userData.onboardingComplete || false);
        } else {
          // If user document doesn't exist, default to 'customer' and not onboarded
          setUserRole('customer');
          setOnboardingComplete(false);
        }
        setLoadingUserData(false);
      } else {
        setUserRole(null);
        setOnboardingComplete(false);
      }
    });
    return unsubscribe;
  }, []);

  // Handle redirect result after Google login
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          // Retrieve stored role
          const storedUserType = localStorage.getItem('googleSignInUserType');
          localStorage.removeItem('googleSignInUserType');
          await ensureUserProfile(user, storedUserType || 'customer');
          // After ensuring profile, fetch the updated role and onboarding status
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            setOnboardingComplete(userData.onboardingComplete || false);
          }
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }
    };
    handleRedirectResult();
  }, []);

  // ✅ Google login (popup for desktop, redirect for mobile)
  async function loginWithGoogle(role) {
    const provider = new GoogleAuthProvider();
    
    if (isMobileDevice()) {
      // Store role for redirect flow
      localStorage.setItem('googleSignInUserType', role);
      return signInWithRedirect(auth, provider);
    } else {
      try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        await ensureUserProfile(user, role);
        return userCredential;
      } catch (error) {
        console.error("Error during Google sign-in with popup:", error);
        throw error;
      }
    }
  }

  // ✅ Email/password signup
  async function signup(email, password, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      createdAt: new Date(),
      onboardingComplete: false,
    });
    setUserRole(role); // Set role immediately after signup
    setOnboardingComplete(false); // Set onboarding status immediately after signup
    return userCredential;
  }

  // ✅ Email/password login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // ✅ Logout
  function logout() {
    setUserRole(null); // Clear role on logout
    setOnboardingComplete(false); // Clear onboarding status on logout
    return signOut(auth);
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    userRole, // Add userRole to context value
    onboardingComplete, // Add onboardingComplete to context value
    loadingUserData // Add loadingUserData to context value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
