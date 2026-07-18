/* =============================================================================
 * validators/prescriptionValidators.js
 * express-validator chains for prescription routes.
 * ========================================================================== */

const { body, param } = require('express-validator');

/* ── Create / Update Prescription ─────────────────────────────────────────── */
const createPrescriptionValidation = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required.')
    .isUUID(4)
    .withMessage('Patient ID must be a valid UUID v4.'),

  body('appointmentId')
    .optional()
    .isUUID(4)
    .withMessage('Appointment ID must be a valid UUID v4.'),

  body('diagnosisReportId')
    .optional()
    .isUUID(4)
    .withMessage('Diagnosis Report ID must be a valid UUID v4.'),

  body('medications')
    .isArray({ min: 1, max: 20 })
    .withMessage('Medications must be an array with 1 to 20 entries.'),

  body('medications.*.name')
    .trim()
    .notEmpty()
    .withMessage('Each medication must have a name.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Medication name must be between 2 and 200 characters.'),

  body('medications.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Each medication must have a dosage.')
    .isLength({ max: 100 })
    .withMessage('Dosage cannot exceed 100 characters.'),

  body('medications.*.frequency')
    .notEmpty()
    .withMessage('Each medication must have a frequency.')
    .isIn([
      'once_daily',
      'twice_daily',
      'three_times_daily',
      'four_times_daily',
      'every_6_hours',
      'every_8_hours',
      'every_12_hours',
      'as_needed',
      'before_meals',
      'after_meals',
      'at_bedtime',
      'weekly',
      'custom',
    ])
    .withMessage('Invalid frequency value.'),

  body('medications.*.duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration cannot exceed 100 characters.'),

  body('medications.*.instructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions cannot exceed 500 characters.'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Diagnosis text cannot exceed 1000 characters.'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Remarks cannot exceed 2000 characters.'),

  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid ISO 8601 date.'),
];

/* ── Update Prescription ──────────────────────────────────────────────────── */
const updatePrescriptionValidation = [
  param('id')
    .isUUID(4)
    .withMessage('Prescription ID must be a valid UUID v4.'),

  body('medications')
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage('Medications must be an array with 1 to 20 entries.'),

  body('medications.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medication name cannot be empty.')
    .isLength({ min: 2, max: 200 })
    .withMessage('Medication name must be between 2 and 200 characters.'),

  body('medications.*.dosage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Dosage cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Dosage cannot exceed 100 characters.'),

  body('medications.*.frequency')
    .optional()
    .isIn([
      'once_daily',
      'twice_daily',
      'three_times_daily',
      'four_times_daily',
      'every_6_hours',
      'every_8_hours',
      'every_12_hours',
      'as_needed',
      'before_meals',
      'after_meals',
      'at_bedtime',
      'weekly',
      'custom',
    ])
    .withMessage('Invalid frequency value.'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Diagnosis text cannot exceed 1000 characters.'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Remarks cannot exceed 2000 characters.'),

  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid ISO 8601 date.'),
];

module.exports = {
  createPrescriptionValidation,
  updatePrescriptionValidation,
};
