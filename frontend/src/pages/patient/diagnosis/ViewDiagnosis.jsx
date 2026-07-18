import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../utils/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DiagnosisChat from '../../../components/diagnosis/DiagnosisChat';
import PrintableReport from '../../../components/diagnosis/PrintableReport';

const ViewDiagnosis = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      const res = await api.get(`/diagnose/reports/${id}`);
      if (res.data.success) {
        setReport(res.data.data.report);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load diagnosis report.');
    } finally {
      setIsLoading(false);
    }
  };

  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    fetchReport();
    
    // Poll every 3 seconds if status is processing
    let intervalId;
    if (report?.status === 'processing') {
      intervalId = setInterval(fetchReport, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, report?.status]);

  if (isLoading && !report) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 text-center font-mono">
        <p>{error || 'Report not found'}</p>
        <Link to="/patient/dashboard" className="mt-4 inline-block font-medium hover:text-error-container underline decoration-error/50">
          RETURN TO DASHBOARD
        </Link>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-error-container/20 text-error border-error/50 shadow-[inset_0_0_15px_rgba(255,180,171,0.1)]';
      case 'medium': return 'bg-tertiary-container/20 text-tertiary-fixed-dim border-tertiary/50 shadow-[inset_0_0_15px_rgba(254,216,58,0.1)]';
      case 'low': return 'bg-secondary-container/20 text-secondary-fixed-dim border-secondary/50 shadow-[inset_0_0_15px_rgba(20,209,255,0.1)]';
      case 'none': return 'bg-primary-container/10 text-primary border-primary/50 shadow-[inset_0_0_15px_rgba(0,242,255,0.1)]';
      default: return 'bg-surface-container text-on-surface border-outline-variant';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <span className="material-symbols-outlined">warning</span>;
      case 'medium': return <span className="material-symbols-outlined">warning_amber</span>;
      case 'low': return <span className="material-symbols-outlined">info</span>;
      case 'none': return <span className="material-symbols-outlined">check_circle</span>;
      default: return null;
    }
  };

  const generatePDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);

    try {
      // 1. Fetch AI Summary first
      if (!report.pdfSummary) {
        const token = localStorage.getItem('token');
        const res = await api.post(`/diagnose/reports/${id}/generate-pdf-summary`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          // Update local state so PrintableReport re-renders with summaryData
          setReport(prev => ({ ...prev, pdfSummary: res.data.data }));
        }
      }

      // Wait a moment for React to re-render the hidden PrintableReport with the new data
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById('printable-report');
      if (!element) {
        setPdfGenerating(false);
        return;
      }
      
      // dynamically import html2pdf
      const html2pdf = await import('html2pdf.js');
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Diagnosis_Report_${id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf.default().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-body">
      
      {/* Header outside PDF capture so we can place buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/patient/dashboard" className="p-2 bg-surface-container rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-on-surface">Diagnosis Report</h1>
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mt-1">
              Gen: {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {report.status === 'completed' && (
            <button 
              onClick={generatePDF}
              disabled={pdfGenerating}
              className="px-4 py-1.5 text-sm bg-primary text-on-primary font-bold rounded hover:bg-primary/90 transition-colors shadow flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">{pdfGenerating ? 'hourglass_empty' : 'download'}</span>
              {pdfGenerating ? 'GENERATING SUMMARY...' : 'EXPORT PDF'}
            </button>
          )}
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase border ${
            report.status === 'completed' ? 'bg-primary-container/10 text-primary border-primary/50 shadow-[0_0_10px_rgba(0,219,231,0.2)]' : 
            report.status === 'reviewed' ? 'bg-secondary-container/20 text-secondary-fixed-dim border-secondary/50' : 
            report.status === 'processing' ? 'bg-tertiary-container/20 text-tertiary-fixed-dim border-tertiary/50 animate-pulse' : 
            'bg-error-container/20 text-error border-error/50'
          }`}>
            {report.status}
          </div>
        </div>
      </div>

      <div className="bg-layer-0 rounded-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
        
        {/* Left Column: Image */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-layer-0 rounded-xl overflow-hidden relative border border-outline-variant/50 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            {report.status === 'processing' && (
              <div className="absolute inset-0 bg-layer-0/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[48px] animate-spin mb-4 text-primary">sync</span>
                <p className="font-display font-semibold text-lg text-primary text-glow">ANALYZING SCAN</p>
                <p className="text-sm font-mono text-on-surface-variant mt-2 uppercase tracking-widest">Processing nodes...</p>
              </div>
            )}
            
            <img 
              src={report.imageUrl} 
              alt="Dental Scan" 
              className="w-full h-auto object-contain max-h-[600px] mix-blend-screen"
            />
            
            {/* Scanlines overlay */}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none border-[0.5px] border-primary/10"></div>
          </div>

          {report.dentistNotes && (
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-secondary-fixed-dim"></div>
              <h3 className="text-sm font-mono font-bold text-secondary-fixed-dim mb-3 uppercase tracking-widest flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">prescriptions</span>
                 Clinical Notes
              </h3>
              <p className="text-on-surface text-sm bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 font-body">
                {report.dentistNotes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: AI Findings */}
        <div className="space-y-6">
          
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
              <h3 className="text-lg font-display font-bold text-on-surface flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">memory</span>
                 Network Findings
              </h3>
              <p className="text-[10px] font-mono text-on-surface-variant mt-1 uppercase tracking-widest">Model: {report.aiModelVersion}</p>
            </div>
            
            {report.status === 'processing' ? (
              <div className="p-8 text-center text-on-surface-variant font-mono text-sm">
                <span className="material-symbols-outlined text-[48px] mb-3 text-outline-variant">hourglass_empty</span>
                <p className="uppercase tracking-widest">Awaiting output...</p>
              </div>
            ) : report.status === 'failed' ? (
              <div className="p-8 text-center text-error font-mono text-sm">
                <span className="material-symbols-outlined text-[48px] mb-3 text-error/50">warning</span>
                <p>Uplink failed.</p>
                <p className="mt-2 text-error/80">{report.dentistNotes || 'Manual review required.'}</p>
              </div>
            ) : (
              <div className="p-5">
                <div className={`mb-6 p-4 rounded-xl border flex items-start space-x-3 ${getSeverityColor(report.overallSeverity)}`}>
                  <div className="mt-0.5 flex-shrink-0">
                    {getSeverityIcon(report.overallSeverity)}
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest">Severity: {report.overallSeverity}</h4>
                    <p className="text-sm mt-1 opacity-90 font-body">
                      {report.overallSeverity === 'high' ? 'Immediate clinical attention recommended.' :
                       report.overallSeverity === 'medium' ? 'Schedule a checkup soon.' :
                       report.overallSeverity === 'low' ? 'Monitor these areas during your next visit.' :
                       'No significant anomalies detected.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-semibold text-on-surface-variant uppercase tracking-widest mb-3">Detected Vectors</h4>
                  {report.predictions && report.predictions.length > 0 ? (
                    report.predictions.map((pred, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-highest/50 rounded-lg border border-outline-variant/20">
                        <span className="text-sm font-medium text-on-surface capitalize font-body">{pred.label.replace('_', ' ')}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-1 bg-surface-container-lowest rounded border border-outline-variant/30 text-primary-fixed-dim">
                          {(pred.confidence * 100).toFixed(1)}% CONF
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-surface-container-highest/30 rounded-lg text-on-surface-variant text-sm font-mono uppercase tracking-widest">
                      Zero Anomalies
                    </div>
                  )}
                </div>
                
                {report.status === 'completed' && (
                  <div className="mt-8">
                    <Link 
                      to="/patient/appointments"
                      className="block w-full py-3 px-4 bg-primary-container text-on-primary-container text-center font-display font-semibold rounded-lg hover:bg-primary transition-all btn-glow text-sm tracking-wide"
                    >
                      REQUEST CLINICAL REVIEW
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
      
      </div>

      {report.status === 'completed' && (
        <div className="mt-8">
          <DiagnosisChat reportId={id} />
        </div>
      )}

      {/* Hidden Printable PDF Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <PrintableReport report={report} />
      </div>
    </div>
  );
};

export default ViewDiagnosis;
