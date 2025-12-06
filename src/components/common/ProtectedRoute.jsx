import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { sessionUtils } from '../../utils/alertUtils';
import Loading from './Loading';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Check session validity on mount and route changes
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Perform session validation
      const validateCurrentSession = async () => {
        try {
          if (!sessionUtils.isSessionValid()) {
            // Session is invalid, trigger logout
            window.dispatchEvent(new CustomEvent('sessionExpired', {
              detail: { 
                reason: 'expired',
                message: 'Session expired'
              }
            }));
          }
        } catch (error) {
          console.warn('Session validation error:', error);
        }
      };

      validateCurrentSession();
    }
  }, [location.pathname, isAuthenticated, loading]);

  if (loading) {
    return <Loading text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Additional session check - if token appears expired, redirect immediately
  if (!sessionUtils.isSessionValid()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
