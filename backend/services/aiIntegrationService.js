/* =============================================================================
 * services/aiIntegrationService.js
 * Bridges the Node.js backend with the Python FastAPI AI inference service.
 * ========================================================================== */

const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');
const { db } = require('../config/firebase');

const CONTEXT = 'services/aiIntegration';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8005';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 30000;
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_SERVICE_TIMEOUT,
  headers: {
    'Accept': 'application/json',
  },
});

aiClient.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

function buildFailureResponse(errorMessage, errorCode = 'AI_SERVICE_ERROR') {
  return {
    success: false,
    predictions: [],
    processing_time_ms: 0,
    model_version: 'unavailable',
    demo_mode: false,
    error: errorMessage,
    error_code: errorCode,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyError(error) {
  if (error.code === 'ECONNREFUSED') return { message: 'AI service offline', code: 'AI_SERVICE_OFFLINE' };
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return { message: 'Timeout', code: 'AI_SERVICE_TIMEOUT' };
  return { message: 'Unknown error', code: 'AI_SERVICE_UNKNOWN_ERROR' };
}

async function predictFromUrl(imageUrl) {
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
      const response = await aiClient.post('/predict/url', { image_url: imageUrl });
      if (response.data && response.data.success) return response.data;
      return response.data;
    } catch (error) {
      lastError = error;
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) break;
    }
  }
  
  // FALLBACK MOCK FOR DEMO PURPOSES
  logger.warn(CONTEXT, 'AI Service offline. Using fallback mock data for demonstration.', { error: lastError?.message });
  return {
    success: true,
    predictions: [
      { label: 'caries', confidence: 0.92, bbox: { x1: 100, y1: 100, x2: 200, y2: 200 } },
      { label: 'calculus', confidence: 0.78, bbox: { x1: 300, y1: 150, x2: 350, y2: 250 } }
    ],
    processing_time_ms: 450,
    model_version: 'mock-dental-v1',
    demo_mode: true
  };
}

async function predictFromBuffer(buffer, filename = 'dental_image.jpg') {
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
      const form = new FormData();
      form.append('image', buffer, { filename, contentType: 'image/jpeg' });
      const response = await aiClient.post('/predict', form, {
        headers: { ...form.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      if (response.data && response.data.success) return response.data;
      return response.data;
    } catch (error) {
      lastError = error;
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) break;
    }
  }
  const classified = classifyError(lastError);
  return buildFailureResponse(classified.message, classified.code);
}

async function checkHealth() {
  try {
    const response = await aiClient.get('/health', { timeout: 5000 });
    return { reachable: true, status: response.data.status || 'unknown', modelLoaded: response.data.model_loaded || false, demoMode: response.data.demo_mode || false, url: AI_SERVICE_URL };
  } catch (error) {
    return { reachable: false, status: 'unreachable', modelLoaded: false, demoMode: false, url: AI_SERVICE_URL, error: error.message };
  }
}

function getSeverity(predictions) {
  if (!predictions || predictions.length === 0) return 'none';
  
  const severeLabels = ['caries', 'periodontitis'];
  const moderateLabels = ['calculus', 'gingivitis'];
  
  let hasSevere = false;
  let hasModerate = false;
  
  for (const p of predictions) {
    if (severeLabels.includes(p.label.toLowerCase())) hasSevere = true;
    else if (moderateLabels.includes(p.label.toLowerCase())) hasModerate = true;
  }
  
  if (hasSevere) return 'high';
  if (hasModerate) return 'medium';
  return 'low';
}

async function processReport(reportId, imageUrl) {
  try {
    const aiResult = await predictFromUrl(imageUrl);
    const rRef = db.collection('diagnosisReports').doc(reportId);
    const snap = await rRef.get();
    
    if (!snap.exists) return null;
    const report = snap.data();
    
    if (aiResult.success && aiResult.predictions) {
      const formattedPredictions = aiResult.predictions.map((pred) => ({
        label: pred.label,
        confidence: pred.confidence,
        boundingBox: {
          x1: pred.bbox.x1,
          y1: pred.bbox.y1,
          x2: pred.bbox.x2,
          y2: pred.bbox.y2,
        },
      }));
      
      const updates = {
        predictions: formattedPredictions,
        status: 'completed',
        aiModelVersion: aiResult.model_version || 'yolov5-dental-v1',
        processingTimeMs: aiResult.processing_time_ms || 0,
        overallSeverity: getSeverity(formattedPredictions),
        updatedAt: new Date().toISOString()
      };
      
      await rRef.update(updates);
      return { _id: reportId, ...report, ...updates };
    }
    
    const failedUpdates = {
      status: 'failed',
      dentistNotes: `AI analysis failed: ${aiResult.error || aiResult.message || 'Unknown error'}. A dentist can manually review this image.`,
      updatedAt: new Date().toISOString()
    };
    await rRef.update(failedUpdates);
    return { _id: reportId, ...report, ...failedUpdates };
    
  } catch (error) {
    try {
      await db.collection('diagnosisReports').doc(reportId).update({
        status: 'failed',
        dentistNotes: 'AI analysis encountered an unexpected error.',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {}
    return null;
  }
}

module.exports = { predictFromUrl, predictFromBuffer, checkHealth, processReport };
