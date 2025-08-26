import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase Storage is optional and not used by default in this project.
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

// Secondary Firebase project initializer.
// Usage:
// 1. Create a Web App in the target Firebase console (e.g. english-voult-project).
// 2. Add its config values to your Vite env (.env) as:
//    VITE_FIREBASE2_API_KEY=...
//    VITE_FIREBASE2_AUTH_DOMAIN=...
//    VITE_FIREBASE2_PROJECT_ID=...
//    VITE_FIREBASE2_STORAGE_BUCKET=...
//    VITE_FIREBASE2_MESSAGING_SENDER_ID=...
//    VITE_FIREBASE2_APP_ID=...
//    VITE_FIREBASE2_MEASUREMENT_ID=...
// 3. Import services from this file where needed.

const firebase2Config = {
  apiKey: (import.meta.env.VITE_FIREBASE2_API_KEY as string) || "",
  authDomain: (import.meta.env.VITE_FIREBASE2_AUTH_DOMAIN as string) || "",
  projectId: (import.meta.env.VITE_FIREBASE2_PROJECT_ID as string) || "",
  storageBucket: (import.meta.env.VITE_FIREBASE2_STORAGE_BUCKET as string) || "",
  messagingSenderId: (import.meta.env.VITE_FIREBASE2_MESSAGING_SENDER_ID as string) || "",
  appId: (import.meta.env.VITE_FIREBASE2_APP_ID as string) || "",
  measurementId: (import.meta.env.VITE_FIREBASE2_MEASUREMENT_ID as string) || ""
};

// Avoid initializing twice in dev HMR
const appName = 'secondary';
let secondaryApp;
if (!getApps().some(a => a.name === appName)) {
  // If required config is missing, don't initialize an app to avoid runtime errors.
  const hasConfig = !!firebase2Config.apiKey && !!firebase2Config.projectId;
  if (hasConfig) {
    // name the app to keep it separate from the default app
    secondaryApp = initializeApp(firebase2Config, appName);
  } else {
    secondaryApp = null;
  }
} else {
  // find the already-initialized named app
  secondaryApp = getApps().find(a => a.name === appName) as any || null;
}

export const firebase2 = secondaryApp;

export const auth2 = secondaryApp ? getAuth(secondaryApp) : null;
export const db2 = secondaryApp ? getFirestore(secondaryApp) : null;
// storage2 intentionally not exported since Cloudinary is used for images.
export const realtimeDb2 = secondaryApp ? getDatabase(secondaryApp) : null;
export const functions2 = secondaryApp ? getFunctions(secondaryApp) : null;

export const analytics2 = typeof window !== 'undefined' && secondaryApp && firebase2Config.measurementId
  ? getAnalytics(secondaryApp)
  : null;

export const performance2 = typeof window !== 'undefined' && secondaryApp
  ? getPerformance(secondaryApp)
  : null;

// Helper boolean: true when the secondary project is configured
export const isSecondaryConfigured = !!secondaryApp;

// Example helper to get a user's document from the secondary Firestore (if needed):
// import { doc, getDoc } from 'firebase/firestore';
// export async function getSecondaryUser(uid: string) {
//   if (!db2) throw new Error('Secondary Firebase not configured');
//   const d = doc(db2, 'users', uid);
//   const snap = await getDoc(d);
//   return snap.exists() ? snap.data() : null;
// }

export default firebase2;
