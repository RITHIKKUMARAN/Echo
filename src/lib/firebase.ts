import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC88Eau0Kd94gi-JUyyk7p6BGfX2TL8YQ4",
    authDomain: "echo-1928rn.firebaseapp.com",
    projectId: "echo-1928rn",
    storageBucket: "echo-1928rn.firebasestorage.app",
    messagingSenderId: "172082260714",
    appId: "1:172082260714:web:02874136f8f533a1e1b123"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable Emulators in Development
// NOTE: We are switching to HYBRID mode (Local Functions + Real Firestore/Storage)
// because local emulators are unstable on this machine.
/*
if (process.env.NODE_ENV === 'development') {
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    console.log('Connected to Firestore & Storage Emulators');
}
*/

export { auth, db, storage };
