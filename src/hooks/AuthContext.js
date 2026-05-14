import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  loginUser,
  loginWithGoogleToken,
  registerUser,
  updateCurrentUser,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredToken()
      .then(async (token) => {
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const currentUser = await fetchCurrentUser();
          setUser(currentUser);
        } catch (_error) {
          await clearStoredToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const payload = await loginUser(email, password);
    setUser(payload.user);
    return payload;
  };

  const register = async (email, password, name = '') => {
    const payload = await registerUser(email, password, name);
    setUser(payload.user);
    return payload;
  };

  const loginWithGoogle = async (idToken) => {
    const payload = await loginWithGoogleToken(idToken);
    setUser(payload.user);
    return payload;
  };

  const refreshUser = async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const updateProfile = async (body) => {
    const updatedUser = await updateCurrentUser(body);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    await clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, refreshUser, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
