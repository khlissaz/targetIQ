'use client';


import { toast } from '@/hooks/use-toast';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});


apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      
      localStorage.removeItem('access-token');
      
      if (typeof window !== 'undefined' ) {
        toast({ description: 'Session expired. Please log in again.',
          variant: 'destructive'
        });
        window.location.href = '/auth';  
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
