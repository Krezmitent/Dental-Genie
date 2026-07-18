/* =============================================================================
 * controllers/authController.js
 * Handles syncing Firebase Auth users with Firestore profiles.
 * ========================================================================== */

const { db, admin } = require('../config/firebase');
const logger = require('../utils/logger');

const CONTEXT = 'controllers/auth';

function toSafeObject(user) {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

async function register(req, res) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token provided.' });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      logger.error(CONTEXT, 'Token verification failed in register:', { error: authError.message });
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token. ' + authError.message });
    }

    const { name, role } = req.body;
    // For Google OAuth, email is in the token. For email/password, it is also in the token.
    const email = decodedToken.email.toLowerCase();
    const uid = decodedToken.uid;

    const usersRef = db.collection('users');
    const userDoc = await usersRef.doc(uid).get();

    if (userDoc.exists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const userRole = role || 'patient';
    const isApproved = true; // Auto-approve all roles so dentists show up immediately

    const newUser = {
      _id: uid,
      name: name || decodedToken.name || 'Anonymous User',
      email: email,
      role: userRole,
      isActive: true,
      isApproved,
      profile: {
        avatarUrl: decodedToken.picture || '',
        ...(req.body.profile || {})
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await usersRef.doc(uid).set(newUser);

    let message = isApproved ? 'Registration successful.' : 'Registration successful. Your account is pending approval.';

    return res.status(201).json({
      success: true,
      message,
      data: {
        user: toSafeObject(newUser),
      },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error during registration.', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again. Debug: ' + error.message,
    });
  }
}

async function login(req, res) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token provided.' });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      logger.error(CONTEXT, 'Token verification failed in login:', { error: authError.message });
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token. ' + authError.message });
    }

    const usersRef = db.collection('users');
    const userDoc = await usersRef.doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User account not found in database. Please register first.',
      });
    }

    const user = { _id: userDoc.id, ...userDoc.data() };

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval by an administrator.',
      });
    }

    await usersRef.doc(user._id).update({ lastLogin: new Date().toISOString() });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: toSafeObject(user)
      },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error during login.', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again. Debug: ' + error.message,
    });
  }
}

async function getMe(req, res) {
  try {
    const userDoc = await db.collection('users').doc(req.user._id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = { _id: userDoc.id, ...userDoc.data() };
    return res.status(200).json({
      success: true,
      data: { user: toSafeObject(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
}

async function updateProfile(req, res) {
  try {
    const allowedFields = [
      'name',
      'profile.phone',
      'profile.address',
      'profile.dateOfBirth',
      'profile.gender',
      'profile.avatarUrl',
      'profile.specialization',
      'profile.licenseNumber',
    ];

    const updates = {};
    for (const field of allowedFields) {
      const keys = field.split('.');
      let value;
      if (keys.length === 1) {
        value = req.body[keys[0]];
      } else if (keys.length === 2 && req.body[keys[0]]) {
        value = req.body[keys[0]][keys[1]];
      }
      if (value !== undefined) {
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    updates.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.user._id).update(updates);

    const updatedDoc = await db.collection('users').doc(req.user._id).get();
    const updatedUser = { _id: updatedDoc.id, ...updatedDoc.data() };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: toSafeObject(updatedUser) },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error updating profile.', { message: error.message });
    return res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
}

module.exports = { register, login, getMe, updateProfile };
