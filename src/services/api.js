import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

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
    const status = error.response?.status;
    
    // Handle authentication errors (401) and authorization errors (403)
    if (status === 401 || status === 403) {
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register', '/debug-auth'];
      
      // Only handle session expiration on protected pages
      if (!publicPaths.includes(currentPath)) {
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Show user-friendly notification
        if (window.showNotification) {
          const message = status === 401 
            ? 'Your session has expired. Please log in again.' 
            : 'You do not have permission to access this resource. Please log in again.';
          window.showNotification(message, 'error', 5000);
        }
        
        // Trigger custom event for auth context to listen to
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { 
            reason: status === 401 ? 'expired' : 'forbidden',
            message: status === 401 
              ? 'Session expired' 
              : 'Access forbidden'
          }
        }));
        
        // Delay redirect slightly to allow notification to show
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
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
