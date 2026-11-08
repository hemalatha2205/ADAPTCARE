import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthLoginRequest = error.config?.url?.includes('/auth/login');
    const message = error.response?.data?.message || error.message || 'An error occurred';

    if (error.response?.status === 401) {
      // For login endpoint, let LoginPage handle credential errors specifically
      if (!isAuthLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        toast.error('Session expired. Please login again.');
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      if (!isAuthLoginRequest) {
        toast.error('Network Error: Unable to reach the server. Please verify the backend is running.');
      }
    } else if (error.response?.status !== 404 && !isAuthLoginRequest) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
