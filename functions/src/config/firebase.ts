import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Admin SDK
if (process.env.FUNCTIONS_EMULATOR) {
    // Running in emulator - use service account for prod access
    // __dirname in compiled code is 'lib/config/', so we need to go up to 'functions/'
    const serviceAccount = path.join(__dirname, '../..', 'serviceAccountKey.json');
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'echo-1928rn.firebasestorage.app'
        });
        console.log('✅ Admin SDK initialized with service account');
    } catch (err) {
        console.warn('⚠️ Service account key not found, using default init');
        admin.initializeApp();
    }
} else {
    // Production - use default
    admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
