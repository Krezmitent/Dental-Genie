import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient Pages
import PatientLayout from './components/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import UploadDiagnosis from './pages/patient/diagnosis/UploadDiagnosis';
import ViewDiagnosis from './pages/patient/diagnosis/ViewDiagnosis';
import AppointmentList from './pages/patient/appointments/AppointmentList';
import BookAppointment from './pages/patient/appointments/BookAppointment';
import MedicalHistory from './pages/patient/MedicalHistory';

// Dentist Pages
import DentistLayout from './components/dentist/DentistLayout';
import DentistDashboard from './pages/dentist/DentistDashboard';
import DentistAppointments from './pages/dentist/appointments/DentistAppointments';
import DentistReviews from './pages/dentist/reviews/DentistReviews';
import ReviewReport from './pages/dentist/reviews/ReviewReport';
import PatientsList from './pages/dentist/PatientsList';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

// Placeholder for missing pages to prevent crash
const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <h1 className="text-2xl font-bold text-slate-700">{title} (Coming Soon)</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Patient Portal Routes */}
          <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route element={<PatientLayout />}>
              <Route index element={<Navigate to="/patient/dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              
              <Route path="diagnosis" element={<UploadDiagnosis />} />
              <Route path="diagnosis/:id" element={<ViewDiagnosis />} />
              
              <Route path="appointments" element={<AppointmentList />} />
              <Route path="appointments/book" element={<BookAppointment />} />
              
              <Route path="history" element={<MedicalHistory />} />
            </Route>
          </Route>

          {/* Dentist Portal Routes */}
          <Route path="/dentist" element={<ProtectedRoute allowedRoles={['dentist']} />}>
            <Route element={<DentistLayout />}>
              <Route index element={<Navigate to="/dentist/dashboard" replace />} />
              <Route path="dashboard" element={<DentistDashboard />} />
              
              <Route path="appointments" element={<DentistAppointments />} />
              
              <Route path="reviews" element={<DentistReviews />} />
              <Route path="reviews/:id" element={<ReviewReport />} />
              
              <Route path="patients" element={<PatientsList />} />
            </Route>
          </Route>

          {/* Admin Portal Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<Placeholder title="System Settings" />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Placeholder title="404 Not Found" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
