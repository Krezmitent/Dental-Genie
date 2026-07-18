/* =============================================================================
 * controllers/appointmentController.js
 * Handles all appointment CRUD operations with Firebase Firestore.
 * ========================================================================== */

const { validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const CONTEXT = 'controllers/appointment';

const VALID_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

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

// Helper to populate patient and dentist (basic join)
async function populateAppointment(apptData) {
  const result = { ...apptData };
  
  if (apptData.patient) {
    const patientDoc = await db.collection('users').doc(apptData.patient).get();
    if (patientDoc.exists) {
      const p = patientDoc.data();
      result.patient = { _id: patientDoc.id, name: p.name, email: p.email, profile: p.profile };
    }
  }
  
  if (apptData.dentist) {
    const dentistDoc = await db.collection('users').doc(apptData.dentist).get();
    if (dentistDoc.exists) {
      const d = dentistDoc.data();
      result.dentist = { _id: dentistDoc.id, name: d.name, email: d.email, profile: d.profile };
    }
  }
  
  return result;
}

// Helper: get available slots for a dentist on a specific date
async function getDentistAvailability(dentistId, dateString) {
  // dateString like '2023-10-15'
  const appointmentsRef = db.collection('appointments');
  const snapshot = await appointmentsRef
    .where('dentist', '==', dentistId)
    .where('dateString', '==', dateString)
    .where('status', 'in', ['pending', 'approved'])
    .get();

  const bookedSlots = snapshot.docs.map(doc => doc.data().timeSlot);
  return VALID_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));
}

async function createAppointment(req, res) {
  try {
    const validationResponse = handleValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const { dentistId, date, timeSlot, reason } = req.body;
    const patientId = req.user._id;

    // Verify dentist
    const dentistDoc = await db.collection('users').doc(dentistId).get();
    if (!dentistDoc.exists) {
      return res.status(404).json({ success: false, message: 'Dentist not found.' });
    }
    const dentist = dentistDoc.data();
    if (dentist.role !== 'dentist' || !dentist.isActive || !dentist.isApproved) {
      return res.status(400).json({ success: false, message: 'The specified dentist is not available.' });
    }

    // Check slot availability
    const dateOnly = new Date(date).toISOString().split('T')[0];
    const availableSlots = await getDentistAvailability(dentistId, dateOnly);
    
    if (!availableSlots.includes(timeSlot)) {
      return res.status(409).json({
        success: false,
        message: `The time slot ${timeSlot} is not available on ${dateOnly}.`
      });
    }

    // Check patient conflict
    const patientConflictSnap = await db.collection('appointments')
      .where('patient', '==', patientId)
      .where('dateString', '==', dateOnly)
      .where('timeSlot', '==', timeSlot)
      .where('status', 'in', ['pending', 'approved'])
      .get();

    if (!patientConflictSnap.empty) {
      return res.status(409).json({
        success: false,
        message: `You already have an appointment at ${timeSlot} on this date.`,
      });
    }

    const _id = uuidv4();
    const newAppointment = {
      patient: patientId,
      dentist: dentistId,
      date: new Date(date).toISOString(),
      dateString: dateOnly,
      timeSlot,
      reason: reason || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('appointments').doc(_id).set(newAppointment);
    newAppointment._id = _id;

    const populated = await populateAppointment(newAppointment);

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Status: pending.',
      data: { appointment: populated },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error creating appointment.', { message: error.message });
    return res.status(500).json({ success: false, message: 'Error booking appointment.' });
  }
}

async function getAppointments(req, res) {
  try {
    let query = db.collection('appointments');

    if (req.user.role === 'patient') {
      query = query.where('patient', '==', req.user._id);
    } else if (req.user.role === 'dentist') {
      query = query.where('dentist', '==', req.user._id);
    }

    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
    }
    
    if (req.query.patientId && req.user.role !== 'patient') {
      query = query.where('patient', '==', req.query.patientId);
    }
    
    if (req.query.dentistId) {
      query = query.where('dentist', '==', req.query.dentistId);
    }
    
    if (req.query.date) {
      const dateOnly = new Date(req.query.date).toISOString().split('T')[0];
      query = query.where('dateString', '==', dateOnly);
    }

    // Pagination is complex in Firestore (requires cursors). We'll do a simple fetch and sort in memory for now.
    const snapshot = await query.get();
    let appointments = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    // Sort by date desc, time slot asc
    appointments.sort((a, b) => {
      if (a.dateString !== b.dateString) return b.dateString.localeCompare(a.dateString);
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const total = appointments.length;
    
    const paginated = appointments.slice((page - 1) * limit, page * limit);
    
    const populatedAppts = await Promise.all(paginated.map(a => populateAppointment(a)));

    return res.status(200).json({
      success: true,
      data: {
        appointments: populatedAppts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error fetching appointments.', { message: error.message });
    return res.status(500).json({ success: false, message: 'Error retrieving appointments.' });
  }
}

async function getAppointmentById(req, res) {
  try {
    const docSnap = await db.collection('appointments').doc(req.params.id).get();
    if (!docSnap.exists) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    
    const appointment = { _id: docSnap.id, ...docSnap.data() };
    const populated = await populateAppointment(appointment);

    if (req.user.role === 'patient' && appointment.patient !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
    if (req.user.role === 'dentist' && appointment.dentist !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    return res.status(200).json({ success: true, data: { appointment: populated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving appointment.' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const validationResponse = handleValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    const { status, cancellationReason, notes } = req.body;

    const apptRef = db.collection('appointments').doc(req.params.id);
    const apptSnap = await apptRef.get();

    if (!apptSnap.exists) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const appointment = apptSnap.data();
    const currentStatus = appointment.status;
    const userRole = req.user.role;

    if (userRole === 'patient' && appointment.patient !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
    if (userRole === 'dentist' && appointment.dentist !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const allowedTransitions = {
      patient: { pending: ['cancelled'], approved: ['cancelled'] },
      dentist: { pending: ['approved', 'cancelled'], approved: ['completed', 'cancelled'] },
      admin: { pending: ['approved', 'cancelled'], approved: ['completed', 'cancelled'], completed: ['approved'], cancelled: ['pending'] },
    };

    const validNextStatuses = allowedTransitions[userRole]?.[currentStatus];
    if (!validNextStatuses || !validNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${currentStatus}" to "${status}".`
      });
    }

    if (status === 'cancelled' && !cancellationReason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    const updates = { status, updatedAt: new Date().toISOString() };
    if (cancellationReason) updates.cancellationReason = cancellationReason;
    if (notes) updates.notes = notes;

    await apptRef.update(updates);
    
    appointment.status = status;
    const populated = await populateAppointment({ _id: apptSnap.id, ...appointment, ...updates });

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to "${status}".`,
      data: { appointment: populated },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error updating status.', { message: error.message });
    return res.status(500).json({ success: false, message: 'Error updating appointment status.' });
  }
}

async function checkAvailability(req, res) {
  try {
    const { dentistId, date } = req.query;

    const dentistDoc = await db.collection('users').doc(dentistId).get();
    if (!dentistDoc.exists || dentistDoc.data().role !== 'dentist') {
      return res.status(404).json({ success: false, message: 'Dentist not found.' });
    }

    const dentist = dentistDoc.data();
    if (!dentist.isActive || !dentist.isApproved) {
      return res.status(400).json({ success: false, message: 'Dentist is not available.' });
    }

    const dateOnly = new Date(date).toISOString().split('T')[0];
    const availableSlots = await getDentistAvailability(dentistId, dateOnly);

    return res.status(200).json({
      success: true,
      data: {
        dentist: { _id: dentistDoc.id, name: dentist.name, specialization: dentist.profile.specialization || '' },
        date: dateOnly,
        allSlots: VALID_TIME_SLOTS,
        availableSlots,
        bookedCount: VALID_TIME_SLOTS.length - availableSlots.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking availability.' });
  }
}

async function getDentistCalendar(req, res) {
  try {
    // simplified: fetch all non-cancelled appointments for this dentist
    const snap = await db.collection('appointments')
      .where('dentist', '==', req.user._id)
      .where('status', 'in', ['pending', 'approved'])
      .get();
      
    const appointments = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    const calendar = {};
    
    appointments.forEach(appt => {
      if (!calendar[appt.dateString]) calendar[appt.dateString] = [];
      calendar[appt.dateString].push(appt);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAppointments: appointments.length,
        calendar,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving calendar data.' });
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  checkAvailability,
  getDentistCalendar,
};
