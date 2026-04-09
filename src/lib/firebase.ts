import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Try to load from environment variables first (Vercel/Production)
// Fallback to the local config file if environment variables are missing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'default';

// If environment variables are missing, try to load from the local config file
// This is mainly for the AI Studio preview environment
let finalConfig = firebaseConfig;
let finalDatabaseId = firestoreDatabaseId;

if (!firebaseConfig.apiKey) {
  try {
    // @ts-ignore - This file might not exist in all environments
    import('../../firebase-applet-config.json').then((config) => {
      const app = initializeApp(config.default);
      // We need to re-initialize if we're using the fallback
      // But since this is async, it's better to just handle it synchronously if possible
      // or provide a clear error.
    });
    // For simplicity in this environment, we'll keep the synchronous import for now
    // but the environment variables are the preferred way for Vercel.
  } catch (e) {
    console.error("Firebase configuration missing. Please set VITE_FIREBASE_* environment variables.");
  }
}

// Re-implementing with a more robust check for AI Studio vs Vercel
import localConfig from '../../firebase-applet-config.json';

const configToUse = import.meta.env.VITE_FIREBASE_API_KEY 
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : localConfig;

const dbIdToUse = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId || 'default';

const app = initializeApp(configToUse);
export const auth = getAuth(app);
export const db = getFirestore(app, dbIdToUse);
export const googleProvider = new GoogleAuthProvider();

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
