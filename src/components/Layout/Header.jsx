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

  const formatRoleDisplay = (role) => {
    switch (role) {
      case 'branch_admin':
        return 'Branch Pastor';
      case 'branch_me':
        return 'Branch ME';
      case 'super_me':
        return 'Super ME';
      case 'zonal_admin':
        return 'Zonal Coordinator';
      case 'intern':
        return 'Internship';
      default:
        return role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Role';
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
        
        {/* Toggler for collapsed mobile navbar */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          {/* Arrange vertically on small screens, horizontally on md+ */}
          <div className="navbar-nav ms-auto d-flex flex-column flex-md-row align-items-center gap-2">
            {/* Greeting hidden on small screens, visible from md and up */}
            <span className="text-white me-0 me-md-3 d-none d-md-inline">
              Welcome, {user?.name}
            </span>
            <span className="badge me-0 me-md-3" style={{ backgroundColor: 'var(--primary-yellow)', color: 'var(--purple-darker)' }}>
              {formatRoleDisplay(user?.role)}
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};export default Header;
