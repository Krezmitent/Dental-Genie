import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const AppointmentList = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelStatus, setCancelStatus] = useState({ loading: false, id: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, id: null, reason: '' });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments');
        if (res.data.success) {
          setAppointments(res.data.data.appointments);
        }
      } catch (err) {
        setError('Failed to load appointments.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const openCancelModal = (id) => {
    setCancelModal({ isOpen: true, id, reason: '' });
  };

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, id: null, reason: '' });
  };

  const confirmCancel = async () => {
    const { id, reason } = cancelModal;
    if (reason.trim() === '') {
      alert("A cancellation reason is required.");
      return;
    }
    
    setCancelStatus({ loading: true, id });
    try {
      const res = await api.put(`/appointments/${id}/status`, { 
        status: 'cancelled',
        cancellationReason: reason.trim()
      });
      if (res.data.success) {
        setAppointments(appointments.map(app => app._id === id ? { ...app, status: 'cancelled', cancellationReason: reason.trim() } : app));
        closeCancelModal();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelStatus({ loading: false, id: null });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2.5 py-1 bg-primary-container/10 text-primary border border-primary/30 text-[10px] font-mono tracking-widest uppercase rounded-full">Approved</span>;
      case 'pending': return <span className="px-2.5 py-1 bg-tertiary-container/10 text-tertiary-fixed-dim border border-tertiary/30 text-[10px] font-mono tracking-widest uppercase rounded-full">Pending</span>;
      case 'completed': return <span className="px-2.5 py-1 bg-secondary-container/10 text-secondary-fixed-dim border border-secondary/30 text-[10px] font-mono tracking-widest uppercase rounded-full">Completed</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-error-container/10 text-error border border-error/30 text-[10px] font-mono tracking-widest uppercase rounded-full">Cancelled</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.date) < new Date() || a.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Appointments</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage your upcoming dental visits.</p>
        </div>
        <Link 
          to="/patient/appointments/book"
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container text-sm font-display font-semibold rounded-lg transition-all btn-glow"
        >
          <span className="material-symbols-outlined text-[18px] mr-2">add</span>
          Book Appointment
        </Link>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      {/* Upcoming Section */}
      <div>
        <h2 className="text-sm font-mono text-primary-fixed-dim mb-4 uppercase tracking-widest">Upcoming Visits</h2>
        {upcoming.length > 0 ? (
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <ul className="divide-y divide-outline-variant/20">
              {upcoming.map(app => (
                <li key={app._id} className="p-6 hover:bg-surface-container-high transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 mr-5 border border-primary/20 font-mono shadow-[inset_0_0_15px_rgba(0,219,231,0.05)]">
                      <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                    </div>
                    <div className="mt-1">
                      <h3 className="text-base font-bold text-on-surface font-display">Dr. {app.dentist?.name || 'Unknown'}</h3>
                      <div className="flex items-center mt-1 text-xs text-on-surface-variant font-mono">
                        <span className="material-symbols-outlined text-[14px] mr-1.5">schedule</span>
                        {app.timeSlot}
                      </div>
                      <div className="mt-3">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                    <button 
                      onClick={() => openCancelModal(app._id)}
                      disabled={cancelStatus.loading && cancelStatus.id === app._id}
                      className="w-full sm:w-auto px-4 py-2 text-[11px] font-mono tracking-widest uppercase text-error bg-error-container/10 border border-error/30 hover:bg-error/20 hover:border-error/50 rounded-lg transition-all disabled:opacity-50"
                    >
                      {cancelStatus.loading && cancelStatus.id === app._id ? 'CANCELLING...' : 'CANCEL UPLINK'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3">calendar_month</span>
            <p className="text-on-surface-variant text-sm">You don't have any upcoming appointments.</p>
          </div>
        )}
      </div>

      {/* Past Section */}
      {past.length > 0 && (
        <div className="opacity-70">
          <h2 className="text-sm font-mono text-on-surface-variant mb-4 uppercase tracking-widest">Past & Cancelled</h2>
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <ul className="divide-y divide-outline-variant/20">
              {past.map(app => (
                <li key={app._id} className="p-4 flex items-center justify-between hover:bg-surface-container-high/50 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-surface-container-highest text-on-surface-variant w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 mr-4 border border-outline-variant/30 font-mono">
                      <span className="text-[9px] font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{new Date(app.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface font-display">Dr. {app.dentist?.name || 'Unknown'}</h3>
                      <div className="mt-1 flex items-center space-x-3">
                        <span className="text-xs text-on-surface-variant font-mono">{app.timeSlot}</span>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-display font-bold text-on-surface mb-2">Cancel Appointment</h3>
            <p className="text-on-surface-variant text-sm mb-4">Are you sure you want to cancel this uplink? Please provide a reason.</p>
            
            <textarea
              className="w-full bg-layer-0 border border-outline-variant/50 rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors mb-4 h-24 resize-none"
              placeholder="e.g., Scheduling conflict, feeling sick..."
              value={cancelModal.reason}
              onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeCancelModal}
                className="px-4 py-2 text-sm font-semibold text-on-surface hover:text-on-surface-variant transition-colors"
                disabled={cancelStatus.loading}
              >
                Keep It
              </button>
              <button 
                onClick={confirmCancel}
                disabled={cancelStatus.loading || !cancelModal.reason.trim()}
                className="px-4 py-2 text-sm font-semibold text-error bg-error-container/10 border border-error/30 hover:bg-error/20 hover:border-error/50 rounded-lg transition-all disabled:opacity-50"
              >
                {cancelStatus.loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
