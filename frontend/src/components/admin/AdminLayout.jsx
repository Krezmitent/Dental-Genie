import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'User Management', path: '/admin/users', icon: 'manage_accounts' },
    { name: 'System Settings', path: '/admin/settings', icon: 'settings' },
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
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 bg-surface-container-lowest w-64 border-r border-outline-variant/30 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-[20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/30 justify-between lg:justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-container p-1.5 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
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
          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-on-surface truncate">{user?.name}</p>
            <p className="text-[10px] font-mono text-error-container truncate uppercase tracking-widest">Root Administrator</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-primary-container/10 text-primary border-primary/50 shadow-[inset_0_0_15px_rgba(0,219,231,0.15)]'
                    : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface hover:border-outline-variant/30'
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
            className="flex items-center justify-center w-full px-3 py-3 text-sm font-mono tracking-widest text-error rounded-lg bg-error/5 hover:bg-error/15 border border-error/20 hover:border-error/50 hover:shadow-[0_0_15px_rgba(255,180,171,0.2)] transition-all group"
          >
            <span className="material-symbols-outlined w-5 h-5 mr-2 text-[18px] group-hover:-translate-x-1 transition-transform">logout</span>
            SYSTEM EXIT
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 cyber-grid pointer-events-none z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Mobile Topbar */}
        <header className="lg:hidden h-16 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between px-4 sticky top-0 z-30 shadow-lg">
          <div className="flex items-center space-x-2">
             <div className="bg-primary-container p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <span className="text-2xl font-bold font-display text-primary text-glow">Dental Genie</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-on-surface-variant hover:text-primary p-2 -mr-2"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
