import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {

  apiKey: "AIzaSyBSwVZ6kvj7C3JGFh2hyUPm_Q8eTqacTpY",
  authDomain: "annular-climate-469215-m0.firebaseapp.com",
  projectId: "annular-climate-469215-m0",
  storageBucket: "annular-climate-469215-m0.firebasestorage.app",
  messagingSenderId: "300490562064",
  appId: "1:300490562064:web:27d3884877908749fc8895",
  measurementId: "G-BFCXSB23YP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const functions = getFunctions(app);
const auth = getAuth(app);
const db = getFirestore(app); 
const storage = getStorage(app); 

export { functions, auth, db, storage };