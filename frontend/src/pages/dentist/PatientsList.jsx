import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PatientsList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        // We fetch the dentist's appointments to extract their unique patients
        const res = await api.get('/appointments?limit=500');
        if (res.data.success) {
          const appointments = res.data.data.appointments;
          
          // Extract unique patients
          const uniquePatientsMap = new Map();
          
          appointments.forEach(app => {
            if (app.patient && app.patient._id) {
              if (!uniquePatientsMap.has(app.patient._id)) {
                uniquePatientsMap.set(app.patient._id, {
                  ...app.patient,
                  lastVisit: app.date,
                  totalVisits: 1
                });
              } else {
                const existing = uniquePatientsMap.get(app.patient._id);
                existing.totalVisits += 1;
                if (new Date(app.date) > new Date(existing.lastVisit)) {
                  existing.lastVisit = app.date;
                }
              }
            }
          });
          
          setPatients(Array.from(uniquePatientsMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (err) {
        console.error("Failed to load patients:", err);
        setError('Failed to load your patients list.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">My Patients</h1>
          <p className="text-on-surface-variant mt-1 text-sm">View and manage your assigned patients.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/30 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-on-surface text-sm transition-colors input-glow"
          />
        </div>
      </div>

      {error && (
        <div className="bg-error-container/20 text-error p-4 rounded-xl border border-error/50 flex items-start text-sm">
          <span className="material-symbols-outlined mr-2 flex-shrink-0">warning</span>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface-container rounded-xl border border-outline-variant/30 p-6 hover:border-primary-fixed-dim/30 hover:bg-surface-container-high transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-container/20 border border-primary/30 text-primary-fixed-dim rounded-full flex items-center justify-center text-lg font-bold font-display uppercase shadow-[inset_0_0_10px_rgba(0,219,231,0.2)]">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-display font-bold text-on-surface text-lg leading-tight">{patient.name}</h3>
                    <p className="text-on-surface-variant text-xs font-mono mt-1">{patient.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6 py-4 border-t border-outline-variant/20">
                <div>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Last Visit</p>
                  <p className="text-sm font-medium text-on-surface mt-1">{new Date(patient.lastVisit).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Total Visits</p>
                  <p className="text-sm font-medium text-on-surface mt-1">{patient.totalVisits}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-outline-variant/20 flex gap-2">
                <button 
                  onClick={() => alert('Medical history view coming soon!')}
                  className="flex-1 py-2 bg-surface-dim hover:bg-surface border border-outline-variant/30 text-on-surface text-xs font-mono tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  History
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">group_off</span>
          <h2 className="text-xl font-display font-bold text-on-surface mb-2">No Patients Found</h2>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            {searchTerm 
              ? `No patients match the search term "${searchTerm}".` 
              : "You haven't seen any patients yet. Once a patient books an appointment with you, they will appear here."}
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
