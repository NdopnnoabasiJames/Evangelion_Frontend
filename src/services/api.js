import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Debug logging for API URL
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🏗️ Environment:', import.meta.env.MODE);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log for requests
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not on public pages
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/debug-auth'];
      
      if (!publicPaths.includes(currentPath)) {
        // Unauthorized - redirect to login only for protected pages
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // For public pages, just clear auth data but don't redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
