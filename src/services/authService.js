import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const authService = {  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      // Backend returns data nested in response.data.data
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
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};

export default authService;
