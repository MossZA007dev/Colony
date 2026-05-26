import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCigtEYIhIKucLeBncf2GOImG3zRcv8jgs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'colony-7778e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'colony-7778e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'colony-7778e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '383322306457',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:383322306457:web:1f3a86d37cdeb148b80508',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-YKS3LW2YM9',
};

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}
