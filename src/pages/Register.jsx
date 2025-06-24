import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordInput from '../components/common/PasswordInput';
import { API_ENDPOINTS, ROLES } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import authDebug from '../utils/authDebug';
import logo from '../assets/evangelion-logo.svg';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  
  // State hooks must be at the top
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    state: '',
    branch: '',
    zone: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
    // API calls for hierarchical data
  const { data: states, loading: statesLoading, error: statesError } = useApi('/api/states', { immediate: true });
  const { data: branches, loading: branchesLoading, execute: fetchBranches, error: branchesError } = useApi(null, { immediate: false });
  const { data: zones, loading: zonesLoading, execute: fetchZones, error: zonesError } = useApi(null, { immediate: false });

  // Effect hooks must be after all state hooks
  // Fetch branches when state changes
  useEffect(() => {
    if (formData.state) {
      fetchBranches(`/api/branches/by-state/${formData.state}`);
      setFormData(prev => ({ ...prev, branch: '', zone: '' }));
    }
  }, [formData.state]);

  // Fetch zones when branch changes
  useEffect(() => {
    if (formData.branch) {
      fetchZones(`/api/zones/by-branch/${formData.branch}`);
      setFormData(prev => ({ ...prev, zone: '' }));
    }
  }, [formData.branch]);

  // Debug logging (after all hooks)
  console.log('Register component debug:', {
    isAuthenticated,
    loading,
    user,
    token: localStorage.getItem('authToken'),
    userInStorage: localStorage.getItem('user')
  });
  
  // Additional debug info
  authDebug.checkState();
  
  // Debug API states
  console.log('API Debug:', {
    states: states,
    statesLoading,
    statesError,
    branches,
    branchesLoading,
    branchesError
  });
  
  // Show loading state while auth is being determined
  if (loading) {
    console.log('Auth is loading, showing spinner...');
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Redirect if already authenticated
  if (!loading && isAuthenticated) {
    console.log('Redirecting authenticated user from register page');
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const roleOptions = [
    { value: 'state_admin', label: 'State Admin', requiresApproval: 'Super Admin' },
    { value: 'branch_admin', label: 'Branch Admin', requiresApproval: 'State Admin' },
    { value: 'zonal_admin', label: 'Zonal Admin', requiresApproval: 'Branch Admin' },
    { value: 'worker', label: 'Worker', requiresApproval: 'Branch Admin' },
    { value: 'registrar', label: 'Registrar', requiresApproval: 'Branch Admin' }
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.state) {
      newErrors.state = 'Please select a state';
    }

    if (!formData.branch && formData.role !== 'state_admin') {
      newErrors.branch = 'Please select a branch';
    }    if (!formData.zone && ['zonal_admin'].includes(formData.role)) {
      newErrors.zone = 'Please select a zone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRegistrationEndpoint = () => {
    switch (formData.role) {
      case 'registrar':
        return '/api/registrars/register';
      case 'worker':
        return '/api/workers/register';
      default:
        return API_ENDPOINTS.AUTH.REGISTER;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        state: formData.state,
        branch: formData.branch || undefined,
        ...(formData.role !== 'registrar' && { zone: formData.zone || undefined })
      };

      const endpoint = getRegistrationEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // Show success message and redirect
      alert('Registration successful! Your account is pending approval.');
      navigate('/login');

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        submit: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
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
                  <p className="text-muted">Create your account</p>
                </div>                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  {/* Error Display */}
                  {errors.submit && (
                    <div className="alert alert-danger mb-3" role="alert">
                      {errors.submit}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Role Selection */}
                  <div className="mb-3">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      id="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select your role</option>
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                    {formData.role && (
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Your registration will require approval from a {roleOptions.find(r => r.value === formData.role)?.requiresApproval}
                      </small>
                    )}
                  </div>

                  {/* State Selection */}
                  <div className="mb-3">
                    <label htmlFor="state" className="form-label">State</label>                    <select
                      className={`form-select ${errors.state ? 'is-invalid' : ''}`}
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={statesLoading}
                      required
                    >
                      <option value="">
                        {statesLoading 
                          ? 'Loading states...' 
                          : statesError 
                          ? 'Error loading states - you can still register'
                          : 'Select your state'
                        }
                      </option>                      {states?.data?.map(state => (
                        <option key={state._id} value={state._id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                  </div>

                  {/* Branch Selection */}
                  {formData.role !== 'state_admin' && (
                    <div className="mb-3">
                      <label htmlFor="branch" className="form-label">Branch</label>
                      <select
                        className={`form-select ${errors.branch ? 'is-invalid' : ''}`}
                        id="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        disabled={!formData.state || branchesLoading}
                        required
                      >
                        <option value="">
                          {!formData.state 
                            ? 'Please select a state first' 
                            : branchesLoading 
                            ? 'Loading branches...' 
                            : 'Select your branch'
                          }
                        </option>                        {branches?.data?.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                      {errors.branch && <div className="invalid-feedback">{errors.branch}</div>}
                    </div>
                  )}                  {/* Zone Selection */}
                  {['zonal_admin'].includes(formData.role) && (
                    <div className="mb-3">
                      <label htmlFor="zone" className="form-label">Zone</label>
                      <select
                        className={`form-select ${errors.zone ? 'is-invalid' : ''}`}
                        id="zone"
                        value={formData.zone}
                        onChange={handleInputChange}
                        disabled={!formData.branch || zonesLoading}
                        required
                      >
                        <option value="">
                          {!formData.branch 
                            ? 'Please select a branch first' 
                            : zonesLoading 
                            ? 'Loading zones...' 
                            : 'Select your zone'
                          }
                        </option>                        {zones?.data?.map(zone => (
                          <option key={zone._id} value={zone._id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      {errors.zone && <div className="invalid-feedback">{errors.zone}</div>}
                    </div>
                  )}

                  {/* Password */}
                  <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'is-invalid' : ''}
                    required
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}

                  {/* Confirm Password */}
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'is-invalid' : ''}
                    required
                  />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>                <div className="text-center">
                  <p className="text-muted mb-0">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-purple)' }}>
                      Sign in
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

export default Register;
