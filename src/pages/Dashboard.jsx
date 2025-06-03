import React from 'react';
import { useAuth } from '../hooks/useAuth';
import usePermissions from '../hooks/usePermissions';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const permissions = usePermissions();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Simple Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">EVANGELION Event Management</span>
          <div className="navbar-nav ms-auto">
            <div className="nav-item dropdown">
              <button
                className="btn btn-outline-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {user?.name || 'User'}
              </button>
              <ul className="dropdown-menu">
                <li><span className="dropdown-item-text">Role: {user?.role}</span></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">Dashboard</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h5>Welcome, {user?.name}!</h5>
                    <p className="text-muted">Role: {user?.role}</p>
                    <p>You are successfully logged into the EVANGELION Event Management System.</p>
                    
                    {/* Role-specific welcome message */}
                    {permissions.isSuperAdmin() && (
                      <div className="alert alert-info">
                        <strong>Super Admin Access:</strong> You have full system access and can manage all events, users, and analytics.
                      </div>
                    )}
                    
                    {permissions.isStateAdmin() && (
                      <div className="alert alert-info">
                        <strong>State Admin Access:</strong> You can manage events and users within your state.
                      </div>
                    )}
                    
                    {permissions.isBranchAdmin() && (
                      <div className="alert alert-info">
                        <strong>Branch Admin Access:</strong> You can manage events and users within your branch, and approve workers and registrars.
                      </div>
                    )}
                    
                    {permissions.isZonalAdmin() && (
                      <div className="alert alert-info">
                        <strong>Zonal Admin Access:</strong> You can manage events within your zone.
                      </div>
                    )}
                    
                    {permissions.isWorker() && (
                      <div className="alert alert-success">
                        <strong>Worker Access:</strong> You can register guests for events and manage your guest list.
                      </div>
                    )}
                    
                    {permissions.isRegistrar() && (
                      <div className="alert alert-warning">
                        <strong>Registrar Access:</strong> You can check-in guests for events in your assigned zones.
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title">Quick Stats</h6>
                        <p className="card-text">
                          <small className="text-muted">
                            System Status: Online<br />
                            Last Login: {new Date().toLocaleString()}
                          </small>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
