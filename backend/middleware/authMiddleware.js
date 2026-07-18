/* =============================================================================
 * middleware/authMiddleware.js
 * Firebase Auth token verification middleware.
 * ========================================================================== */

const { db, admin } = require('../config/firebase');
const logger = require('../utils/logger');

const CONTEXT = 'middleware/auth';

async function protect(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn(CONTEXT, 'Access denied — no token provided.', {
        ip: req.ip,
        url: req.originalUrl,
      });
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Firebase authentication token.',
      });
    }

    // Find the user in Firestore using the Firebase UID
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User profile does not exist in the database.',
      });
    }

    const user = { _id: userDoc.id, ...userDoc.data() };

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval by an administrator.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.error(CONTEXT, 'Unexpected error in auth middleware.', {
      message: error.message,
    });
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
    });
  }
}

module.exports = { protect };
