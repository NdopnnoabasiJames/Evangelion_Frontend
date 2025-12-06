import api from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { sessionUtils } from '../utils/alertUtils';

export const authService = {  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      // Backend returns data with TransformInterceptor: { data: { access_token, user }, timestamp, path }
      const { access_token, user } = response.data.data;
      
      // Store token and user data
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token: access_token };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      console.error('AuthService: Profile fetch error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },
  // Logout user
  logout: (redirect = true) => {
    sessionUtils.clearAuthData();
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Force logout with session cleanup
  forceLogout: (reason = 'Session expired') => {
    sessionUtils.clearAuthData();
    
    // Trigger session expired event
    window.dispatchEvent(new CustomEvent('sessionExpired', {
      detail: { 
        reason: 'expired',
        message: reason
      }
    }));
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    // Basic check for token and user presence
    if (!token || !user) {
      return false;
    }
    
    // Check if token is expired (if possible to decode)
    if (sessionUtils.isTokenExpired()) {
      // Clear expired session data
      sessionUtils.clearAuthData();
      return false;
    }
    
    return true;
  },

  // Validate current session
  validateSession: async () => {
    try {
      if (!authService.isAuthenticated()) {
        return false;
      }
      
      // Make a lightweight request to verify token is still valid
      await api.get(API_ENDPOINTS.AUTH.PROFILE);
      return true;
    } catch (error) {
      // If profile request fails, session is invalid
      if (error.response?.status === 401 || error.response?.status === 403) {
        sessionUtils.clearAuthData();
        return false;
      }
      // For other errors, assume session is still valid
      return true;
    }
  },
  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // If there's malformed data, clear it
      localStorage.removeItem('user');
      return null;
    }
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};

export default authService;
