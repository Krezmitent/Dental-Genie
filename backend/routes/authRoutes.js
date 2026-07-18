/* =============================================================================
 * routes/authRoutes.js
 * Authentication route definitions.
 * Maps HTTP endpoints to auth controller methods with validation middleware.
 * ========================================================================== */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
} = require('../validators/authValidators');

/* ── Public routes ────────────────────────────────────────────────────────── */

/**
 * POST /api/auth/register
 * Register a new user (patient or dentist).
 */
router.post('/register', registerValidation, authController.register);

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 */
router.post('/login', loginValidation, authController.login);

/* ── Protected routes ─────────────────────────────────────────────────────── */

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile.
 */
router.get('/me', protect, authController.getMe);

/**
 * PUT /api/auth/profile
 * Update the currently authenticated user's profile.
 */
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
