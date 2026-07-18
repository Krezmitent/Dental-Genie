import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading, authError } = useAuth();

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

  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait for useEffect to redirect
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
      // Wait for useEffect to redirect
    } catch (err) {
      setError(err.message || 'Google Login failed.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your security key.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-layer-0 font-body">
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="holographic-particle w-[300px] h-[300px] top-[10%] left-[20%] opacity-20"></div>
         <div className="holographic-particle w-[400px] h-[400px] bottom-[20%] right-[10%] opacity-10"></div>
         <div className="holographic-particle w-[200px] h-[200px] top-[40%] right-[30%] opacity-15"></div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        
        <div className="w-full max-w-md">
          <div className="glass-card glow-border rounded-xl p-8 md:p-10 flex flex-col items-center relative overflow-hidden">
            
            <div className="absolute top-4 right-4 font-mono text-[10px] text-primary-fixed-dim opacity-30">
              SYS.AUTH.v3.0
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <span className="font-display text-headline-lg text-primary tracking-tighter">Dental Genie</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl text-on-surface mb-2">Welcome Back</h2>
            <p className="text-on-surface-variant text-sm mb-8 text-center">Initialize session to access diagnostic network</p>

            {error && (
              <div className="w-full bg-error-container/20 border border-error/50 text-error px-4 py-3 rounded-lg mb-6 text-sm font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span className="truncate">{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="w-full bg-primary-container/20 border border-primary/50 text-primary px-4 py-3 rounded-lg mb-6 text-sm font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="truncate">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-data-label text-on-surface-variant uppercase block">OPERATOR ID / EMAIL</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">account_circle</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-outline-variant rounded-lg py-3 pl-10 pr-4 text-on-surface font-mono placeholder:text-on-surface-variant/30 input-glow transition-all"
                    placeholder="operator@network.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-data-label text-on-surface-variant uppercase">SECURITY KEY</label>
                  <button type="button" onClick={handleResetPassword} className="font-mono text-[11px] text-primary-fixed-dim hover:text-primary hover:underline bg-transparent border-none cursor-pointer">Forgot key?</button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-outline-variant rounded-lg py-3 pl-10 pr-4 text-on-surface font-mono placeholder:text-on-surface-variant/30 input-glow transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-primary-container hover:bg-primary text-on-primary-container font-display text-button-text py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="relative z-10">Initiate Uplink</span>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">login</span>
                  </>
                )}
              </button>
            </form>

            <div className="w-full flex items-center my-6">
               <div className="flex-grow border-t border-outline-variant/30"></div>
               <span className="mx-4 text-xs font-mono text-on-surface-variant uppercase">OR</span>
               <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            <button
               type="button"
               onClick={handleGoogleLogin}
               disabled={isLoading}
               className="w-full relative overflow-hidden bg-surface-dim hover:bg-surface-container border border-outline-variant/50 text-on-surface font-display py-3 rounded-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70"
            >
               <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
               <span>Continue with Google</span>
            </button>

            <div className="mt-8 text-center font-mono text-[11px] text-on-surface-variant uppercase">
              Unregistered Node?{' '}
              <Link to="/register" className="text-primary-fixed-dim hover:text-primary hover:underline ml-1">
                Request Access
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
