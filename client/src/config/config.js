import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize App Once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth Instance
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();

// Phone Auth Helpers
export const setupRecaptcha = (containerId) => {
  // Ensure container exists before instantiating
  if (typeof window === "undefined") return null;
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
};

export const sendOTP = async (phone, recaptchaVerifier) => {
  return await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
};

export default app;
