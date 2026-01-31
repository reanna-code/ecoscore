import admin from 'firebase-admin';

export function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Initialize with environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin initialized');
    return admin.app();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('⚠️  Server will run without Firebase auth verification');
  }
}

export { admin };
