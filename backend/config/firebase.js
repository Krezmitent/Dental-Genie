const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getAuth } = require('firebase-admin/auth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const CONTEXT = 'config/firebase';

function initializeFirebase() {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    const storageBucketUrl = process.env.FIREBASE_STORAGE_BUCKET;

    if (!fs.existsSync(serviceAccountPath)) {
      logger.warn(CONTEXT, 'firebase-service-account.json is missing!');
      return { db: null, bucket: null, admin: null };
    }

    const app = initializeApp({
      credential: cert(require(serviceAccountPath)),
      storageBucket: storageBucketUrl || 'your-project-id.appspot.com'
    });

    logger.info(CONTEXT, 'Firebase Admin initialized successfully.');
    
    const db = getFirestore(app);
    const bucket = getStorage(app).bucket();
    const adminAuth = getAuth(app);
    
    // Create a mock admin object to maintain compatibility with existing controllers
    const adminMock = {
      auth: () => adminAuth,
      firestore: () => db,
      storage: () => ({ bucket: () => bucket })
    };
    
    return { db, bucket, admin: adminMock };
  } catch (error) {
    logger.error(CONTEXT, 'Failed to initialize Firebase Admin.', {
      message: error.message
    });
    return { db: null, bucket: null, admin: null };
  }
}

const firebaseInstances = initializeFirebase();

module.exports = firebaseInstances;
