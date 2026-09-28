import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(true);

  useEffect(() => {
    restoreSession();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetchApi('/api/health');
      if (res.success && res.data && res.data.signupEnabled !== undefined) {
        setSignupEnabled(res.data.signupEnabled);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const restoreSession = async () => {
    const token = localStorage.getItem('gov_asset_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetchApi('/api/auth/me');
      if (res.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      localStorage.removeItem('gov_asset_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (res.success) {
      localStorage.setItem('gov_asset_token', res.data.token);
      setUser(res.data.user);
      return res; // Return full response to match service expectations
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem('gov_asset_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signupEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
