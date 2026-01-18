
'use client';
/// <reference types="chrome" />
import { useEffect, useCallback, useState } from 'react';
import {
  isAuthenticated as checkAuth,
  logout as logoutService,
  getMe,
  login,
} from '../services/authService';

// ✅ Helper function for token handling
const TOKEN_KEY = 'access-token';

const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Effect to check authentication on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      checkAuth()
        .then((isAuth) => {
          if (isAuth) {
            getMe()
              .then((userDetails) => {
                setIsAuthenticated(true);
                setUser(userDetails);
              })
              .catch(() => {
                handleLogout(); // If fetching user fails, log out
              });
          } else {
            handleLogout();
          }
        })
        .catch(() => {
          handleLogout();
        });
    } else {
      handleLogout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const res = await login(email, password);
      console.log('Login response:', res);
      if (res.success) {
        setToken(res.access_token);
        const userDetails = await getMe();
        console.log('User details:', userDetails);
        setIsAuthenticated(true);
        setUser(userDetails);
      }
      return res;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  // ✅ Handle Logout
  const handleLogout = useCallback(() => {
    logoutService();
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return {
    isAuthenticated,
    user,
    login: handleLogin,
    logout: handleLogout,
  };
};
