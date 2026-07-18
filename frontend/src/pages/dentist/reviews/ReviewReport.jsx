import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const ReviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/diagnose/reports/${id}`);
        if (res.data.success) {
          const fetched = res.data.data.report;
          setReport(fetched);
          setNotes(fetched.dentistNotes || '');
          setSeverity(fetched.overallSeverity || 'low');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReport();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put(`/diagnose/reports/${id}`, {
        dentistNotes: notes,
        overallSeverity: severity,
        status: 'reviewed'
      });
      navigate('/dentist/dashboard'); // Or back to a reviews list
    } catch (err) {
      alert('Failed to save review');
    } finally {
      setIsSaving(false);
    }
  };

  if (!report) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-body">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-on-surface">Review AI Scan</h1>
            <p className="text-xs font-mono text-on-surface-variant mt-1 uppercase tracking-widest">Subject: {report.patient?.name || 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Image & AI Findings */}
        <div className="space-y-6">
          <div className="bg-layer-0 rounded-xl overflow-hidden border border-outline-variant/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
            <img src={report.imageUrl} alt="Scan" className="w-full h-auto max-h-[500px] object-contain mix-blend-screen" />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none border-[0.5px] border-primary/10"></div>
          </div>

          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
            <h3 className="text-lg font-display font-bold text-on-surface mb-4 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">memory</span>
               Network Findings
            </h3>
            <div className="space-y-3">
              {report.predictions?.map((pred, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-surface-container-highest/50 rounded-lg border border-outline-variant/20">
                  <span className="font-body text-sm font-medium text-on-surface capitalize">{pred.label.replace('_', ' ')}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 bg-surface-container-lowest rounded border border-outline-variant/30 text-primary-fixed-dim tracking-widest uppercase">
                    {(pred.confidence * 100).toFixed(1)}% CONF
                  </span>
                </div>
              ))}
              {report.predictions?.length === 0 && (
                <div className="text-center p-4 bg-surface-container-highest/30 rounded-lg text-on-surface-variant text-sm font-mono uppercase tracking-widest">
                  Zero Anomalies Detected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dentist Input */}
        <div className="space-y-6">
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 sticky top-24">
            <h3 className="text-lg font-display font-bold text-on-surface mb-6 flex items-center gap-2">
               <span className="material-symbols-outlined text-secondary-fixed-dim">health_and_safety</span>
               Operator Evaluation
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-widest">Override Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-2.5 bg-layer-0 border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-mono text-sm uppercase tracking-wider input-glow appearance-none"
                >
                  <option value="none">None (Optimal)</option>
                  <option value="low">Low (Monitor)</option>
                  <option value="medium">Medium (Schedule Checkup)</option>
                  <option value="high">High (Critical - Immediate)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-2 uppercase tracking-widest">Clinical Notes (Visible to Subject)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="6"
                  className="w-full p-3 bg-layer-0 border border-outline-variant/50 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-on-surface font-body text-sm resize-none input-glow"
                  placeholder="Enter your clinical findings, recommendations, or explain the AI results to the subject..."
                ></textarea>
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-3 bg-primary-container text-on-primary-container font-display font-semibold rounded-lg hover:bg-primary disabled:opacity-70 flex items-center justify-center transition-all btn-glow"
                >
                  {isSaving ? (
                     <>
                        <div className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin mr-2"></div>
                        SAVING...
                     </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] mr-2">save</span>
                      SAVE & MARK REVIEWED
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReviewReport;
