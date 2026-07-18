/* =============================================================================
 * routes/prescriptionRoutes.js
 * Prescription route definitions with authentication and RBAC middleware.
 * ========================================================================== */

const express = require('express');
const router = express.Router();

const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createPrescriptionValidation,
  updatePrescriptionValidation,
} = require('../validators/prescriptionValidators');

/* ── All prescription routes require authentication ───────────────────────── */
router.use(protect);

/* ==========================================================================
 * GET /api/prescriptions/patient/:patientId
 * Get all prescriptions for a specific patient.
 * Accessible by: patient (own), dentist, admin
 * NOTE: Must be ABOVE /:id to prevent matching "patient" as an ID.
 * ========================================================================== */
router.get(
  '/patient/:patientId',
  authorize('patient', 'dentist', 'admin'),
  prescriptionController.getPatientPrescriptions
);

/* ==========================================================================
 * GET /api/prescriptions
 * List prescriptions (role-based filtering applied in controller).
 * Accessible by: patient, dentist, admin
 * ========================================================================== */
router.get(
  '/',
  authorize('patient', 'dentist', 'admin'),
  prescriptionController.getPrescriptions
);

/* ==========================================================================
 * POST /api/prescriptions
 * Create a new prescription.
 * Accessible by: dentist, admin
 * ========================================================================== */
router.post(
  '/',
  authorize('dentist', 'admin'),
  createPrescriptionValidation,
  prescriptionController.createPrescription
);

/* ==========================================================================
 * GET /api/prescriptions/:id
 * Get a single prescription.
 * Accessible by: patient, dentist, admin (ownership enforced in controller)
 * ========================================================================== */
router.get(
  '/:id',
  authorize('patient', 'dentist', 'admin'),
  prescriptionController.getPrescriptionById
);

/* ==========================================================================
 * PUT /api/prescriptions/:id
 * Update a prescription.
 * Accessible by: dentist (author only), admin
 * ========================================================================== */
router.put(
  '/:id',
  authorize('dentist', 'admin'),
  updatePrescriptionValidation,
  prescriptionController.updatePrescription
);

/* ==========================================================================
 * DELETE /api/prescriptions/:id
 * Soft-delete a prescription.
 * Accessible by: dentist (author only), admin
 * ========================================================================== */
router.delete(
  '/:id',
  authorize('dentist', 'admin'),
  prescriptionController.deletePrescription
);

module.exports = router;
