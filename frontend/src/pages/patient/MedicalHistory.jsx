import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const MedicalHistory = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    prescriptions: [],
    reports: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/users/${user._id}/medical-history`);
        if (res.data.success) {
          setData({
            prescriptions: res.data.data.prescriptions || [],
            reports: res.data.data.diagnosisReports || []
          });
        }
      } catch (err) {
        setError('Failed to load medical history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user._id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Combine and sort events for timeline
  const timelineEvents = [
    ...data.prescriptions.map(p => ({ type: 'prescription', date: p.createdAt, data: p })),
    ...data.reports.map(r => ({ type: 'report', date: r.createdAt, data: r }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Medical History</h1>
        <p className="text-on-surface-variant mt-1 text-sm">A chronological timeline of your dental records.</p>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      {timelineEvents.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-5 pointer-events-none"></div>
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4 border border-outline-variant/30">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">folder_open</span>
          </div>
          <h3 className="text-lg font-display font-bold text-on-surface mb-1">No History Yet</h3>
          <p className="text-on-surface-variant max-w-md mx-auto text-sm">
            You don't have any medical history records on file. Start by uploading an AI scan or booking an appointment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link to="/patient/diagnosis" className="w-full sm:w-auto px-6 py-2.5 bg-primary-container/10 border border-primary/30 text-primary font-display font-semibold rounded-lg hover:bg-primary/20 hover:border-primary/50 transition-all shadow-[0_0_15px_rgba(0,219,231,0.1)]">
              New AI Scan
            </Link>
            <Link to="/patient/appointments/book" className="w-full sm:w-auto px-6 py-2.5 bg-surface-container-high border border-outline-variant hover:border-outline text-on-surface font-display font-semibold rounded-lg transition-colors">
              Book Visit
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative border-l border-primary/30 ml-4 md:ml-6 pl-10 md:pl-12 space-y-12 pb-12">
          {timelineEvents.map((event, idx) => {
            const date = new Date(event.date);
            
            if (event.type === 'report') {
              const report = event.data;
              return (
                <div key={`report-${report._id}`} className="relative">
                  <div className="absolute -left-[60px] md:-left-[68px] bg-layer-0 w-10 h-10 rounded-full flex items-center justify-center border border-primary/50 shadow-[0_0_10px_rgba(0,219,231,0.2)] z-10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">radiology</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs font-mono font-bold text-primary-fixed-dim uppercase tracking-widest">{date.toLocaleDateString()}</span>
                  </div>
                  <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-layer-0 border border-outline-variant/30 flex-shrink-0 relative">
                          <img src={report.imageUrl} alt="Scan thumbnail" className="w-full h-full object-cover mix-blend-screen opacity-80" />
                          <div className="absolute inset-0 bg-primary/10"></div>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-on-surface">AI Diagnosis Scan</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">{report.status}</span>
                            <span className="text-outline-variant/50">•</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                              report.overallSeverity === 'high' ? 'bg-error-container/10 text-error border-error/30' :
                              report.overallSeverity === 'medium' ? 'bg-tertiary-container/10 text-tertiary-fixed-dim border-tertiary/30' :
                              'bg-primary-container/10 text-primary border-primary/30'
                            }`}>
                              {report.overallSeverity} Severity
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link to={`/patient/diagnosis/${report._id}`} className="flex items-center text-sm font-mono font-medium text-primary hover:text-primary-fixed-dim bg-primary/5 border border-primary/20 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors self-start sm:self-auto">
                        VIEW_REPORT
                        <span className="material-symbols-outlined text-[16px] ml-1">chevron_right</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            } else {
              const rx = event.data;
              return (
                <div key={`rx-${rx._id}`} className="relative">
                  <div className="absolute -left-[60px] md:-left-[68px] bg-layer-0 w-10 h-10 rounded-full flex items-center justify-center border border-secondary/50 shadow-[0_0_10px_rgba(20,209,255,0.2)] z-10 text-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[20px]">prescription</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs font-mono font-bold text-secondary-fixed-dim uppercase tracking-widest">{date.toLocaleDateString()}</span>
                  </div>
                  <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 hover:border-secondary/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-display font-bold text-on-surface">Prescription Issued</h4>
                        <p className="text-xs font-mono text-on-surface-variant mt-1 uppercase tracking-widest">Auth: Dr. {rx.dentist?.name || 'Dentist'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {rx.medications.map((med, i) => (
                        <div key={i} className="flex items-start bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
                          <div className="bg-secondary/10 p-2 rounded-lg border border-secondary/30 mr-3 shadow-sm flex items-center justify-center">
                            <span className="font-display font-bold text-secondary text-sm">Rx</span>
                          </div>
                          <div>
                            <p className="font-display font-bold text-on-surface">{med.name}</p>
                            <p className="text-xs font-mono text-on-surface-variant mt-1"><span className="text-secondary-fixed-dim mr-1">DOSAGE:</span> {med.dosage}</p>
                            <p className="text-xs font-mono text-on-surface-variant mt-0.5"><span className="text-secondary-fixed-dim mr-1">INSTR:</span> {med.instructions}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {rx.notes && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/20">
                        <p className="text-xs font-mono text-on-surface-variant"><span className="text-secondary-fixed-dim mr-1">NOTES:</span> {rx.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;
