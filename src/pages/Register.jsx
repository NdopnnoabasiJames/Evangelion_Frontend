import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PasswordInput from '../components/common/PasswordInput';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registration data:', formData);
  };
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-light)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo/Brand */}
                <div className="text-center mb-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: 'var(--primary-purple)',
                      color: 'var(--primary-yellow)'
                    }}
                  >
                    <strong style={{ fontSize: '1.5rem' }}>E</strong>
                  </div>
                  <h3 className="fw-bold" style={{ color: 'var(--primary-purple)' }}>
                    EVANGELION
                  </h3>
                  <p className="text-muted">Create your account</p>
                </div>                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <PasswordInput
                    id="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />

                  <button type="submit" className="btn btn-primary w-100 mb-3">
                    Create Account
                  </button>
                </form>

                <div className="text-center">
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
      </div>
    </div>
  );
};

export default Register;
