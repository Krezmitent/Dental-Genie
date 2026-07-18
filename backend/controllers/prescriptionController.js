/* =============================================================================
 * controllers/prescriptionController.js
 * Full CRUD operations for digital prescriptions with Firebase Firestore.
 * ========================================================================== */

const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const CONTEXT = 'controllers/prescription';

function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
}

async function populatePrescription(data) {
  const result = { ...data };
  if (data.patient) {
    const pSnap = await db.collection('users').doc(data.patient).get();
    if (pSnap.exists) {
      const p = pSnap.data();
      result.patient = { _id: pSnap.id, name: p.name, email: p.email, profile: p.profile };
    }
  }
  if (data.dentist) {
    const dSnap = await db.collection('users').doc(data.dentist).get();
    if (dSnap.exists) {
      const d = dSnap.data();
      result.dentist = { _id: dSnap.id, name: d.name, email: d.email, profile: d.profile };
    }
  }
  if (data.appointment) {
    const aSnap = await db.collection('appointments').doc(data.appointment).get();
    if (aSnap.exists) {
      const a = aSnap.data();
      result.appointment = { _id: aSnap.id, date: a.date, timeSlot: a.timeSlot, status: a.status };
    }
  }
  if (data.diagnosisReport) {
    const rSnap = await db.collection('diagnosisReports').doc(data.diagnosisReport).get();
    if (rSnap.exists) {
      const r = rSnap.data();
      result.diagnosisReport = { _id: rSnap.id, imageUrl: r.imageUrl, predictions: r.predictions, overallSeverity: r.overallSeverity };
    }
  }
  return result;
}

async function createPrescription(req, res) {
  try {
    const validationResponse = handleValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const { patientId, appointmentId, diagnosisReportId, medications, diagnosis, remarks, followUpDate } = req.body;

    const patientDoc = await db.collection('users').doc(patientId).get();
    if (!patientDoc.exists || patientDoc.data().role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    if (!patientDoc.data().isActive) {
      return res.status(400).json({ success: false, message: 'Cannot prescribe to deactivated account.' });
    }

    if (appointmentId) {
      const apptDoc = await db.collection('appointments').doc(appointmentId).get();
      if (!apptDoc.exists) return res.status(404).json({ success: false, message: 'Appointment not found.' });
      if (req.user.role === 'dentist' && apptDoc.data().dentist !== req.user._id) {
        return res.status(403).json({ success: false, message: 'You can only create prescriptions for your own appointments.' });
      }
    }

    const _id = uuidv4();
    const prescription = {
      patient: patientId,
      dentist: req.user._id,
      appointment: appointmentId || null,
      diagnosisReport: diagnosisReportId || null,
      medications,
      diagnosis: diagnosis || '',
      remarks: remarks || '',
      followUpDate: followUpDate || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('prescriptions').doc(_id).set(prescription);
    prescription._id = _id;

    const populated = await populatePrescription(prescription);

    return res.status(201).json({
      success: true,
      message: 'Prescription created successfully.',
      data: { prescription: populated },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating prescription.' });
  }
}

async function getPrescriptions(req, res) {
  try {
    let query = db.collection('prescriptions').where('isActive', '==', true);

    if (req.user.role === 'patient') {
      query = query.where('patient', '==', req.user._id);
    } else if (req.user.role === 'dentist') {
      query = query.where('dentist', '==', req.user._id);
      if (req.query.patientId) query = query.where('patient', '==', req.query.patientId);
    } else if (req.user.role === 'admin') {
      if (req.query.patientId) query = query.where('patient', '==', req.query.patientId);
      if (req.query.dentistId) query = query.where('dentist', '==', req.query.dentistId);
    }

    const snap = await query.get();
    let prescriptions = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const total = prescriptions.length;

    const paginated = prescriptions.slice((page - 1) * limit, page * limit);
    const populated = await Promise.all(paginated.map(p => populatePrescription(p)));

    return res.status(200).json({
      success: true,
      data: {
        prescriptions: populated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving prescriptions.' });
  }
}

async function getPrescriptionById(req, res) {
  try {
    const snap = await db.collection('prescriptions').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Prescription not found.' });

    const p = { _id: snap.id, ...snap.data() };
    const populated = await populatePrescription(p);

    if (req.user.role === 'patient' && p.patient !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
    if (req.user.role === 'dentist' && p.dentist !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    return res.status(200).json({ success: true, data: { prescription: populated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving prescription.' });
  }
}

async function updatePrescription(req, res) {
  try {
    const validationResponse = handleValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const pRef = db.collection('prescriptions').doc(req.params.id);
    const snap = await pRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Not found.' });

    const p = snap.data();
    if (!p.isActive) return res.status(400).json({ success: false, message: 'Cannot update deactivated prescription.' });

    if (req.user.role === 'dentist' && p.dentist !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const updatableFields = ['medications', 'diagnosis', 'remarks', 'followUpDate'];
    const updates = { updatedAt: new Date().toISOString() };
    for (const f of updatableFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }

    await pRef.update(updates);
    const populated = await populatePrescription({ _id: snap.id, ...p, ...updates });

    return res.status(200).json({
      success: true,
      message: 'Prescription updated successfully.',
      data: { prescription: populated },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating prescription.' });
  }
}

async function deletePrescription(req, res) {
  try {
    const pRef = db.collection('prescriptions').doc(req.params.id);
    const snap = await pRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Not found.' });

    if (req.user.role === 'dentist' && snap.data().dentist !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await pRef.update({ isActive: false, updatedAt: new Date().toISOString() });
    return res.status(200).json({ success: true, message: 'Prescription deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting prescription.' });
  }
}

async function getPatientPrescriptions(req, res) {
  try {
    const { patientId } = req.params;
    if (req.user.role === 'patient' && patientId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    let query = db.collection('prescriptions')
      .where('isActive', '==', true)
      .where('patient', '==', patientId);

    if (req.user.role === 'dentist') {
      query = query.where('dentist', '==', req.user._id);
    }

    const snap = await query.get();
    let prescriptions = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const total = prescriptions.length;

    const paginated = prescriptions.slice((page - 1) * limit, page * limit);
    const populated = await Promise.all(paginated.map(p => populatePrescription(p)));

    return res.status(200).json({
      success: true,
      data: {
        prescriptions: populated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving patient prescriptions.' });
  }
}

module.exports = { createPrescription, getPrescriptions, getPrescriptionById, updatePrescription, deletePrescription, getPatientPrescriptions };
