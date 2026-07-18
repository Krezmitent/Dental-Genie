/* =============================================================================
 * middleware/roleMiddleware.js
 * Role-Based Access Control (RBAC) middleware.
 * Restricts access to routes based on the authenticated user's role.
 * Must be used AFTER authMiddleware.protect.
 * ========================================================================== */

const logger = require('../utils/logger');

const CONTEXT = 'middleware/role';

/**
 * Factory function that returns middleware restricting access to specified roles.
 *
 * @param  {...string} allowedRoles - One or more roles that may access the route.
 *                                    Valid values: 'patient', 'dentist', 'admin'.
 * @returns {Function} Express middleware function.
 *
 * @example
 *   // Only admins
 *   router.get('/admin/dashboard', protect, authorize('admin'), handler);
 *
 *   // Dentists and admins
 *   router.get('/patients', protect, authorize('dentist', 'admin'), handler);
 */
function authorize(...allowedRoles) {
  /* ── Validate that at least one role was passed ─────────────────────────── */
  if (allowedRoles.length === 0) {
    throw new Error(
      'authorize() middleware requires at least one role argument.'
    );
  }

  const validRoles = ['patient', 'dentist', 'admin'];
  const invalidRoles = allowedRoles.filter((r) => !validRoles.includes(r));
  if (invalidRoles.length > 0) {
    throw new Error(
      `authorize() received invalid role(s): ${invalidRoles.join(', ')}. ` +
      `Valid roles are: ${validRoles.join(', ')}.`
    );
  }

  return (req, res, next) => {
    /* ── Ensure authMiddleware has run first ──────────────────────────────── */
    if (!req.user) {
      logger.error(
        CONTEXT,
        'authorize() called without prior authentication. Ensure protect() runs first.'
      );
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: missing authentication context.',
      });
    }

    const userRole = req.user.role;

    /* ── Check if the user's role is in the allowed list ──────────────────── */
    if (!allowedRoles.includes(userRole)) {
      logger.warn(CONTEXT, 'Access denied — insufficient role.', {
        userId: req.user._id,
        userRole,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        method: req.method,
      });
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}.`,
      });
    }

    logger.debug(CONTEXT, 'Role authorization passed.', {
      userId: req.user._id,
      role: userRole,
      allowedRoles,
    });

    return next();
  };
}

module.exports = { authorize };
