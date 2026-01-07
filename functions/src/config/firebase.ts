import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Admin SDK
// Initialize Admin SDK
const serviceAccountPath = path.join(__dirname, '../..', 'serviceAccountKey.json');
const fs = require('fs');

let serviceAccount: any = null;

// Try to load key unconditionally (for both Prod and Emulator)
if (fs.existsSync(serviceAccountPath)) {
    try {
        serviceAccount = require(serviceAccountPath);
        console.log('🔑 Found serviceAccountKey.json');
    } catch (e) {
        console.warn('⚠️ Found key but could not require it');
    }
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'echo-1928rn.firebasestorage.app'
        });
        console.log('✅ Admin SDK initialized with Service Account Key');
    } catch (err) {
        // Warning: if app already exists, this might throw.
        if (!admin.apps.length) admin.initializeApp();
    }
} else {
    // Fallback to ADC
    if (!admin.apps.length) {
        admin.initializeApp();
        console.log('✅ Admin SDK initialized with ADC');
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
