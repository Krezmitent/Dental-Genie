/* =============================================================================
 * server.js
 * Main entry point for the Dental Diagnosis Backend API.
 * Initializes Express with security middleware (Helmet, CORS, Rate Limiting,
 * Morgan), connects to MongoDB, mounts API routes, and starts the HTTP server.
 * ========================================================================== */

/* ── Load environment variables FIRST ─────────────────────────────────────── */
const dotenv = require('dotenv');
dotenv.config();

// Workaround for Node 18/20 IPv6 fetch "Premature close" bugs with Google APIs
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { db, bucket } = require('./config/firebase');

const CONTEXT = 'server';

/* ── Initialize Express application ───────────────────────────────────────── */
const app = express();

/* ==========================================================================
 * MIDDLEWARE STACK
 * ========================================================================== */

/* ── 1. Helmet: Set security-related HTTP headers ─────────────────────────── */
app.use(helmet());
logger.info(CONTEXT, 'Helmet security headers enabled.');

/* ── 2. CORS: Configure Cross-Origin Resource Sharing ─────────────────────── */
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(CONTEXT, `Blocked CORS request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
logger.info(CONTEXT, 'CORS configured.', { allowedOrigins });

/* ── 3. Rate Limiting: Protect against brute-force attacks ────────────────── */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(CONTEXT, 'Rate limit exceeded.', { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});
app.use('/api/', limiter);
logger.info(CONTEXT, 'Rate limiting enabled on /api/ routes.');

/* ── 4. Morgan: HTTP request logging ──────────────────────────────────────── */
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));
logger.info(CONTEXT, `Morgan HTTP logger enabled (format: ${morganFormat}).`);

/* ── 5. Body parsers ──────────────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
logger.info(CONTEXT, 'Body parsers configured (JSON & URL-encoded, 10mb limit).');

/* ==========================================================================
 * HEALTH CHECK ROUTE
 * ========================================================================== */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dental Diagnosis API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

/* ==========================================================================
 * API ROUTE MOUNTING
 * ========================================================================== */

/* ── Phase 2: Auth & Diagnose routes ──────────────────────────────────────── */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/diagnose', require('./routes/diagnoseRoutes'));
logger.info(CONTEXT, 'Auth and Diagnose routes mounted.');

/* ── Phase 3: Business logic routes ───────────────────────────────────────── */
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
logger.info(CONTEXT, 'Appointments, Prescriptions, and Users routes mounted.');

/* ==========================================================================
 * 404 HANDLER — Unmatched Routes
 * ========================================================================== */
app.use((req, res) => {
  logger.warn(CONTEXT, `404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ==========================================================================
 * GLOBAL ERROR HANDLER
 * ========================================================================== */
app.use((err, req, res, _next) => {
  logger.error(CONTEXT, 'Unhandled error caught by global error handler.', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  /* ── Handle specific error types ────────────────────────────────────────── */

  // Firebase/Firestore errors can be handled here if needed
  if (err.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired.',
    });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked.',
    });
  }

  // Default: Internal server error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error.'
        : err.message,
  });
});

/* ==========================================================================
 * UNHANDLED REJECTION & EXCEPTION SAFETY NETS
 * ========================================================================== */
process.on('unhandledRejection', (reason, promise) => {
  logger.error(CONTEXT, 'Unhandled Promise Rejection.', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (error) => {
  logger.error(CONTEXT, 'Uncaught Exception. Shutting down...', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

/* ==========================================================================
 * START SERVER
 * ========================================================================== */
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  try {
    // 1. Firebase is initialized synchronously via config/firebase
    if (!db || !bucket) {
      logger.warn(CONTEXT, 'Firebase failed to initialize or missing credentials. Some routes may fail.');
    }

    // 2. Start listening for HTTP requests
    const server = app.listen(PORT, () => {
      logger.info(CONTEXT, `Server started successfully.`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });
      logger.info(CONTEXT, `Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown for the HTTP server
    const shutdownServer = (signal) => {
      logger.info(CONTEXT, `${signal} received. Closing HTTP server...`);
      server.close(() => {
        logger.info(CONTEXT, 'HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdownServer('SIGINT'));
    process.on('SIGTERM', () => shutdownServer('SIGTERM'));
  } catch (error) {
    logger.error(CONTEXT, 'Failed to start server.', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();

module.exports = app; // Export for testing
