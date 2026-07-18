/* =============================================================================
 * routes/userRoutes.js
 * User management and admin dashboard route definitions.
 * ========================================================================== */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/* ── All user routes require authentication ───────────────────────────────── */
router.use(protect);

/* ==========================================================================
 * GET /api/users/dentists/list
 * Public dentist directory (active, approved dentists).
 * Accessible by: patient, dentist, admin
 * NOTE: Must be ABOVE /:id routes.
 * ========================================================================== */
router.get(
  '/dentists/list',
  authorize('patient', 'dentist', 'admin'),
  userController.getDentistsList
);

/* ==========================================================================
 * GET /api/users/dashboard/stats
 * Admin dashboard statistics.
 * Accessible by: admin
 * ========================================================================== */
router.get(
  '/dashboard/stats',
  authorize('admin'),
  userController.getDashboardStats
);

/* ==========================================================================
 * GET /api/users
 * List all users with filtering.
 * Accessible by: admin
 * ========================================================================== */
router.get(
  '/',
  authorize('admin'),
  userController.getAllUsers
);

/* ==========================================================================
 * GET /api/users/:id
 * Get a single user profile.
 * Accessible by: admin, dentist (patient profiles only)
 * ========================================================================== */
router.get(
  '/:id',
  authorize('dentist', 'admin'),
  userController.getUserById
);

/* ==========================================================================
 * PUT /api/users/:id/approve
 * Approve a user account.
 * Accessible by: admin
 * ========================================================================== */
router.put(
  '/:id/approve',
  authorize('admin'),
  userController.approveUser
);

/* ==========================================================================
 * PUT /api/users/:id/deactivate
 * Deactivate a user account.
 * Accessible by: admin
 * ========================================================================== */
router.put(
  '/:id/deactivate',
  authorize('admin'),
  userController.deactivateUser
);

/* ==========================================================================
 * PUT /api/users/:id/activate
 * Re-activate a user account.
 * Accessible by: admin
 * ========================================================================== */
router.put(
  '/:id/activate',
  authorize('admin'),
  userController.activateUser
);

/* ==========================================================================
 * GET /api/users/:id/medical-history
 * Get a patient's complete medical history.
 * Accessible by: patient (own), dentist, admin
 * ========================================================================== */
router.get(
  '/:id/medical-history',
  authorize('patient', 'dentist', 'admin'),
  userController.getPatientMedicalHistory
);

module.exports = router;
