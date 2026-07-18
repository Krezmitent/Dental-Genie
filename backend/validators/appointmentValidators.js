/* =============================================================================
 * validators/appointmentValidators.js
 * express-validator chains for appointment routes.
 * ========================================================================== */

const { body, param, query } = require('express-validator');

const VALID_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

const VALID_STATUSES = ['pending', 'approved', 'completed', 'cancelled'];

const createAppointmentValidation = [
  body('dentistId')
    .notEmpty()
    .withMessage('Dentist ID is required.')
    .isString()
    .withMessage('Dentist ID must be a valid string.'),

  body('date')
    .notEmpty()
    .withMessage('Appointment date is required.')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string (e.g. 2026-08-15).'),

  body('timeSlot')
    .notEmpty()
    .withMessage('Time slot is required.')
    .isIn(VALID_TIME_SLOTS)
    .withMessage(
      `Invalid time slot. Valid slots: ${VALID_TIME_SLOTS.join(', ')}`
    ),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters.'),
];

const updateStatusValidation = [
  param('id')
    .isUUID(4)
    .withMessage('Appointment ID must be a valid UUID v4.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(VALID_STATUSES)
    .withMessage(
      `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}`
    ),

  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters.'),
];

const availabilityValidation = [
  query('dentistId')
    .notEmpty()
    .withMessage('Dentist ID query parameter is required.')
    .isString()
    .withMessage('Dentist ID must be a valid string.'),

  query('date')
    .notEmpty()
    .withMessage('Date query parameter is required.')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string.'),
];

module.exports = {
  createAppointmentValidation,
  updateStatusValidation,
  availabilityValidation,
};
