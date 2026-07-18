import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const DentistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/appointments');
        if (res.data.success) {
          setAppointments(res.data.data.appointments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setAppointments(appointments.map(app => 
          app._id === id ? { ...app, status: newStatus } : app
        ));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const pending = appointments.filter(a => a.status === 'pending');
  const approved = appointments.filter(a => a.status === 'approved' && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)));

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Uplink Management</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Review and manage patient booking requests.</p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-sm font-mono font-bold text-tertiary-fixed-dim mb-4 flex items-center uppercase tracking-widest">
          <span className="material-symbols-outlined text-[18px] mr-2">schedule</span>
          Pending Requests ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <ul className="divide-y divide-outline-variant/20">
              {pending.map(app => (
                <li key={app._id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="bg-tertiary-container/10 text-tertiary-fixed-dim w-14 h-14 rounded-xl flex flex-col items-center justify-center mr-5 border border-tertiary/20 font-mono shadow-[inset_0_0_10px_rgba(254,216,58,0.05)]">
                      <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-on-surface">{app.patient?.name || 'Unknown Subject'}</h3>
                      <p className="text-xs font-mono text-on-surface-variant mt-1">{app.timeSlot}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 w-full sm:w-auto">
                    <button 
                      onClick={() => handleStatusUpdate(app._id, 'approved')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-primary-container/10 border border-primary/30 text-primary hover:bg-primary-container/20 font-mono text-xs font-bold rounded-lg transition-colors uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1.5">check_circle</span>
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(app._id, 'cancelled')}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-error-container/10 border border-error/30 text-error hover:bg-error-container/20 font-mono text-xs font-bold rounded-lg transition-colors uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1.5">cancel</span>
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center text-on-surface-variant font-mono text-sm uppercase tracking-widest">
            No pending uplink requests.
          </div>
        )}
      </div>

      {/* Approved/Upcoming */}
      <div>
        <h2 className="text-sm font-mono font-bold text-primary mb-4 flex items-center uppercase tracking-widest">
          <span className="material-symbols-outlined text-[18px] mr-2">event_available</span>
          Confirmed Schedule ({approved.length})
        </h2>
        {approved.length > 0 ? (
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <ul className="divide-y divide-outline-variant/20">
              {approved.map(app => (
                <li key={app._id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="bg-primary-container/10 text-primary w-14 h-14 rounded-xl flex flex-col items-center justify-center mr-5 border border-primary/20 font-mono shadow-[inset_0_0_10px_rgba(0,219,231,0.05)]">
                      <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-on-surface">{app.patient?.name || 'Unknown'}</h3>
                      <p className="text-xs font-mono text-on-surface-variant mt-1">{app.timeSlot}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStatusUpdate(app._id, 'completed')}
                    className="w-full sm:w-auto px-4 py-2 border border-outline-variant/50 text-on-surface hover:bg-surface-container-highest hover:border-outline hover:text-primary font-mono text-xs font-bold rounded-lg transition-colors uppercase tracking-widest"
                  >
                    Mark Complete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center text-on-surface-variant font-mono text-sm uppercase tracking-widest">
            No confirmed uplinks.
          </div>
        )}
      </div>
    </div>
  );
};

export default DentistAppointments;
