/* =============================================================================
 * routes/diagnoseRoutes.js
 * Image upload and AI diagnosis routes using Firebase Storage and Firestore.
 * ========================================================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { db, bucket } = require('../config/firebase');
const aiService = require('../services/aiIntegrationService');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

const CONTEXT = 'routes/diagnose';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function populateReport(data) {
  const result = { ...data };
  if (data.patient) {
    const pSnap = await db.collection('users').doc(data.patient).get();
    if (pSnap.exists) {
      const p = pSnap.data();
      result.patient = { _id: pSnap.id, name: p.name, email: p.email, profile: p.profile };
    }
  }
  if (data.reviewedBy) {
    const rSnap = await db.collection('users').doc(data.reviewedBy).get();
    if (rSnap.exists) {
      const r = rSnap.data();
      result.reviewedBy = { _id: rSnap.id, name: r.name, email: r.email };
    }
  }
  return result;
}

const cloudinary = require('cloudinary').v2;

// Configure cloudinary using the env variables already present in backend/.env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post(
  '/upload',
  protect,
  authorize('patient', 'dentist', 'admin'),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, message: 'File too large. Maximum file size is 10 MB.' });
        }
        return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided.' });
      }

      let patientId = req.user._id;
      if (req.body.patientId && (req.user.role === 'dentist' || req.user.role === 'admin')) {
        patientId = req.body.patientId;
      }

      // Upload to Cloudinary via stream to avoid creating temporary files
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'dental-diagnosis',
          resource_type: 'image'
        },
        async (error, result) => {
          if (error) {
            logger.error(CONTEXT, 'Cloudinary upload error.', { message: error.message });
            return res.status(500).json({ success: false, message: 'Image upload failed. Error: ' + error.message });
          }

          try {
            const imageUrl = result.secure_url;
            const reportId = uuidv4();
            
            const report = {
              patient: patientId,
              imageUrl: imageUrl,
              imagePublicId: result.public_id,
              predictions: [],
              status: 'processing',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await db.collection('diagnosisReports').doc(reportId).set(report);
            report._id = reportId;

            // Trigger AI analysis asynchronously
            aiService.processReport(reportId, imageUrl).catch(e => {
              logger.error(CONTEXT, 'Background AI processing error', { message: e.message });
            });

            return res.status(201).json({
              success: true,
              message: 'Image uploaded successfully. AI analysis is being processed.',
              data: {
                report: {
                  _id: reportId,
                  imageUrl: report.imageUrl,
                  status: report.status,
                  createdAt: report.createdAt,
                },
              },
            });
          } catch (dbError) {
            logger.error(CONTEXT, 'Firestore save error after upload.', { message: dbError.message });
            return res.status(500).json({ success: false, message: 'Error saving report to database. ' + dbError.message });
          }
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (error) {
      logger.error(CONTEXT, 'Error in upload handler.', { message: error.message });
      return res.status(500).json({ success: false, message: 'Error processing uploaded image. ' + error.message });
    }
  }
);

router.get(
  '/reports',
  protect,
  authorize('patient', 'dentist', 'admin'),
  async (req, res) => {
    try {
      let query = db.collection('diagnosisReports');

      if (req.user.role === 'patient') {
        query = query.where('patient', '==', req.user._id);
      } else if (req.query.patientId) {
        query = query.where('patient', '==', req.query.patientId);
      }

      if (req.query.status) {
        query = query.where('status', '==', req.query.status);
      }

      const snap = await query.get();
      let reports = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
      const total = reports.length;
      
      const paginated = reports.slice((page - 1) * limit, page * limit);
      const populated = await Promise.all(paginated.map(r => populateReport(r)));

      return res.status(200).json({
        success: true,
        data: {
          reports: populated,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error retrieving diagnosis reports.' });
    }
  }
);

router.get(
  '/reports/:id',
  protect,
  authorize('patient', 'dentist', 'admin'),
  async (req, res) => {
    try {
      const snap = await db.collection('diagnosisReports').doc(req.params.id).get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Report not found.' });
      
      const report = { _id: snap.id, ...snap.data() };
      
      if (req.user.role === 'patient' && report.patient !== req.user._id) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const populated = await populateReport(report);
      return res.status(200).json({ success: true, data: { report: populated } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error retrieving report.' });
    }
  }
);

router.put(
  '/reports/:id/review',
  protect,
  authorize('dentist', 'admin'),
  async (req, res) => {
    try {
      const { dentistNotes } = req.body;
      if (!dentistNotes || typeof dentistNotes !== 'string' || dentistNotes.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Dentist notes required.' });
      }

      const rRef = db.collection('diagnosisReports').doc(req.params.id);
      const snap = await rRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Report not found.' });

      const updates = {
        dentistNotes: dentistNotes.trim(),
        reviewedBy: req.user._id,
        reviewedAt: new Date().toISOString(),
        status: 'reviewed',
        updatedAt: new Date().toISOString()
      };

      await rRef.update(updates);
      const populated = await populateReport({ _id: snap.id, ...snap.data(), ...updates });

      return res.status(200).json({ success: true, message: 'Reviewed successfully.', data: { report: populated } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error reviewing report.' });
    }
  }
);

router.get(
  '/ai-health',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const health = await aiService.checkHealth();
      return res.status(200).json({ success: true, data: health });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error checking AI health.' });
    }
  }
);

router.post(
  '/reports/:id/reanalyse',
  protect,
  authorize('dentist', 'admin'),
  async (req, res) => {
    try {
      const rRef = db.collection('diagnosisReports').doc(req.params.id);
      const snap = await rRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Report not found.' });
      
      const report = snap.data();
      if (report.status === 'completed' || report.status === 'reviewed') {
        return res.status(400).json({ success: false, message: `Report already ${report.status}.` });
      }

      const updates = {
        status: 'processing',
        predictions: [],
        dentistNotes: '',
        updatedAt: new Date().toISOString()
      };
      
      await rRef.update(updates);
      
      aiService.processReport(snap.id, report.imageUrl).catch(e => {});

      return res.status(200).json({
        success: true,
        message: 'Re-analysis triggered.',
        data: { report: { _id: snap.id, imageUrl: report.imageUrl, status: 'processing' } },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error triggering re-analysis.' });
    }
  }
);

router.post(
  '/reports/:id/chat',
  protect,
  authorize('patient', 'dentist', 'admin'),
  async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
      }

      const rRef = db.collection('diagnosisReports').doc(req.params.id);
      const snap = await rRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Report not found.' });
      
      const report = snap.data();
      
      if (req.user.role === 'patient' && report.patient !== req.user._id) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      const responseText = await geminiService.chatWithReport(report, message, history || []);

      return res.status(200).json({
        success: true,
        data: { text: responseText }
      });
    } catch (error) {
      logger.error(CONTEXT, 'Chat endpoint error', { message: error.message });
      return res.status(500).json({ success: false, message: 'Error processing chat message.' });
    }
  }
);

router.post(
  '/reports/:id/generate-pdf-summary',
  protect,
  authorize('patient', 'dentist', 'admin'),
  async (req, res) => {
    try {
      const rRef = db.collection('diagnosisReports').doc(req.params.id);
      const snap = await rRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Report not found.' });
      
      const report = snap.data();
      
      if (req.user.role === 'patient' && report.patient !== req.user._id) {
        return res.status(403).json({ success: false, message: 'Permission denied.' });
      }

      // Check if it already exists in the report to save API calls
      if (report.pdfSummary) {
        return res.status(200).json({ success: true, data: report.pdfSummary });
      }

      const summaryData = await geminiService.generatePDFSummary(report);
      
      // Save it back to Firestore so we don't regenerate it next time
      await rRef.update({ pdfSummary: summaryData });

      return res.status(200).json({
        success: true,
        data: summaryData
      });
    } catch (error) {
      logger.error(CONTEXT, 'Generate PDF Summary endpoint error', { message: error.message });
      return res.status(500).json({ success: false, message: 'Error generating summary.' });
    }
  }
);

module.exports = router;
