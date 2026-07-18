/* =============================================================================
 * validators/authValidators.js
 * express-validator validation chains for authentication routes.
 * ========================================================================== */

const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.'),
  
  body('role')
    .optional()
    .trim()
    .isIn(['patient', 'dentist'])
    .withMessage(
      'Role must be either "patient" or "dentist". Admin accounts cannot be self-registered.'
    ),
];

const loginValidation = [
  // Email and password are no longer validated here, as Firebase Auth handles them on the client.
  // The backend just expects a valid Bearer token in the headers.
];

module.exports = {
  registerValidation,
  loginValidation,
};
