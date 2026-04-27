'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiError, apiFetch, getAuthMe, type AuthMeDto } from '@/lib/api';
import { safeLog } from '@/lib/safeLogging';

interface User {
  id: string;
  email: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  me: AuthMeDto | null;
  activeBusinessId: string | null;
  capabilities: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  provisionWorkspace: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<AuthMeDto | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const decodeJwt = (token: string): any | null => {
    try {
      const parts = String(token || '').split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const setStateFromMe = (me: AuthMeDto) => {
    setMe(me);
    setUser(me.user as any);
    setCapabilities(Array.isArray(me.capabilities) ? me.capabilities : []);

    const resolvedBusinessId = me.activeBusinessId ?? null;
    setActiveBusinessId(resolvedBusinessId);
    if (resolvedBusinessId) {
      localStorage.setItem('active-business-id', resolvedBusinessId);
    }
  };

  const checkUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
    if (!token) {
      setUser(null);
      setMe(null);
      setActiveBusinessId(null);
      setCapabilities([]);
      setLoading(false);
      return;
    }
    try {
      const me = await getAuthMe();
      setStateFromMe(me);
    } catch (err: any) {
      // Allow onboarding for users who are authenticated but have no business memberships yet.
      if (err instanceof ApiError && err.status === 403) {
        const code = typeof err.data === 'object' && err.data && typeof (err.data as any).code === 'string' ? String((err.data as any).code) : '';
        if (code === 'NOT_MEMBER') {
          const payload = decodeJwt(token);
          setUser(payload?.sub ? { id: payload.sub, email: payload.email, role: payload.role } : null);
          setMe(null);
          setActiveBusinessId(null);
          setCapabilities([]);
          setLoading(false);
          return;
        }
      }

      safeLog('warn', 'auth.invalidToken', { action: 'signOut' });
      setUser(null);
      setMe(null);
      setActiveBusinessId(null);
      setCapabilities([]);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    localStorage.setItem('access-token', res.access_token);
    try {
      const me = await getAuthMe();
      setStateFromMe(me);
      return me.activeBusinessId ?? null;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        const code = typeof err.data === 'object' && err.data && typeof (err.data as any).code === 'string' ? String((err.data as any).code) : '';
        if (code === 'NOT_MEMBER') {
          const payload = decodeJwt(res.access_token);
          setUser(payload?.sub ? { id: payload.sub, email: payload.email, role: payload.role } : null);
          setMe(null);
          setActiveBusinessId(null);
          setCapabilities([]);
          return null;
        }
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }
    );
    localStorage.setItem('access-token', res.access_token);
    try {
      const me = await getAuthMe();
      setStateFromMe(me);
      return me.activeBusinessId ?? null;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        const code = typeof err.data === 'object' && err.data && typeof (err.data as any).code === 'string' ? String((err.data as any).code) : '';
        if (code === 'NOT_MEMBER') {
          const payload = decodeJwt(res.access_token);
          setUser(payload?.sub ? { id: payload.sub, email: payload.email, role: payload.role } : null);
          setMe(null);
          setActiveBusinessId(null);
          setCapabilities([]);
          return null;
        }
      }
      throw err;
    }
  };

  const provisionWorkspace = async () => {
    const res = await apiFetch<{ success: boolean; activeBusinessId: string | null }>('/auth/provision-workspace', {
      method: 'POST',
    });
    const me = await getAuthMe();
    setStateFromMe(me);
    return res.activeBusinessId ?? me.activeBusinessId ?? null;
  };

  const signOut = async () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('active-business-id');
    setUser(null);
    setMe(null);
    setActiveBusinessId(null);
    setCapabilities([]);
  };

  return (
    <AuthContext.Provider value={{ user, me, activeBusinessId, capabilities, loading, signIn, signUp, provisionWorkspace, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
