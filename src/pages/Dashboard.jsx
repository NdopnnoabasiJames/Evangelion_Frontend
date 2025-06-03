import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout/Layout';

const Dashboard = () => {
  const { user } = useAuth();

  // Role-specific dashboard content
  const getDashboardContent = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return (          <div className="row g-4">
            <div className="col-md-3">
              <div className="card text-white" style={{ backgroundColor: 'var(--primary-purple)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total States</h5>
                  <h2 className="card-text">12</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-dark" style={{ backgroundColor: 'var(--primary-yellow)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total Events</h5>
                  <h2 className="card-text">45</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white" style={{ backgroundColor: 'var(--purple-light)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h2 className="card-text">1,234</h2>
                </div>
              </div>
            </div>            <div className="col-md-3">
              <div className="card text-dark" style={{ backgroundColor: 'var(--yellow-light)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total Guests</h5>
                  <h2 className="card-text">5,678</h2>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'STATE_ADMIN':
        return (          <div className="row g-4">
            <div className="col-md-4">
              <div className="card text-white" style={{ backgroundColor: 'var(--primary-purple)' }}>
                <div className="card-body">
                  <h5 className="card-title">Branches</h5>
                  <h2 className="card-text">8</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-dark" style={{ backgroundColor: 'var(--primary-yellow)' }}>
                <div className="card-body">
                  <h5 className="card-title">Active Events</h5>
                  <h2 className="card-text">12</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white" style={{ backgroundColor: 'var(--purple-light)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total Guests</h5>
                  <h2 className="card-text">892</h2>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'BRANCH_ADMIN':
        return (          <div className="row g-4">
            <div className="col-md-4">
              <div className="card text-white" style={{ backgroundColor: 'var(--primary-purple)' }}>
                <div className="card-body">
                  <h5 className="card-title">Zones</h5>
                  <h2 className="card-text">5</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-dark" style={{ backgroundColor: 'var(--primary-yellow)' }}>
                <div className="card-body">
                  <h5 className="card-title">Workers</h5>
                  <h2 className="card-text">25</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white" style={{ backgroundColor: 'var(--purple-light)' }}>
                <div className="card-body">
                  <h5 className="card-title">Registrars</h5>
                  <h2 className="card-text">8</h2>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'WORKER':
        return (          <div className="row g-4">
            <div className="col-md-6">
              <div className="card text-dark" style={{ backgroundColor: 'var(--primary-yellow)' }}>
                <div className="card-body">
                  <h5 className="card-title">Guests Registered</h5>
                  <h2 className="card-text">156</h2>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-white" style={{ backgroundColor: 'var(--purple-light)' }}>
                <div className="card-body">
                  <h5 className="card-title">This Week</h5>
                  <h2 className="card-text">23</h2>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'REGISTRAR':
        return (          <div className="row g-4">
            <div className="col-md-6">
              <div className="card text-white" style={{ backgroundColor: 'var(--primary-purple)' }}>
                <div className="card-body">
                  <h5 className="card-title">Check-ins Today</h5>
                  <h2 className="card-text">42</h2>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-dark" style={{ backgroundColor: 'var(--primary-yellow)' }}>
                <div className="card-body">
                  <h5 className="card-title">Total Check-ins</h5>
                  <h2 className="card-text">312</h2>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="alert alert-info">
            <h5>Welcome to EVANGELION Event Management</h5>
            <p>Your dashboard content will appear here based on your role.</p>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="text-primary">Dashboard</h2>
            <p className="text-muted">Welcome back, {user?.firstName || user?.email}</p>
          </div>
        </div>
        
        {getDashboardContent()}
        
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                {user?.role === 'WORKER' && (
                  <button className="btn btn-primary me-2">Register New Guest</button>
                )}
                {user?.role === 'REGISTRAR' && (
                  <button className="btn btn-success me-2">Check-in Guest</button>
                )}
                {['BRANCH_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                  <>
                    <button className="btn btn-primary me-2">Create Event</button>
                    <button className="btn btn-outline-primary">View Reports</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
