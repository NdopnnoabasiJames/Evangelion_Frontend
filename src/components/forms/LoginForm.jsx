import React from 'react';
import { useForm } from 'react-hook-form';
import PasswordInput from '../common/PasswordInput';

const LoginForm = ({ onSubmit, loading = false, error = null }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="needs-validation" noValidate>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Email Address
        </label>
        <input
          type="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          id="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          disabled={loading}
        />
        {errors.email && (
          <div className="invalid-feedback">
            {errors.email.message}
          </div>
        )}
      </div>      <PasswordInput
        id="password"
        label="Password"
        register={register}
        validation={{
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        }}
        error={errors.password}
        disabled={loading}
      />

      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};

export default LoginForm;
