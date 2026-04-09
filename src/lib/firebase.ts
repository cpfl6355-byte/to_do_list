import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Default config structure
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'default';

// Re-implementing with a more robust check for AI Studio vs Vercel
// We use import.meta.glob for a safe optional import that won't break the build if the file is missing
const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig = (configs['../../firebase-applet-config.json'] as any)?.default || {};

const finalConfig = import.meta.env.VITE_FIREBASE_API_KEY 
  ? firebaseConfig 
  : localConfig;

const finalDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId || 'default';

const app = getApps().length > 0 ? getApp() : initializeApp(finalConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, finalDbId);
export const googleProvider = new GoogleAuthProvider();

// Test connection to Firestore
async function testConnection() {
  if (!finalConfig.apiKey) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: Client is offline.");
    }
  }
}
testConnection();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
