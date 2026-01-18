import axios from 'axios';
import { logout } from '../services/authService';

export const API_BASE_URL = 'https://targetiq-api.vercel.app/api'; // Change to your API base URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // ❌ not needed for JWT, true = cookies/session
  headers: {
    "Content-Type": "application/json", // ✅ use JSON
    "X-Requested-With": "XMLHttpRequest"
  },
});

// ✅ Helper: read token from localStorage
const getToken = () => localStorage.getItem('access-token');
console.log('getToken:', getToken());
// ✅ Request Interceptor: Attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor: Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (response?.status === 401) {
      if (config.__isRetry) {
        logout();
        return Promise.reject(error);
      }

      config.__isRetry = true;

      if (response.data?.message === 'Token expired') {
        logout();
        window.location.reload();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
