import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/evangelion-logo.svg';

const Landing = () => {
  return (
    <div className="min-vh-100">      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ backgroundColor: 'var(--primary-purple)' }}>
        <div className="container">          <Link className="navbar-brand d-flex align-items-center fw-bold text-white" to="/" style={{ fontSize: '1.25rem' }}>
            <img 
              src={logo} 
              alt="EVANGELION Logo" 
              height="32"
              className="me-2"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                maxWidth: '120px'
              }}
            />
          </Link>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            style={{ borderColor: 'var(--primary-yellow)' }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">            <div className="navbar-nav ms-auto d-flex align-items-center gap-2">
              <Link 
                to="/login" 
                className="btn fw-semibold px-4 py-2"
                style={{ 
                  color: 'white',
                  border: '2px solid white',
                  backgroundColor: 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = 'var(--primary-purple)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Login
              </Link>              <Link 
                to="/register" 
                className="btn fw-semibold px-4 py-2"
                style={{ 
                  backgroundColor: 'var(--primary-yellow)',
                  color: 'var(--primary-purple)',
                  border: '2px solid var(--primary-yellow)',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = 'white';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'var(--primary-yellow)';
                  e.target.style.borderColor = 'var(--primary-yellow)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--primary-purple)' }}>
                EVANGELION
                <span className="d-block" style={{ color: 'var(--primary-yellow)' }}>
                  Event Management
                </span>
              </h1>
              <p className="lead mb-4 text-muted">
                Streamline your church events with our comprehensive management system. 
                From guest registration to check-ins, manage everything in one place.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div 
                className="bg-white rounded shadow-lg p-5 text-center"
                style={{ border: `2px solid var(--primary-yellow)` }}
              >
                <div 
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                  style={{ 
                    width: '100px', 
                    height: '100px',
                    backgroundColor: 'var(--primary-purple)',
                    color: 'var(--primary-yellow)'
                  }}
                >
                  <i className="bi bi-calendar-event" style={{ fontSize: '3rem' }}></i>
                </div>
                <h3 style={{ color: 'var(--primary-purple)' }}>
                  Manage Church Events Efficiently
                </h3>
                <p className="text-muted">
                  Complete event lifecycle management for churches and religious organizations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="fw-bold" style={{ color: 'var(--primary-purple)' }}>
                Key Features
              </h2>
              <p className="text-muted">Everything you need to manage church events successfully</p>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: 'var(--primary-purple)',
                      color: 'white'
                    }}
                  >
                    <i className="bi bi-people" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h5 style={{ color: 'var(--primary-purple)' }}>Guest Management</h5>
                  <p className="text-muted">
                    Register and manage event attendees with ease. Track guest information and attendance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: 'var(--primary-yellow)',
                      color: 'var(--purple-darker)'
                    }}
                  >
                    <i className="bi bi-qr-code-scan" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h5 style={{ color: 'var(--primary-purple)' }}>Quick Check-in</h5>
                  <p className="text-muted">
                    Fast and efficient check-in process for events using QR codes and digital systems.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: 'var(--primary-purple)',
                      color: 'white'
                    }}
                  >
                    <i className="bi bi-graph-up" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h5 style={{ color: 'var(--primary-purple)' }}>Analytics & Reports</h5>
                  <p className="text-muted">
                    Comprehensive reporting and analytics to track event performance and attendance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 mt-5" style={{ backgroundColor: 'var(--primary-purple)' }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <p className="mb-0 text-white">
                © 2025 EVANGELION Event Management System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
