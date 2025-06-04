import React from 'react';
import { useAuth } from '../hooks/useAuth';
import authDebug from '../utils/authDebug';

const DebugAuth = () => {
  const { isAuthenticated, loading, user } = useAuth();

  const handleClearAuth = () => {
    authDebug.clearAll();
    window.location.reload();
  };

  const handleCheckState = () => {
    authDebug.checkState();
  };

  const handleSetTestData = () => {
    authDebug.setTestData();
    window.location.reload();
  };

  return (
    <div className="container mt-5">
      <h2>Authentication Debug</h2>
      
      <div className="card mt-3">
        <div className="card-body">
          <h5 className="card-title">Current Auth State</h5>
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user) : 'None'}</p>
          <p><strong>Token in localStorage:</strong> {localStorage.getItem('authToken') || 'None'}</p>
          <p><strong>User in localStorage:</strong> {localStorage.getItem('user') || 'None'}</p>
        </div>
      </div>

      <div className="mt-3">
        <button className="btn btn-primary me-2" onClick={handleCheckState}>
          Check Auth State (Console)
        </button>
        <button className="btn btn-warning me-2" onClick={handleClearAuth}>
          Clear Auth Data
        </button>
        <button className="btn btn-info me-2" onClick={handleSetTestData}>
          Set Test Auth Data
        </button>
      </div>

      <div className="mt-3">
        <a href="/register" className="btn btn-success me-2">Go to Register</a>
        <a href="/login" className="btn btn-secondary">Go to Login</a>
      </div>
    </div>
  );
};

export default DebugAuth;
