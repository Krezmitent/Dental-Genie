import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const syncUserWithBackend = async (idToken, firebaseUser) => {
    try {
      setAuthError('');
      const res = await api.post('/auth/login', {}, { headers: { Authorization: `Bearer ${idToken}` } });
      if (res.data.success) {
        setUser(res.data.data.user);
      }
    } catch (apiError) {
      if (apiError.response && apiError.response.status === 404) {
        // If 404 and Google Auth, auto-register as patient
        const isGoogle = firebaseUser?.providerData?.some(p => p.providerId === 'google.com');
        if (isGoogle) {
           try {
             const regRes = await api.post('/auth/register', {
               name: firebaseUser.displayName || 'New User',
               role: 'patient'
             }, { headers: { Authorization: `Bearer ${idToken}` } });
             if (regRes.data.success) {
               setUser(regRes.data.data.user);
             }
           } catch (regError) {
             console.error('Failed to auto-register Google user', regError);
             setAuthError(regError.response?.data?.message || 'Failed to complete registration.');
             await handleLogout();
           }
        } else {
           // Not Google, wait for manual registration to complete.
           // Setting error or logging out here interrupts the Register.jsx flow.
           setUser(null);
        }
      } else {
        console.error("Auth backend sync failed:", apiError);
        setAuthError(apiError.response?.data?.message || 'Server error during authentication.');
        await handleLogout();
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('token', idToken);
          await syncUserWithBackend(idToken, firebaseUser);
        } catch (error) {
          console.error("Firebase token fetch failed:", error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Provide a way for Register.jsx to trigger a re-sync after manual registration
  const forceSync = async () => {
    if (auth.currentUser) {
       const idToken = await auth.currentUser.getIdToken();
       await syncUserWithBackend(idToken, auth.currentUser);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    authError,
    logout: handleLogout,
    updateProfile,
    forceSync,
    isPatient: user?.role === 'patient',
    isDentist: user?.role === 'dentist',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
