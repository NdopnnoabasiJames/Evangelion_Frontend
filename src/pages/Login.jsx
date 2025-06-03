import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/forms/LoginForm';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();

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
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="card-title mb-2">Welcome Back</h2>
                  <p className="text-muted">Sign in to EVANGELION Event Management</p>
                </div>
                
                <LoginForm 
                  onSubmit={handleLogin}
                  loading={loading}
                  error={error}
                />
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Contact your administrator for account access
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
