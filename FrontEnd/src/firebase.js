import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDcR0n1_giJmXQg97fFI-QemSYC1HN0NWY",
  authDomain: "echo--eats.firebaseapp.com",
  projectId: "echo--eats",
  storageBucket: "echo--eats.firebasestorage.app",
  messagingSenderId: "161502213880",
  appId: "1:161502213880:web:c02174ad08f5f3633ced0d",
  measurementId: "G-9HEB53H8FC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Analytics is optional and can cause issues in serverless if not handled correctly
// but I will export it just in case.
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
