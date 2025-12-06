import React, { useState } from 'react';

const PasswordInput = ({ 
  id, 
  label, 
  placeholder, 
  required = false, 
  disabled = false,
  className = '',
  register = null, // For react-hook-form
  validation = {},
  error = null,
  value,
  onChange,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine input props based on whether using react-hook-form or not
  const inputProps = register 
    ? register(id, validation)
    : { value, onChange, ...props };

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <div className="position-relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
          id={id}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{ paddingRight: '45px' }}
          {...inputProps}
        />
        <button
          type="button"
          className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 border-0 bg-transparent"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          style={{ 
            zIndex: 5,
            color: 'var(--bs-secondary)',
            textDecoration: 'none',
            pointerEvents: 'auto',
            width: '40px',
            height: '100%',
            right: '0'
          }}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </button>
      </div>
      {error && (
        <div className="invalid-feedback">
          {error.message || error}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
