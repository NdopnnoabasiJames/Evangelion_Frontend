import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        if (currentUser && token) {
          try {
            // Fetch the full user profile with populated hierarchy data
            const profileResponse = await authService.getProfile();
            const fullUser = profileResponse.data;
            
            // Normalize user data structure - flatten if nested in data property
            const normalizedUser = fullUser.data || fullUser;
            
            // Update localStorage with the normalized user data
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            
            setUser(normalizedUser);
            setIsAuthenticated(true);
          } catch (profileError) {
            console.error('Failed to fetch user profile:', profileError);
            // If profile fetch fails, fall back to stored user data
            setUser(currentUser);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }} catch (error) {
        console.error('Auth initialization error:', error);
        // Don't redirect during initialization, just clear data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);
  const login = async (credentials) => {
    try {
      setLoading(true);
      const { user: userData } = await authService.login(credentials);
      
      // After login, fetch the full user profile with populated hierarchy data
      try {
        const profileResponse = await authService.getProfile();
        const fullUser = profileResponse.data;
            
        // Normalize user data structure - flatten if nested in data property
        const normalizedUser = fullUser.data || fullUser;
        
        // Update localStorage with the normalized user data
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        return normalizedUser;
      } catch (profileError) {
        console.error('Failed to fetch user profile after login:', profileError);
        // Fall back to login response data
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      }
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
    const userRole = user?.role || user?.data?.role;
    return userRole === role;
  };

  const hasAnyRole = (roles) => {
    const userRole = user?.role || user?.data?.role;
    return roles.includes(userRole);
  };

  const value = {
    user,
    setUser, // Add setUser to the exported context
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
