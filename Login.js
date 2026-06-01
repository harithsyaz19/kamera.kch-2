import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(data);
    } catch (e) {
      // 401 is expected when user is not logged in
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true };
    } catch (e) {
      const error = formatApiErrorDetail(e.response?.data?.detail) || e.message;
      return { success: false, error };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        userData,
        { withCredentials: true }
      );
      setUser(data);
      return { success: true };
    } catch (e) {
      const error = formatApiErrorDetail(e.response?.data?.detail) || e.message;
      return { success: false, error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Logout request failed:', e?.message || e);
      }
    } finally {
      setUser(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
