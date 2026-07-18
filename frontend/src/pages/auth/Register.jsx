import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, googleProvider } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, deleteUser } from 'firebase/auth';
import api from '../../utils/api';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { forceSync, user, isAuthenticated, isLoading: isAuthLoading, authError } = useAuth();

  const particlesRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'dentist') navigate('/dentist');
      else navigate('/patient');
    }
    
    // Stop spinning if auth context finishes without a user, or if there is an auth error
    if (!isAuthLoading && !isAuthenticated) {
       setIsLoading(false);
    }
    
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, navigate, isAuthLoading, authError]);

  useEffect(() => {
    if (!particlesRef.current) return;
    const container = particlesRef.current;
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 3 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(particle);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Encryption keys do not match.');
    }
    setIsLoading(true);
    setError('');

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // 2. Prepare payload for our backend
      const payload = {
        name,
        email,
        role,
      };

      if (role === 'dentist') {
        payload.profile = {
          specialization,
          licenseNumber
        };
      }

      // 3. Register user profile in backend Firestore
      await api.post('/auth/register', payload, {
         headers: { Authorization: `Bearer ${idToken}` }
      });

      // 4. Force auth context to sync
      await forceSync();
      // Wait for useEffect to redirect
    } catch (err) {
      // If backend fails but Firebase succeeded, cleanup Firebase user
      if (auth.currentUser && err.response) {
        await deleteUser(auth.currentUser).catch(console.error);
      }
      setError(err.message || err.response?.data?.message || 'Initialization failed.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // AuthContext will automatically register Google users as 'patient'
      // Wait for useEffect to redirect
    } catch (err) {
      setError(err.message || 'Google Registration failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-layer-0 font-body">
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0"></div>
      <div ref={particlesRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden"></div>

      <div className="flex-grow flex items-center justify-center p-4 md:p-8 relative z-10 my-8">
        <div className="glass-panel w-full max-w-md rounded-xl p-8 shadow-[0_0_40px_rgba(0,219,231,0.05)] relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none text-primary-container">
            <span className="material-symbols-outlined text-[150px]" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
          </div>

          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-4xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
              <h1 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary-container tracking-tighter">DENTAL.AI</h1>
            </div>
            <div className="font-mono text-data-label text-on-surface-variant uppercase tracking-widest">[ SYSTEM INITIALIZATION ]</div>
            <p className="text-on-surface-variant mt-2 text-sm">Establish your diagnostic credentials.</p>
          </div>

          {error && (
            <div className="w-full bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg mb-6 text-sm font-mono flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="flex bg-surface-container-high p-1 rounded-lg mb-8 relative z-10 border border-outline-variant/30">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-mono rounded flex items-center justify-center gap-2 transition-all ${role === 'patient' ? 'segment-active text-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setRole('patient')}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              PATIENT
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-mono rounded flex items-center justify-center gap-2 transition-all ${role === 'dentist' ? 'segment-active text-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setRole('dentist')}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              DENTIST
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="font-mono text-data-label text-secondary block mb-1">IDENTIFICATION [NAME]</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">account_circle</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-data-label text-secondary block mb-1">COMMLINK [EMAIL]</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {role === 'dentist' && (
              <div className="border-y border-outline-variant/20 py-4 my-2 bg-primary/5 -mx-8 px-8">
                <div className="font-mono text-xs text-primary-fixed-dim mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  PROFESSIONAL CREDENTIALS
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-data-label text-secondary block mb-1">SPECIALIZATION</label>
                    <div className="relative">
                       <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">psychiatry</span>
                       <select
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          required={role === 'dentist'}
                          className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all appearance-none"
                       >
                          <option value="" disabled className="bg-surface-container">Select Specialty</option>
                          <option value="General Dentistry" className="bg-surface-container">General Dentistry</option>
                          <option value="Orthodontics" className="bg-surface-container">Orthodontics</option>
                          <option value="Periodontics" className="bg-surface-container">Periodontics</option>
                          <option value="Endodontics" className="bg-surface-container">Endodontics</option>
                       </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-data-label text-secondary block mb-1">REGISTRY NUMBER</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">pin</span>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required={role === 'dentist'}
                        className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all"
                        placeholder="e.g. DENT-12345"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-data-label text-secondary block mb-1">ENCRYPTION KEY</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">key</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="font-mono text-data-label text-secondary block mb-1">VERIFY KEY</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded py-2 pl-9 pr-3 text-on-surface font-body text-body-main input-glow focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-primary-container hover:bg-primary text-on-primary-container font-display text-button-text py-3 rounded btn-glow flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 {isLoading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="relative z-10">INITIALIZE ACCOUNT</span>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">how_to_reg</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="w-full flex items-center my-6 relative z-10">
             <div className="flex-grow border-t border-outline-variant/30"></div>
             <span className="mx-4 text-xs font-mono text-on-surface-variant uppercase">OR</span>
             <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          <button
             type="button"
             onClick={handleGoogleLogin}
             disabled={isLoading}
             className="w-full relative z-10 overflow-hidden bg-surface-dim hover:bg-surface-container border border-outline-variant/50 text-on-surface font-display py-3 rounded flex items-center justify-center gap-3 transition-all disabled:opacity-70"
          >
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
             <span>Continue with Google</span>
          </button>

          <div className="mt-8 text-center font-mono text-[10px] text-on-surface-variant uppercase tracking-widest relative z-10">
            SESSION ALREADY ESTABLISHED?{' '}
            <Link to="/login" className="text-primary-container hover:text-primary hover:underline ml-1 block mt-2">
              AUTHENTICATE INSTEAD
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
