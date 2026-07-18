/* =============================================================================
 * utils/logger.js
 * Centralized logging utility for the Dental Diagnosis backend.
 * Provides structured, timestamped log output with severity levels.
 * ========================================================================== */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Formats a log message with a timestamp and severity tag.
 * @param {string} level  - One of ERROR, WARN, INFO, DEBUG
 * @param {string} context - Module or function name producing the log
 * @param {string} message - Human-readable log message
 * @param {object|null} meta - Optional metadata object to include
 * @returns {string} The formatted log line
 */
function formatLogMessage(level, context, message, meta) {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | meta=${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] [${context}] ${message}${metaString}`;
}

const logger = {
  /**
   * Log an informational message.
   * @param {string} context - Module or function name
   * @param {string} message - Log message
   * @param {object} [meta] - Optional metadata
   */
  info(context, message, meta = null) {
    console.log(formatLogMessage(LOG_LEVELS.INFO, context, message, meta));
  },

  /**
   * Log a warning message.
   * @param {string} context - Module or function name
   * @param {string} message - Log message
   * @param {object} [meta] - Optional metadata
   */
  warn(context, message, meta = null) {
    console.warn(formatLogMessage(LOG_LEVELS.WARN, context, message, meta));
  },

  /**
   * Log an error message.
   * @param {string} context - Module or function name
   * @param {string} message - Log message
   * @param {object} [meta] - Optional metadata (e.g. error stack)
   */
  error(context, message, meta = null) {
    console.error(formatLogMessage(LOG_LEVELS.ERROR, context, message, meta));
  },

  /**
   * Log a debug message. Only outputs when NODE_ENV is not 'production'.
   * @param {string} context - Module or function name
   * @param {string} message - Log message
   * @param {object} [meta] - Optional metadata
   */
  debug(context, message, meta = null) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLogMessage(LOG_LEVELS.DEBUG, context, message, meta));
    }
  },
};

module.exports = logger;
