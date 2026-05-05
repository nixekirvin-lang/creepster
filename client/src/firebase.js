import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDQ9NnSU135DCGgnVADRJ5TWpxD7P0MUXc",
  authDomain: "creepster-6cf9f.firebaseapp.com",
  projectId: "creepster-6cf9f",
  storageBucket: "creepster-6cf9f.firebasestorage.app",
  messagingSenderId: "37115012031",
  appId: "1:37115012031:web:12300a287c3e6cccbab70a"
};

let auth = null;
let googleProvider = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.warn('Firebase init failed:', e.message);
}

export { auth, googleProvider };
