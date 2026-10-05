import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../config/api';

const ClientAuthContext = createContext();

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) throw new Error('useClientAuth must be used within a ClientAuthProvider');
  return context;
};

export const ClientAuthProvider = ({ children }) => {
  const [clientUser, setClientUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('clientToken');
    const stored = localStorage.getItem('clientUser');
    if (token && stored) {
      try {
        // Keep admin keys in sync so shared admin pages remain authenticated.
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', stored);
        setClientUser(JSON.parse(stored));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiFetch('api/client/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Login failed' };
      }
      localStorage.setItem('clientToken', data.token);
      localStorage.setItem('clientUser', JSON.stringify(data.user));
      // Mirror into admin session keys so shared admin pages work for client admins.
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      setClientUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setClientUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <ClientAuthContext.Provider value={{ clientUser, loading, isAuthenticated, login, logout, setClientUser }}>
      {children}
    </ClientAuthContext.Provider>
  );
};
