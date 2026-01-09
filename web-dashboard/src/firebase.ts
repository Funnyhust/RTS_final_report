import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DB_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

type FirebaseConfigKey = keyof typeof firebaseConfig;

export let db: ReturnType<typeof getDatabase> | null = null;
export let firebaseInitError: unknown = null;

try {
  const missingKeys = (Object.keys(firebaseConfig) as FirebaseConfigKey[]).filter(
    (key) => !firebaseConfig[key]
  );
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missingKeys.join(", ")}`);
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log("Firebase init OK:", firebaseConfig.databaseURL);
} catch (error) {
  firebaseInitError = error;
  console.error("Firebase init FAILED:", error);
}
