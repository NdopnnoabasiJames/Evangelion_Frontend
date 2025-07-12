import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/evangelion-logo.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
            {user?.role}
          </span>
          <button 
            className="btn btn-outline-light btn-sm d-none d-md-block"
            onClick={handleLogout}
          >
            Logout
          </button>
          
          {/* Mobile hamburger menu */}
          <div className="d-md-none position-relative">
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{ padding: '0.375rem 0.5rem' }}
            >
              <i className="bi bi-list" style={{ fontSize: '1.2rem' }}></i>
            </button>
            
            {/* Mobile dropdown menu */}
            {showMobileMenu && (
              <div 
                className="position-absolute end-0 mt-2 bg-white rounded shadow"
                style={{ 
                  minWidth: '120px',
                  zIndex: 1050,
                  border: '1px solid rgba(0,0,0,0.15)'
                }}
              >
                <button
                  className="btn btn-danger btn-sm w-100 m-1"
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  style={{ fontSize: '0.875rem' }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};export default Header;
