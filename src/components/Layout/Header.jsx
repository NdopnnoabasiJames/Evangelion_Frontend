import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/evangelion-logo.svg';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (    <nav className="navbar navbar-expand-lg navbar-dark px-3" style={{ backgroundColor: 'var(--primary-purple)' }}>
      <div className="container-fluid">        <div className="navbar-brand d-flex align-items-center fw-bold">
          <img 
            src={logo} 
            alt="EVANGELION Logo" 
            height="32"
            className="me-2"
            style={{ 
              maxWidth: '120px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
            }}
          />
          {/* <span className="text-white d-none d-md-inline">EVANGELION</span> */}
        </div>
        
        <div className="navbar-nav ms-auto d-flex flex-row align-items-center">
          <span className="text-white me-3">
            Welcome, {user?.name}
          </span>
          <span className="badge me-3" style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--purple-darker)' }}>
            {user?.currentRole || user?.role}
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
