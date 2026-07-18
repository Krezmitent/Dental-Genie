/* =============================================================================
 * controllers/userController.js
 * Admin dashboard routes, user management, system metrics, and analytics with Firestore.
 * ========================================================================== */

const { db } = require('../config/firebase');
const logger = require('../utils/logger');

const CONTEXT = 'controllers/user';

function toSafeObject(user) {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

async function getAllUsers(req, res) {
  try {
    let query = db.collection('users');

    if (req.query.role) query = query.where('role', '==', req.query.role);
    if (req.query.isActive !== undefined) query = query.where('isActive', '==', req.query.isActive === 'true');
    if (req.query.isApproved !== undefined) query = query.where('isApproved', '==', req.query.isApproved === 'true');

    const snap = await query.get();
    let users = snap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      users = users.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    
    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const total = users.length;

    const paginated = users.slice((page - 1) * limit, page * limit).map(toSafeObject);

    return res.status(200).json({
      success: true,
      data: {
        users: paginated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error(CONTEXT, 'Error fetching users.', { message: error.message });
    return res.status(500).json({ success: false, message: 'Error retrieving users.' });
  }
}

async function getUserById(req, res) {
  try {
    const docSnap = await db.collection('users').doc(req.params.id).get();
    if (!docSnap.exists) return res.status(404).json({ success: false, message: 'User not found.' });

    const user = { _id: docSnap.id, ...docSnap.data() };

    if (req.user.role === 'dentist' && user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Dentists can only view patient profiles.' });
    }

    return res.status(200).json({ success: true, data: { user: toSafeObject(user) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving user.' });
  }
}

async function approveUser(req, res) {
  try {
    const uRef = db.collection('users').doc(req.params.id);
    const snap = await uRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found.' });

    if (snap.data().isApproved) return res.status(400).json({ success: false, message: 'Already approved.' });

    await uRef.update({ isApproved: true, updatedAt: new Date().toISOString() });
    
    const updatedSnap = await uRef.get();
    return res.status(200).json({
      success: true,
      message: `User "${updatedSnap.data().name}" has been approved.`,
      data: { user: toSafeObject({ _id: updatedSnap.id, ...updatedSnap.data() }) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error approving user.' });
  }
}

async function deactivateUser(req, res) {
  try {
    if (req.params.id === req.user._id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
    }
    const uRef = db.collection('users').doc(req.params.id);
    const snap = await uRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!snap.data().isActive) return res.status(400).json({ success: false, message: 'Already deactivated.' });

    await uRef.update({ isActive: false, updatedAt: new Date().toISOString() });
    const updatedSnap = await uRef.get();
    
    return res.status(200).json({
      success: true,
      message: `User deactivated.`,
      data: { user: toSafeObject({ _id: updatedSnap.id, ...updatedSnap.data() }) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deactivating user.' });
  }
}

async function activateUser(req, res) {
  try {
    const uRef = db.collection('users').doc(req.params.id);
    const snap = await uRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'User not found.' });
    if (snap.data().isActive) return res.status(400).json({ success: false, message: 'Already active.' });

    await uRef.update({ isActive: true, updatedAt: new Date().toISOString() });
    const updatedSnap = await uRef.get();
    
    return res.status(200).json({
      success: true,
      message: `User activated.`,
      data: { user: toSafeObject({ _id: updatedSnap.id, ...updatedSnap.data() }) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error activating user.' });
  }
}

async function getDentistsList(req, res) {
  try {
    const snap = await db.collection('users')
      .where('role', '==', 'dentist')
      .where('isActive', '==', true)
      .where('isApproved', '==', true)
      .get();
      
    const dentists = snap.docs.map(doc => {
      const d = doc.data();
      return {
        _id: doc.id,
        name: d.name,
        email: d.email,
        profile: d.profile, // Will now contain department, education, bio, languages, experience
      };
    });
    
    dentists.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ success: true, data: { dentists, total: dentists.length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving dentists.' });
  }
}

async function getDashboardStats(req, res) {
  try {
    // Users
    const uSnap = await db.collection('users').get();
    const users = uSnap.docs.map(d => d.data());
    
    // Appointments
    const aSnap = await db.collection('appointments').get();
    const appointments = aSnap.docs.map(d => d.data());
    
    // Reports
    const rSnap = await db.collection('diagnosisReports').get();
    const reports = rSnap.docs.map(d => d.data());
    
    // Prescriptions
    const pSnap = await db.collection('prescriptions').where('isActive', '==', true).get();
    const prescriptions = pSnap.docs.length;

    // Aggregations
    const totalPatients = users.filter(u => u.role === 'patient').length;
    const totalDentists = users.filter(u => u.role === 'dentist').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const pendingApprovals = users.filter(u => !u.isApproved).length;
    const deactivatedUsers = users.filter(u => !u.isActive).length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

    const aStats = { total: appointments.length, pending: 0, approved: 0, completed: 0, cancelled: 0 };
    appointments.forEach(a => { if (aStats[a.status] !== undefined) aStats[a.status]++; });

    const rStats = { total: reports.length, processing: 0, completed: 0, reviewed: 0, failed: 0 };
    reports.forEach(r => { if (rStats[r.status] !== undefined) rStats[r.status]++; });

    // Dummy severity distribution since aggregation isn't native easily
    const severityDistribution = [
      { _id: 'Mild', count: reports.filter(r => r.overallSeverity === 'Mild').length },
      { _id: 'Moderate', count: reports.filter(r => r.overallSeverity === 'Moderate').length },
      { _id: 'Severe', count: reports.filter(r => r.overallSeverity === 'Severe').length },
    ].filter(s => s.count > 0);

    return res.status(200).json({
      success: true,
      data: {
        users: { totalPatients, totalDentists, totalAdmins, pendingApprovals, deactivatedUsers, recentRegistrations },
        appointments: aStats,
        diagnoses: { ...rStats, severityDistribution },
        prescriptions: { total: prescriptions },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error generating stats.' });
  }
}

async function getPatientMedicalHistory(req, res) {
  try {
    const patientId = req.params.id;
    if (req.user.role === 'patient' && patientId !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const patientDoc = await db.collection('users').doc(patientId).get();
    if (!patientDoc.exists) return res.status(404).json({ success: false, message: 'Patient not found.' });

    let aQuery = db.collection('appointments').where('patient', '==', patientId);
    let pQuery = db.collection('prescriptions').where('patient', '==', patientId).where('isActive', '==', true);
    let dQuery = db.collection('diagnosisReports').where('patient', '==', patientId);

    if (req.user.role === 'dentist') {
      aQuery = aQuery.where('dentist', '==', req.user._id);
      pQuery = pQuery.where('dentist', '==', req.user._id);
    }

    const [aSnap, pSnap, dSnap] = await Promise.all([aQuery.get(), pQuery.get(), dQuery.get()]);

    const appointments = aSnap.docs.map(d => ({ _id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date));
    const prescriptions = pSnap.docs.map(d => ({ _id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const diagnosisReports = dSnap.docs.map(d => ({ _id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: {
        patient: toSafeObject({ _id: patientDoc.id, ...patientDoc.data() }),
        diagnosisReports: diagnosisReports.slice(0, 50),
        prescriptions: prescriptions.slice(0, 50),
        appointments: appointments.slice(0, 50),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching history.' });
  }
}

module.exports = { getAllUsers, getUserById, approveUser, deactivateUser, activateUser, getDentistsList, getDashboardStats, getPatientMedicalHistory };
