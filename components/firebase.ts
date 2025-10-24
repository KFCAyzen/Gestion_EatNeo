import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Configuration Firebase avec variables d'environnement
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC0n-zUpXRsL9FG2dyqdk0oMuqq8lPch3E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "menu-et-gestion-stock-ea-14886.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "menu-et-gestion-stock-ea-14886",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "menu-et-gestion-stock-ea-14886.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "272091105731",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:272091105731:web:e51848386c3b424df6d576",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-JBP1PZWH4P"
};

// Initialisation Firebase (évite les doublons)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Services Firebase
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, db, storage, auth };
export default app;