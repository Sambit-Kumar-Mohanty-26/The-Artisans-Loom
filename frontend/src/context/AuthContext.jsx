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
  const [userRole, setUserRole] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      setLoading(false);
      if (user && user.uid) {
        setLoadingUserData(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setOnboardingComplete(userData.onboardingComplete || false);
        } else {
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

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && result.user.uid) {
          const user = result.user;
          const storedUserType = localStorage.getItem('googleSignInUserType');
          localStorage.removeItem('googleSignInUserType');
          await ensureUserProfile(user, storedUserType || 'customer');
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
  async function loginWithGoogle(role) {
    const provider = new GoogleAuthProvider();
    
    if (isMobileDevice()) {
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
    setUserRole(role);
    setOnboardingComplete(false);
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserRole(null);
    setOnboardingComplete(false);
    return signOut(auth);
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    userRole,
    onboardingComplete,
    loadingUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
