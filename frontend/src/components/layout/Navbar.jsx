import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'dentist': return '/dentist/dashboard';
      default: return '/patient/dashboard';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-brand-500 p-2 rounded-lg group-hover:bg-brand-600 transition-colors">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Dental<span className="text-brand-600">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Home</Link>
            <Link to="/about" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">About AI</Link>
            <Link to="/dentists" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Our Dentists</Link>
            
            <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={getDashboardLink()}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                      <User className="w-4 h-4" />
                    </div>
                    <span>{user.name}</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="text-slate-600 font-medium hover:text-brand-600 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-brand-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 hover:text-brand-600 p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-fade-in shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50" onClick={() => setIsMobileMenuOpen(false)}>About AI</Link>
            <Link to="/dentists" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50" onClick={() => setIsMobileMenuOpen(false)}>Our Dentists</Link>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={getDashboardLink()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-brand-600 bg-brand-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="mt-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-3 px-3">
                  <Link 
                    to="/login"
                    className="w-full text-center text-brand-600 font-medium py-2.5 border border-brand-200 rounded-lg hover:bg-brand-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/register"
                    className="w-full text-center bg-brand-600 text-white font-medium py-2.5 rounded-lg hover:bg-brand-700 shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
