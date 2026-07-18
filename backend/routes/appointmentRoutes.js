/* =============================================================================
 * routes/appointmentRoutes.js
 * Appointment route definitions with authentication and RBAC middleware.
 * ========================================================================== */

const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createAppointmentValidation,
  updateStatusValidation,
  availabilityValidation,
} = require('../validators/appointmentValidators');

/* ── All appointment routes require authentication ────────────────────────── */
router.use(protect);

/* ==========================================================================
 * GET /api/appointments/availability?dentistId=...&date=...
 * Check dentist availability for a given date.
 * Accessible by: patient, dentist, admin
 * NOTE: This must be ABOVE the /:id route to avoid matching "availability" as an ID.
 * ========================================================================== */
router.get(
  '/availability',
  authorize('patient', 'dentist', 'admin'),
  availabilityValidation,
  appointmentController.checkAvailability
);

/* ==========================================================================
 * GET /api/appointments/my-calendar?startDate=...&endDate=...
 * Dentist calendar view.
 * Accessible by: dentist
 * ========================================================================== */
router.get(
  '/my-calendar',
  authorize('dentist'),
  appointmentController.getDentistCalendar
);

/* ==========================================================================
 * GET /api/appointments
 * List appointments (role-based filtering applied in controller).
 * Accessible by: patient, dentist, admin
 * ========================================================================== */
router.get(
  '/',
  authorize('patient', 'dentist', 'admin'),
  appointmentController.getAppointments
);

/* ==========================================================================
 * POST /api/appointments
 * Book a new appointment.
 * Accessible by: patient
 * ========================================================================== */
router.post(
  '/',
  authorize('patient'),
  createAppointmentValidation,
  appointmentController.createAppointment
);

/* ==========================================================================
 * GET /api/appointments/:id
 * Get a single appointment.
 * Accessible by: patient, dentist, admin (ownership enforced in controller)
 * ========================================================================== */
router.get(
  '/:id',
  authorize('patient', 'dentist', 'admin'),
  appointmentController.getAppointmentById
);

/* ==========================================================================
 * PUT /api/appointments/:id/status
 * Update appointment status.
 * Accessible by: patient (cancel only), dentist (approve/complete/cancel), admin (all)
 * ========================================================================== */
router.put(
  '/:id/status',
  authorize('patient', 'dentist', 'admin'),
  updateStatusValidation,
  appointmentController.updateAppointmentStatus
);

module.exports = router;
