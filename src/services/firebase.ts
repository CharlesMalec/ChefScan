import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Remplacez les valeurs entre guillemets par celles de votre console Firebase
  // (Paramètres du projet > Général > Vos applications > SDK setup and configuration)
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyBw15vzE2Sr4Xt67-NFx6LA4klcOleudA0",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "chefscan-5468f.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "chefscan-5468f",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "chefscan-5468f.firebasestorage.app", // ou .firebasestorage.app
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "574738795338",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:574738795338:web:f4913fbd00be9f7857cfb3",
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || "G-M4LJNG7K14"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
