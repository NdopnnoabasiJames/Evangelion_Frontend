import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/forms/LoginForm';
import logo from '../assets/evangelion-logo.svg';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (formData) => {
    try {
      setLoading(true);
      setError('');
      await login(formData);
      // Navigation will be handled by the Navigate component above
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-light)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">                {/* Logo/Brand */}
                <div className="text-center mb-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center">
                    <img 
                      src={logo} 
                      alt="EVANGELION Logo" 
                      height="50"
                      style={{ 
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        maxWidth: '150px'
                      }}
                    />
                  </div>
                  <p className="text-muted">Sign in to your account</p>
                </div>
                
                <LoginForm 
                  onSubmit={handleLogin}
                  loading={loading}
                  error={error}
                />
                  <div className="text-center mt-4">
                  <p className="text-muted mb-2">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary-purple)' }}>
                      Register here
                    </Link>
                  </p>
                  <Link to="/" className="text-muted small">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple Footer */}
        <footer className="text-center py-3 mt-auto">
          <p className="text-muted small mb-0">
            © 2025 Evangelion Event System. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
