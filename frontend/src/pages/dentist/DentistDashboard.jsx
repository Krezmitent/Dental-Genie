import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const DashboardCard = ({ title, value, icon, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl flex items-center justify-center ${colorClass}`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
    </div>
    <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">{title}</p>
    <p className="text-3xl font-display font-bold text-on-surface mt-1">{value}</p>
  </motion.div>
);

const DentistDashboard = () => {
  const [data, setData] = useState({
    todayAppointments: [],
    pendingReviews: [],
    stats: {
      appointmentsToday: 0,
      pendingReviews: 0,
      totalPatients: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch appointments
        const appRes = await api.get('/appointments');
        const appointments = appRes.data.data.appointments;
        
        // Filter for today's approved appointments
        const today = new Date().toDateString();
        const todayApps = appointments.filter(app => 
          new Date(app.date).toDateString() === today && app.status === 'approved'
        );

        // Fetch reports (we'll fetch all reports for this dentist's patients, or system-wide if not scoped yet. 
        // For now, let's fetch pending reports from the system that need review.
        // Assume backend has a route or just filter from a general reports fetch.
        // Since we don't have a specific dentist report list route, we'll just mock the stats for the demo if it fails,
        // or just rely on what we can get.)
        
        // Let's assume a future endpoint or just hardcode some stats if we can't get them.
        setData({
          todayAppointments: todayApps,
          pendingReviews: [], // Implement actual fetch if endpoint exists
          stats: {
            appointmentsToday: todayApps.length,
            pendingReviews: 0, // Placeholder
            totalPatients: 0 // Placeholder
          }
        });
      } catch (err) {
        console.error("Failed to load dentist dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-container rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-surface-container rounded-xl border border-outline-variant/30"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Operator Console</h1>
        <p className="text-on-surface-variant mt-1 text-sm">System overview and daily metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="Today's Uplinks"
          value={data.stats.appointmentsToday}
          icon="calendar_month"
          colorClass="bg-primary-container/20 text-primary border border-primary/30 shadow-[inset_0_0_15px_rgba(0,219,231,0.2)]"
        />
        
        <DashboardCard 
          title="Pending Analysis"
          value={data.stats.pendingReviews}
          icon="fact_check"
          colorClass="bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary/30 shadow-[inset_0_0_15px_rgba(254,216,58,0.1)]"
        />

        <DashboardCard 
          title="Total Subjects"
          value={data.stats.totalPatients}
          icon="groups"
          colorClass="bg-secondary-container/20 text-secondary-fixed-dim border border-secondary/30 shadow-[inset_0_0_15px_rgba(20,209,255,0.1)]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-on-surface">Today's Schedule</h2>
            <Link to="/dentist/appointments" className="text-sm font-mono text-primary hover:text-primary-fixed-dim uppercase tracking-wider">View Calendar</Link>
          </div>
          
          {data.todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {data.todayAppointments.map(app => (
                <div key={app._id} className="flex items-center justify-between p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center">
                    <div className="bg-primary/10 text-primary w-12 h-12 rounded-lg flex items-center justify-center mr-4 border border-primary/20">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-on-surface">{app.patient?.name || 'Patient'}</p>
                      <p className="text-xs font-mono text-on-surface-variant mt-1 tracking-widest">{app.timeSlot}</p>
                    </div>
                  </div>
                  <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3">calendar_month</span>
              <p className="text-on-surface-variant text-sm font-mono uppercase tracking-widest">No scheduled uplinks today.</p>
            </div>
          )}
        </div>

        {/* Pending AI Reviews */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-on-surface">Pending Verification</h2>
            <Link to="/dentist/reviews" className="text-sm font-mono text-primary hover:text-primary-fixed-dim uppercase tracking-wider">View All</Link>
          </div>
          
          {data.pendingReviews.length > 0 ? (
            <div className="space-y-4">
              {data.pendingReviews.map(review => (
                <div key={review._id} className="flex items-center justify-between p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-layer-0 rounded-lg overflow-hidden mr-4 border border-outline-variant/30 relative">
                       <img src={review.imageUrl} className="w-full h-full object-cover mix-blend-screen opacity-80" alt="Scan" />
                       <div className="absolute inset-0 bg-primary/10"></div>
                    </div>
                    <div>
                      <p className="font-display font-bold text-on-surface">{review.patient?.name || 'Patient'}</p>
                      <p className="text-[10px] font-mono text-tertiary-fixed-dim font-bold tracking-widest uppercase mt-1">{review.overallSeverity} SEVERITY</p>
                    </div>
                  </div>
                  <Link to={`/dentist/reviews/${review._id}`} className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/30 text-xs font-mono font-bold rounded-lg hover:bg-primary/20 transition-colors uppercase tracking-widest">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-3">fact_check</span>
              <p className="text-on-surface-variant text-sm font-mono uppercase tracking-widest">No pending reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentistDashboard;
