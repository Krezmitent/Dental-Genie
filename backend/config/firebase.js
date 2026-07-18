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
    let credentialParams;

    // Check if environment variables are set (Production / Render)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credentialParams = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newline characters from environment variable string
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };
    } 
    // Fallback to local JSON file (Local Development)
    else {
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      if (!fs.existsSync(serviceAccountPath)) {
        logger.warn(CONTEXT, 'Firebase credentials missing! Neither ENV vars nor firebase-service-account.json found.');
        return { db: null, bucket: null, admin: null };
      }
      credentialParams = require(serviceAccountPath);
    }

    const storageBucketUrl = process.env.FIREBASE_STORAGE_BUCKET;

    const app = initializeApp({
      credential: cert(credentialParams),
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
