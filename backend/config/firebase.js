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
    if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_PRIVATE_KEY) {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        logger.error(CONTEXT, 'INCOMPLETE ENVIRONMENT VARIABLES! You must set all three: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
      }

      let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
      // Strip surrounding quotes if user accidentally pasted them
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
      if (clientEmail.startsWith('"') && clientEmail.endsWith('"')) {
        clientEmail = clientEmail.slice(1, -1);
      }

      credentialParams = {
        projectId: (process.env.FIREBASE_PROJECT_ID || '').replace(/^"|"$/g, ''),
        clientEmail: clientEmail,
        // Replace escaped newline characters from environment variable string
        privateKey: privateKey.replace(/\\n/g, '\n')
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
