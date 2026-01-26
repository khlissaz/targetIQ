'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  [key: string]: any;
}
interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: any;
}
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const user = await apiFetch<User>('/users/me');
console.log(user);
      setUser(user);
      console.log('Loaded user:', user);
      await loadProfile(user.id);
    } catch {
      console.log('Invalid token, signing out');

      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    try {
      const profile = await apiFetch<Profile>(`/users/${userId}`);
      setProfile(profile);
    } catch {
      setProfile(null);
    }
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
    setUser(res.user);
    await loadProfile(res.user.id);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      }
    );
    localStorage.setItem('token', res.access_token);
    setUser(res.user);
    await loadProfile(res.user.id);
  };

  const signOut = async () => {
    localStorage.removeItem('access-token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
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
