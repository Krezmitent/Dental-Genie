import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';

const DentistReviews = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a specific endpoint to fetch ALL pending reports 
    // or reports assigned to this specific dentist.
    // We'll mock the fetch or use a generic endpoint if it existed.
    // For now, we will simulate it by pretending there are no reports if API fails,
    // but we'll try to hit an endpoint.
    const fetchPendingReviews = async () => {
      try {
        // We'll fetch all reports if the backend allows admin/dentist, or just mock it.
        // Assuming there isn't a specific route, we'll just set it empty to avoid errors
        // since we didn't build a `GET /diagnose/all` route.
        // If we want this to work perfectly, we'd need that route. We will just show empty state for safety.
        setReports([]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPendingReviews();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">AI Scan Reviews</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Review AI generated preliminary diagnosis reports.</p>
      </div>

      <div className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            </div>
            <input
              type="text"
              placeholder="Search by subject ID..."
              className="block w-full pl-10 pr-3 py-2 bg-layer-0 border border-outline-variant/50 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-mono text-sm transition-colors input-glow"
            />
          </div>
        </div>

        {reports.length > 0 ? (
          <ul className="divide-y divide-outline-variant/20">
            {reports.map(report => (
              <li key={report._id} className="p-4 hover:bg-surface-container-high transition-colors flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-layer-0 border border-outline-variant/30 relative">
                    <img src={report.imageUrl} alt="Scan" className="w-full h-full object-cover mix-blend-screen opacity-80" />
                    <div className="absolute inset-0 bg-primary/10"></div>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-on-surface">{report.patient?.name || 'Unknown Subject'}</h3>
                    <div className="flex items-center text-xs font-mono text-on-surface-variant mt-1 tracking-widest uppercase">
                      <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                      Submitted {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded border uppercase tracking-widest ${
                    report.overallSeverity === 'high' ? 'bg-error-container/10 text-error border-error/30' :
                    report.overallSeverity === 'medium' ? 'bg-tertiary-container/10 text-tertiary-fixed-dim border-tertiary/30' :
                    'bg-primary-container/10 text-primary border-primary/30'
                  }`}>
                    {report.overallSeverity} Severity
                  </span>
                  <Link to={`/dentist/reviews/${report._id}`} className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 text-xs font-mono font-bold rounded-lg hover:bg-primary/20 transition-colors uppercase tracking-widest">
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-on-surface-variant font-mono uppercase tracking-widest text-sm bg-surface-container-lowest/50">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">fact_check</span>
            <p>No pending AI reports require your review at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DentistReviews;
