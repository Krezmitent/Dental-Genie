import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const PatientLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: 'dashboard' },
    { name: 'AI Diagnosis', path: '/patient/diagnosis', icon: 'radiology' },
    { name: 'Appointments', path: '/patient/appointments', icon: 'calendar_month' },
    { name: 'Medical History', path: '/patient/history', icon: 'history' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-layer-0 flex font-body text-on-surface">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 bg-surface-container-lowest w-64 border-r border-outline-variant/30 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/30 justify-between lg:justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-container p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-primary">
              Dental Genie
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-4 py-6 border-b border-outline-variant/20 flex items-center space-x-3 bg-surface-container/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-on-surface truncate">{user?.name}</p>
            <p className="text-[11px] font-mono text-on-surface-variant truncate uppercase tracking-wider">Patient Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors border ${
                  isActive
                    ? 'bg-primary-container/10 text-primary border-primary/50 shadow-[inset_0_0_10px_rgba(0,219,231,0.1)]'
                    : 'text-on-surface-variant border-transparent hover:bg-surface-container-high hover:text-on-surface border-outline-variant/0 hover:border-outline-variant/30'
                }`
              }
            >
              <span className="material-symbols-outlined w-6 h-6 mr-3 flex-shrink-0 text-[20px]">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-3 py-3 text-sm font-medium text-error rounded-xl hover:bg-error/10 border border-transparent hover:border-error/30 transition-colors group"
          >
            <span className="material-symbols-outlined w-5 h-5 mr-2 text-[20px] group-hover:-translate-x-1 transition-transform">logout</span>
            Terminate Session
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 grid-pattern pointer-events-none opacity-50 z-0"></div>
        
        {/* Mobile Topbar */}
        <header className="lg:hidden h-16 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
             <div className="bg-primary-container p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <span className="text-2xl font-bold font-display text-primary">Dental Genie</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-on-surface-variant hover:text-primary p-2 -mr-2"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          {/* Render child routes here */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PatientLayout;
