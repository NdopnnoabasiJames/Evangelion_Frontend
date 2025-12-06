/**
 * Utility functions for handling session expiration and authentication alerts
 */

// Session management utilities
export const sessionUtils = {
  /**
   * Clear all authentication data from localStorage
   */
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Check if user session is valid based on stored data
   */
  isSessionValid: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get time until token expires (if stored in token payload)
   * Returns null if token is invalid or doesn't contain exp claim
   */
  getTokenExpirationTime: () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      // Decode JWT payload (basic decode without verification)
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: () => {
    const expirationTime = sessionUtils.getTokenExpirationTime();
    if (!expirationTime) return false;
    return new Date() >= expirationTime;
  }
};

// Alert/notification utilities
export const alertUtils = {
  /**
   * Show session expiration notification
   */
  showSessionExpiredAlert: (reason = 'expired') => {
    const messages = {
      expired: 'Your session has expired. Please log in again.',
      forbidden: 'You do not have permission to access this resource. Please log in again.',
      invalid: 'Your session is no longer valid. Please log in again.'
    };

    const message = messages[reason] || messages.expired;
    
    if (window.showNotification) {
      window.showNotification(message, 'error', 5000);
    } else {
      // Fallback to browser alert if toast system not available
      alert(message);
    }
  },

  /**
   * Show success notification for successful login
   */
  showLoginSuccess: (username) => {
    const message = username 
      ? `Welcome back, ${username}!` 
      : 'Successfully logged in!';
    
    if (window.showNotification) {
      window.showNotification(message, 'success', 3000);
    }
  },

  /**
   * Show logout notification
   */
  showLogoutSuccess: () => {
    if (window.showNotification) {
      window.showNotification('You have been logged out successfully.', 'info', 3000);
    }
  },

  /**
   * Show warning for session about to expire
   */
  showSessionWarning: (minutesLeft) => {
    const message = `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`;
    
    if (window.showNotification) {
      window.showNotification(message, 'warning', 8000);
    }
  }
};

// Session event handlers
export const sessionEventHandlers = {
  /**
   * Handle session expiration event
   */
  handleSessionExpired: (event) => {
    const { reason, message } = event.detail || {};
    
    // Clear auth data
    sessionUtils.clearAuthData();
    
    // Show notification
    alertUtils.showSessionExpiredAlert(reason);
    
    // Trigger logout in auth context if available
    if (window.triggerLogout) {
      window.triggerLogout();
    }
  },

  /**
   * Set up session expiration event listener
   */
  setupSessionListener: () => {
    window.addEventListener('sessionExpired', sessionEventHandlers.handleSessionExpired);
    
    return () => {
      window.removeEventListener('sessionExpired', sessionEventHandlers.handleSessionExpired);
    };
  }
};

// Export all utilities as default
export default {
  session: sessionUtils,
  alert: alertUtils,
  events: sessionEventHandlers
};