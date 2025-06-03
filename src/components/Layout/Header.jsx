import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (    <nav className="navbar navbar-expand-lg navbar-dark px-3" style={{ backgroundColor: 'var(--primary-purple)' }}>
      <div className="container-fluid">
        <span className="navbar-brand fw-bold" style={{ color: 'var(--primary-yellow)' }}>EVANGELION</span>
        
        <div className="navbar-nav ms-auto d-flex flex-row align-items-center">
          <span className="text-white me-3">
            Welcome, {user?.firstName || user?.email}
          </span>
          <span className="badge me-3" style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--purple-darker)' }}>
            {user?.role}
          </span>
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};export default Header;
