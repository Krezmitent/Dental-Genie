import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const DashboardCard = ({ title, value, subtitle, icon, colorClass, linkTo, linkText }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 flex flex-col hover:border-primary-fixed-dim/30 transition-colors"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl flex items-center justify-center ${colorClass}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
    <h3 className="text-on-surface-variant font-mono text-xs uppercase tracking-widest mb-1">{title}</h3>
    <div className="flex items-baseline space-x-2">
      <span className="text-3xl font-display font-bold text-on-surface">{value}</span>
      {subtitle && <span className="text-xs text-on-surface-variant font-mono">{subtitle}</span>}
    </div>
    <div className="mt-6 pt-4 border-t border-outline-variant/20 flex-grow flex items-end">
      <Link to={linkTo} className="text-primary hover:text-primary-fixed-dim text-sm font-medium flex items-center group">
        {linkText}
        <span className="material-symbols-outlined text-[18px] ml-1 transform group-hover:translate-x-1 transition-transform">chevron_right</span>
      </Link>
    </div>
  </motion.div>
);

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    recentReports: [],
    upcomingAppointments: [],
    stats: {
      totalReports: 0,
      upcomingCount: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/users/${user._id}/medical-history`);
        
        if (res.data.success) {
          const { diagnosisReports, appointments } = res.data.data;
          
          const now = new Date();
          const upcoming = appointments.filter(app => new Date(app.date) >= now && app.status !== 'cancelled').slice(0, 3);
          
          setData({
            recentReports: diagnosisReports.slice(0, 3),
            upcomingAppointments: upcoming,
            stats: {
              totalReports: diagnosisReports.length,
              upcomingCount: appointments.filter(app => new Date(app.date) >= now && app.status !== 'cancelled').length
            }
          });
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user._id]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-container rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-surface-container rounded-xl border border-outline-variant/30"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-body">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Here is an overview of your oral health journey.</p>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="AI Diagnoses"
          value={data.stats.totalReports}
          subtitle="total scans"
          icon="analytics"
          colorClass="bg-primary-container/20 text-primary-fixed-dim border border-primary/30 shadow-[inset_0_0_15px_rgba(0,219,231,0.2)]"
          linkTo="/patient/diagnosis"
          linkText="New AI Scan"
        />
        <DashboardCard 
          title="Appointments"
          value={data.stats.upcomingCount}
          subtitle="scheduled"
          icon="calendar_month"
          colorClass="bg-secondary-container/20 text-secondary-fixed-dim border border-secondary/30"
          linkTo="/patient/appointments"
          linkText="Manage appointments"
        />
        <DashboardCard 
          title="Prescriptions"
          value="0"
          subtitle="active"
          icon="medication"
          colorClass="bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary/30"
          linkTo="/patient/history"
          linkText="View medical history"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent AI Scans */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-on-surface">Recent Scans</h2>
            <Link to="/patient/diagnosis" className="text-sm font-medium text-primary hover:text-primary-fixed-dim">View all</Link>
          </div>
          
          {data.recentReports.length > 0 ? (
            <div className="space-y-4">
              {data.recentReports.map(report => (
                <div key={report._id} className="flex items-center p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl hover:bg-surface-container-high transition-colors">
                  <div className="w-12 h-12 bg-surface-dim rounded-lg overflow-hidden flex-shrink-0 mr-4 border border-outline-variant/30">
                    <img src={report.imageUrl} alt="Dental scan" className="w-full h-full object-cover mix-blend-screen opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      Scan on {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono uppercase tracking-wider mt-1">
                      Status: <span className={
                        report.status === 'completed' ? 'text-primary-fixed-dim font-bold' : 
                        report.status === 'reviewed' ? 'text-secondary-fixed-dim font-bold' : 
                        report.status === 'processing' ? 'text-tertiary-fixed-dim font-bold' : 'text-error font-bold'
                      }>{report.status}</span>
                    </p>
                  </div>
                  <Link to={`/patient/diagnosis/${report._id}`} className="ml-4 p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-outline">radiology</span>
              </div>
              <p className="text-on-surface-variant text-sm mb-4">You haven't uploaded any scans yet.</p>
              <Link to="/patient/diagnosis" className="inline-flex items-center px-4 py-2 bg-primary-container/10 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors">
                Start Free Analysis
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-bold text-on-surface">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-sm font-medium text-primary hover:text-primary-fixed-dim">View calendar</Link>
          </div>
          
          {data.upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingAppointments.map(app => (
                <div key={app._id} className="flex items-start p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl hover:bg-surface-container-high transition-colors">
                  <div className="flex flex-col items-center justify-center bg-primary-container/10 border border-primary/20 text-primary w-14 h-14 rounded-xl flex-shrink-0 mr-4 font-mono">
                    <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{new Date(app.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0 mt-1">
                    <p className="text-sm font-bold text-on-surface truncate">
                      Dr. {app.dentist?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-on-surface-variant font-mono">
                      <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                      {app.timeSlot}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center mt-1">
                    <span className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full border ${
                      app.status === 'approved' ? 'bg-primary-container/20 text-primary border-primary/50' : 'bg-tertiary-container/20 text-tertiary-fixed-dim border-tertiary/50'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-outline">calendar_month</span>
              </div>
              <p className="text-on-surface-variant text-sm mb-4">No upcoming appointments scheduled.</p>
              <Link to="/patient/appointments" className="inline-flex items-center px-4 py-2 bg-primary-container/10 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors">
                Book Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default PatientDashboard;
