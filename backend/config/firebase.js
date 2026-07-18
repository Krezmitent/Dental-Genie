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

    // Priority 1: Base64-encoded service account (most reliable - immune to escaping issues)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
        credentialParams = JSON.parse(decoded);
        logger.info(CONTEXT, 'Using FIREBASE_SERVICE_ACCOUNT_BASE64 env var.');
      } catch (parseError) {
        logger.error(CONTEXT, 'Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', { message: parseError.message });
        return { db: null, bucket: null, admin: null };
      }
    }
    // Priority 2: Entire service account JSON as a single env var
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        credentialParams = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        logger.info(CONTEXT, 'Using FIREBASE_SERVICE_ACCOUNT_JSON env var.');
      } catch (parseError) {
        logger.error(CONTEXT, 'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', { message: parseError.message });
        return { db: null, bucket: null, admin: null };
      }
    }
    // Priority 2: Individual env vars
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      // Strip surrounding quotes if accidentally pasted
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      // Replace escaped newline characters
      privateKey = privateKey.replace(/\\n/g, '\n');

      credentialParams = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      };
      logger.info(CONTEXT, 'Using individual Firebase env vars.');
    }
    // Priority 3: Local JSON file (Development)
    else {
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      if (!fs.existsSync(serviceAccountPath)) {
        logger.warn(CONTEXT, 'Firebase credentials missing! Set FIREBASE_SERVICE_ACCOUNT_JSON env var, or provide firebase-service-account.json locally.');
        return { db: null, bucket: null, admin: null };
      }
      credentialParams = require(serviceAccountPath);
      logger.info(CONTEXT, 'Using local firebase-service-account.json.');
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
