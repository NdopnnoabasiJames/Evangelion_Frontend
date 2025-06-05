import React, { useState, useEffect } from 'react';
import AdminApprovalCard from './AdminApprovalCard';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';

const SuperAdminTabs = ({ dashboardData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [adminHistory, setAdminHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load pending admins when Admin Management tab is active
  useEffect(() => {
    if (activeTab === 'admin-management') {
      loadPendingAdmins();
    }
  }, [activeTab]);

  const loadPendingAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getPendingAdmins();
      setPendingAdmins(data || []);
    } catch (err) {
      console.error('Error loading pending admins:', err);
      setError(err.message || 'Failed to load pending admins');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getAdminApprovalHistory();
      setAdminHistory(data || []);
    } catch (err) {
      console.error('Error loading admin history:', err);
      setError(err.message || 'Failed to load admin history');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async (adminId) => {
    try {
      await analyticsService.approveAdmin(adminId, {
        approvedBy: 'Super Admin',
        approvedAt: new Date().toISOString()
      });
      
      // Remove from pending list
      setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      // Show success message
      alert('Admin approved successfully!');
    } catch (err) {
      console.error('Error approving admin:', err);
      alert('Failed to approve admin: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectAdmin = async (adminId, reason) => {
    try {
      await analyticsService.rejectAdmin(adminId, reason);
      
      // Remove from pending list
      setPendingAdmins(prev => prev.filter(admin => admin.id !== adminId));
      
      // Show success message
      alert('Admin rejection recorded successfully!');
    } catch (err) {
      console.error('Error rejecting admin:', err);
      alert('Failed to reject admin: ' + (err.message || 'Unknown error'));
    }
  };
  const renderOverview = () => (
    <div>
      {/* System Health Status Banner */}
      {dashboardData?.healthStatus && (
        <div className={`alert ${
          dashboardData.healthStatus === 'healthy' ? 'alert-success' : 
          dashboardData.healthStatus === 'warning' ? 'alert-warning' : 'alert-danger'
        } mb-4`}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className={`fas ${
                dashboardData.healthStatus === 'healthy' ? 'fa-check-circle' : 
                dashboardData.healthStatus === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'
              } me-2`}></i>
              <strong>System Status: {dashboardData.healthStatus.toUpperCase()}</strong>
              <span className="ms-3">Health Score: {dashboardData.healthScore || 0}%</span>
            </div>
            {dashboardData.systemUptime && (
              <small>Uptime: {Math.floor(dashboardData.systemUptime / 3600)}h {Math.floor((dashboardData.systemUptime % 3600) / 60)}m</small>
            )}
          </div>
          {dashboardData?.healthAlerts && dashboardData.healthAlerts.length > 0 && (
            <div className="mt-2">
              <strong>Alerts:</strong>
              <ul className="mb-0 mt-1">
                {dashboardData.healthAlerts.map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Primary Metrics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{dashboardData?.totalUsers || 0}</h4>
                  <p className="mb-0">Total Users</p>
                  {dashboardData?.recentRegistrations > 0 && (
                    <small className="opacity-75">+{dashboardData.recentRegistrations} today</small>
                  )}
                </div>
                <i className="fas fa-users fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{dashboardData?.totalStates || 0}</h4>
                  <p className="mb-0">States</p>
                  <small className="opacity-75">{dashboardData?.totalBranches || 0} branches</small>
                </div>
                <i className="fas fa-map-marker-alt fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{dashboardData?.totalEvents || 0}</h4>
                  <p className="mb-0">Events</p>
                  <small className="opacity-75">{dashboardData?.totalGuests || 0} guests</small>
                </div>
                <i className="fas fa-calendar fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{dashboardData?.pendingAdmins || 0}</h4>
                  <p className="mb-0">Pending Approvals</p>
                  {dashboardData?.pendingAdmins > 0 && (
                    <small className="text-danger">Requires attention</small>
                  )}
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Hierarchy Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                Admin Hierarchy Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Super Admins</h6>
                      <h4 className="mb-0 text-dark">{dashboardData?.adminsByRole?.superAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-crown fa-2x text-warning"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">State Admins</h6>
                      <h4 className="mb-0 text-primary">{dashboardData?.adminsByRole?.stateAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-map fa-2x text-primary"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Branch Admins</h6>
                      <h4 className="mb-0 text-success">{dashboardData?.adminsByRole?.branchAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-building fa-2x text-success"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Zonal Admins</h6>
                      <h4 className="mb-0 text-info">{dashboardData?.adminsByRole?.zonalAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-layer-group fa-2x text-info"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                System Statistics
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Zones</span>
                  <strong>{dashboardData?.totalZones || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{width: `${Math.min(100, (dashboardData?.totalZones || 0) * 2)}%`}}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Events</span>
                  <strong>{dashboardData?.totalEvents || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${Math.min(100, (dashboardData?.totalEvents || 0) * 5)}%`}}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Registered Guests</span>
                  <strong>{dashboardData?.totalGuests || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-primary" 
                    style={{width: `${Math.min(100, (dashboardData?.totalGuests || 0) / 10)}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('admin-management')}
                  disabled={!dashboardData?.pendingAdmins || dashboardData.pendingAdmins === 0}
                >
                  <i className="fas fa-user-check me-2"></i>
                  Review Pending Admins ({dashboardData?.pendingAdmins || 0})
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-download me-2"></i>
                  Export System Report
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setActiveTab('audit-trail')}
                >
                  <i className="fas fa-list-alt me-2"></i>
                  View Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bell me-2"></i>
                Recent Activity
              </h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {dashboardData?.recentRegistrations > 0 && (
                  <div className="list-group-item border-0 px-0">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-user-plus text-success me-3"></i>
                      <div>
                        <h6 className="mb-1">{dashboardData.recentRegistrations} new registrations</h6>
                        <small className="text-muted">In the last 24 hours</small>
                      </div>
                    </div>
                  </div>
                )}
                {dashboardData?.pendingAdmins > 0 && (
                  <div className="list-group-item border-0 px-0">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-clock text-warning me-3"></i>
                      <div>
                        <h6 className="mb-1">{dashboardData.pendingAdmins} pending approvals</h6>
                        <small className="text-muted">Waiting for review</small>
                      </div>
                    </div>
                  </div>
                )}
                {dashboardData?.healthAlerts && dashboardData.healthAlerts.length > 0 && (
                  <div className="list-group-item border-0 px-0">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle text-danger me-3"></i>
                      <div>
                        <h6 className="mb-1">{dashboardData.healthAlerts.length} system alerts</h6>
                        <small className="text-muted">Requires attention</small>
                      </div>
                    </div>
                  </div>
                )}
                {(!dashboardData?.recentRegistrations && !dashboardData?.pendingAdmins && (!dashboardData?.healthAlerts || dashboardData.healthAlerts.length === 0)) && (
                  <div className="text-center py-3">
                    <i className="fas fa-check-circle text-success fa-2x mb-2"></i>
                    <p className="text-muted mb-0">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminManagement = () => {
    if (loading) {
      return (
        <div className="row g-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="col-12">
              <LoadingCard height="200px" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay 
          message={error}
          onRetry={loadPendingAdmins}
        />
      );
    }

    if (pendingAdmins.length === 0) {
      return (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
            <h4>No Pending Approvals</h4>
            <p className="text-muted">All State Admin registrations have been processed.</p>
            <button 
              className="btn btn-outline-primary"
              onClick={loadPendingAdmins}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Pending State Admin Registrations</h5>
            <p className="text-muted mb-0">
              {pendingAdmins.length} registration{pendingAdmins.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={loadPendingAdmins}
            disabled={loading}
          >
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </button>
        </div>
        
        {pendingAdmins.map(admin => (
          <AdminApprovalCard
            key={admin.id}
            admin={admin}
            onApprove={handleApproveAdmin}
            onReject={handleRejectAdmin}
            loading={loading}
          />
        ))}
      </div>
    );
  };

  const renderAuditTrail = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Platform Audit Trail</h5>
      </div>
      <div className="card-body">
        <div className="text-center py-5">
          <i className="fas fa-list-alt fa-3x text-muted mb-3"></i>
          <h5>Audit Trail</h5>
          <p className="text-muted">Platform activity logs will be displayed here</p>
          <small className="text-muted">Feature coming soon...</small>
        </div>
      </div>
    </div>
  );

  const renderSystemManagement = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">System Management</h5>
      </div>
      <div className="card-body">
        <div className="text-center py-5">
          <i className="fas fa-cogs fa-3x text-muted mb-3"></i>
          <h5>System Management</h5>
          <p className="text-muted">System configuration and management tools</p>
          <small className="text-muted">Feature coming soon...</small>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >
            <i className="fas fa-chart-line me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-management')}
            type="button"
          >
            <i className="fas fa-user-shield me-2"></i>
            Admin Management
            {pendingAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingAdmins.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'audit-trail' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-trail')}
            type="button"
          >
            <i className="fas fa-list-alt me-2"></i>
            Audit Trail
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'system-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('system-management')}
            type="button"
          >
            <i className="fas fa-cogs me-2"></i>
            System Management
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'admin-management' && renderAdminManagement()}
        {activeTab === 'audit-trail' && renderAuditTrail()}
        {activeTab === 'system-management' && renderSystemManagement()}
      </div>
    </div>
  );
};

export default SuperAdminTabs;
