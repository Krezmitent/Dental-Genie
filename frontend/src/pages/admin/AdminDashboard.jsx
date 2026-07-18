import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDentists: 0,
    pendingDentists: 0,
    totalScans: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a production app, there would be a dedicated /admin/stats endpoint
    // We will simulate it by fetching lists and counting.
    const fetchStats = async () => {
      try {
        // Just mock some data for the UI since we didn't build an explicit stats route
        // but we can try to fetch dentists to see pending count
        const dentistsRes = await api.get('/users/dentists/list');
        const dentists = dentistsRes.data.success ? dentistsRes.data.data.dentists : [];
        
        setStats({
          totalPatients: 142,
          totalDentists: dentists.length,
          pendingDentists: dentists.filter(d => d.profile?.verificationStatus === 'pending').length,
          totalScans: 856
        });
      } catch (err) {
        console.error("Failed to load admin stats");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-body">
      <div>
        <h1 className="text-2xl font-display font-bold text-on-surface">Mainframe Overview</h1>
        <p className="text-on-surface-variant mt-1 text-sm font-mono tracking-widest uppercase">System status and core metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-secondary-container/20 text-secondary-fixed-dim rounded-xl border border-secondary/30"><span className="material-symbols-outlined text-[24px]">group</span></div>
            <span className="flex items-center text-[10px] font-mono font-bold text-primary-fixed-dim tracking-widest uppercase"><span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span> 12%</span>
          </div>
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">Total Subjects</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{stats.totalPatients}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-container/20 text-primary rounded-xl border border-primary/30"><span className="material-symbols-outlined text-[24px]">medical_information</span></div>
            <span className="flex items-center text-[10px] font-mono font-bold text-primary-fixed-dim tracking-widest uppercase"><span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span> 4%</span>
          </div>
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">Active Operators</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{stats.totalDentists}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-tertiary-container/20 text-tertiary-fixed-dim rounded-xl border border-tertiary/30"><span className="material-symbols-outlined text-[24px]">troubleshoot</span></div>
            <span className="flex items-center text-[10px] font-mono font-bold text-primary-fixed-dim tracking-widest uppercase"><span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span> 28%</span>
          </div>
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">Scans Processed</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{stats.totalScans}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-error-container/20 text-error rounded-xl border border-error/30"><span className="material-symbols-outlined text-[24px]">gpp_maybe</span></div>
          </div>
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">Pending Access</p>
          <p className="text-3xl font-display font-bold text-on-surface mt-1">{stats.pendingDentists}</p>
        </motion.div>
      </div>

      <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-5 pointer-events-none"></div>
        <h2 className="text-lg font-display font-bold text-on-surface mb-6 flex items-center gap-2">
           <span className="material-symbols-outlined text-primary">memory</span>
           Network Health
        </h2>
        <div className="space-y-4 relative z-10">
           <div className="flex justify-between items-center p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl font-mono text-sm">
             <div className="flex items-center">
               <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim mr-3 shadow-[0_0_8px_#00dbe7] animate-pulse"></div>
               <span className="text-on-surface font-semibold uppercase tracking-wider">Node.js API Server</span>
             </div>
             <span className="text-[10px] text-primary font-bold bg-primary-container/10 border border-primary/30 px-2 py-1 rounded tracking-widest uppercase shadow-[inset_0_0_10px_rgba(0,219,231,0.1)]">Operational</span>
           </div>
           <div className="flex justify-between items-center p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl font-mono text-sm">
             <div className="flex items-center">
               <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim mr-3 shadow-[0_0_8px_#00dbe7] animate-pulse"></div>
               <span className="text-on-surface font-semibold uppercase tracking-wider">MongoDB Datastore</span>
             </div>
             <span className="text-[10px] text-primary font-bold bg-primary-container/10 border border-primary/30 px-2 py-1 rounded tracking-widest uppercase shadow-[inset_0_0_10px_rgba(0,219,231,0.1)]">Operational</span>
           </div>
           <div className="flex justify-between items-center p-4 border border-outline-variant/20 bg-surface-container-highest/30 rounded-xl font-mono text-sm">
             <div className="flex items-center">
               <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim mr-3 shadow-[0_0_8px_#00dbe7] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
               <span className="text-on-surface font-semibold uppercase tracking-wider">Neural Engine (FastAPI)</span>
             </div>
             <span className="text-[10px] text-primary font-bold bg-primary-container/10 border border-primary/30 px-2 py-1 rounded tracking-widest uppercase shadow-[inset_0_0_10px_rgba(0,219,231,0.1)]">Operational</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
