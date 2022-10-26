import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDW8-xRAac-BqQ7VN-Uke_5foA-vCgTRBA",
    authDomain: "mavies-a577b.firebaseapp.com",
    projectId: "mavies-a577b",
    storageBucket: "mavies-a577b.appspot.com",
    messagingSenderId: "432043639886",
    appId: "1:432043639886:web:27c3c98ee298d84b08ef1f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore();
const auth = getAuth();

export default app;
export { auth, db };
