import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log('=== Auth Initialization Starting ===');
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        console.log('Auth init - token:', token);
        console.log('Auth init - currentUser:', currentUser);
        
        if (currentUser && token) {
          console.log('Setting user as authenticated');
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          console.log('No valid auth data found, user remains unauthenticated');
          setUser(null);
          setIsAuthenticated(false);
        }      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't redirect during initialization, just clear data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const { user: userData } = await authService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    authService.logout(true); // Pass true to allow redirect
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
