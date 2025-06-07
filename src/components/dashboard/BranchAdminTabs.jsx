import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';

const BranchAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingZonalAdmins, setPendingZonalAdmins] = useState([]);
  const [approvedZonalAdmins, setApprovedZonalAdmins] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState({
    totalZones: 0,
    activeEvents: 0,
    totalGuests: 0,
    totalRegistrations: 0
  });
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedError, setApprovedError] = useState(null);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'zonal-admin-management') {
      loadPendingZonalAdmins();
      loadApprovedZonalAdmins();
    } else if (activeTab === 'overview') {
      loadBranchStatistics();
    }
  }, [activeTab]);

  const loadBranchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await analyticsService.getBranchAdminDashboardStats();
      console.log('BranchAdminTabs: Loaded branch statistics:', stats);
      setBranchStatistics(stats || {
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        totalRegistrations: 0
      });
    } catch (err) {
      console.error('Error loading branch statistics:', err);
      setError(err.message || 'Failed to load branch statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingZonalAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getPendingZonalAdmins();
      console.log('BranchAdminTabs: Loaded pending zonal admins:', data);
      setPendingZonalAdmins(data || []);
    } catch (err) {
      console.error('Error loading pending zonal admins:', err);
      setError(err.message || 'Failed to load pending zonal admins');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedZonalAdmins = async () => {
    setApprovedLoading(true);
    setApprovedError(null);
    try {
      const data = await analyticsService.getApprovedZonalAdmins();
      console.log('BranchAdminTabs: Loaded approved zonal admins:', data);
      setApprovedZonalAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved zonal admins:', err);
      setApprovedError(err.message || 'Failed to load approved zonal admins');
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleApproveZonalAdmin = async (adminId) => {
    try {
      await analyticsService.approveZonalAdmin(adminId, {
        approvedBy: user?.name || user?.email,
        approvedAt: new Date().toISOString()
      });
      
      // Remove from pending list
      setPendingZonalAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      // Add to approved list
      const approvedAdmin = pendingZonalAdmins.find(admin => (admin._id || admin.id) === adminId);
      if (approvedAdmin) {
        setApprovedZonalAdmins(prev => [...prev, {
          ...approvedAdmin,
          status: 'approved',
          approvedBy: user?.name || user?.email,
          approvedAt: new Date().toISOString()
        }]);
      }
      
      alert('Zonal Admin approved successfully!');
    } catch (err) {
      console.error('Error approving zonal admin:', err);
      alert('Failed to approve zonal admin: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectZonalAdmin = async (adminId, reason) => {
    try {
      await analyticsService.rejectZonalAdmin(adminId, reason);
      
      // Remove from pending list
      setPendingZonalAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      alert('Zonal Admin rejection recorded successfully!');
    } catch (err) {
      console.error('Error rejecting zonal admin:', err);
      alert('Failed to reject zonal admin: ' + (err.message || 'Unknown error'));
    }
  };

  const renderOverview = () => (
    <div>
      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{branchStatistics.totalZones || dashboardData?.zones || 0}</h4>
                  <p className="mb-0">Total Zones</p>
                  <small className="opacity-75">In your branch</small>
                </div>
                <i className="fas fa-layer-group fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{branchStatistics.activeEvents || dashboardData?.activeEvents || 0}</h4>
                  <p className="mb-0">Active Events</p>
                  <small className="opacity-75">Currently running</small>
                </div>
                <i className="fas fa-calendar fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-purple text-white h-100" style={{backgroundColor: 'var(--primary-purple)'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{branchStatistics.totalGuests || dashboardData?.totalGuests || 0}</h4>
                  <p className="mb-0">Total Guests</p>
                  <small className="opacity-75">Registered in branch</small>
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
                  <h4 className="mb-0">{branchStatistics.totalRegistrations || dashboardData?.totalRegistrations || 0}</h4>
                  <p className="mb-0">Total Registrations</p>
                  <small className="opacity-75">All time</small>
                </div>
                <i className="fas fa-clipboard-list fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Management Overview */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                Branch Management Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-6">
                  <div className="border-end">
                    <h3 className="text-primary">{pendingZonalAdmins.length}</h3>
                    <p className="text-muted mb-0">Pending Zonal Admin Approvals</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <h3 className="text-success">{approvedZonalAdmins.length}</h3>
                  <p className="text-muted mb-0">Active Zonal Admins</p>
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Branch Coverage</span>
                <span className="badge bg-success">
                  {branchStatistics.totalZones > 0 ? 
                    `${Math.round((approvedZonalAdmins.length / branchStatistics.totalZones) * 100)}% Zones Covered` : 
                    'No zones configured'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Quick Stats
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Events This Month</span>
                <span className="badge bg-warning">{branchStatistics.activeEvents || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>New Registrations</span>
                <span className="badge bg-info">{branchStatistics.totalRegistrations || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Guest Attendance</span>
                <span className="badge bg-purple" style={{backgroundColor: 'var(--primary-purple)'}}>
                  {branchStatistics.totalGuests || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-clock me-2"></i>
            Recent Activity
          </h5>
        </div>
        <div className="card-body">
          <div className="timeline">
            <div className="d-flex align-items-center mb-3">
              <div className="flex-shrink-0">
                <i className="fas fa-user-plus text-success"></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-1">Branch Admin Dashboard Accessed</h6>
                <p className="text-muted mb-0 small">
                  You accessed the branch admin dashboard
                </p>
              </div>
              <small className="text-muted">Just now</small>
            </div>
            {pendingZonalAdmins.length > 0 && (
              <div className="d-flex align-items-center mb-3">
                <div className="flex-shrink-0">
                  <i className="fas fa-clock text-warning"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Pending Approvals</h6>
                  <p className="text-muted mb-0 small">
                    {pendingZonalAdmins.length} zonal admin{pendingZonalAdmins.length !== 1 ? 's' : ''} awaiting approval
                  </p>
                </div>
                <small className="text-muted">Today</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderZonalAdminManagement = () => {
    if (loading && pendingZonalAdmins.length === 0) {
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
          onRetry={() => {
            loadPendingZonalAdmins();
            loadApprovedZonalAdmins();
          }}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Pending Zonal Admins Section */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">Pending Zonal Admin Approvals</h5>
              <p className="text-muted mb-0">
                {pendingZonalAdmins.length} application{pendingZonalAdmins.length !== 1 ? 's' : ''} awaiting your review
              </p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={loadPendingZonalAdmins}
              disabled={loading}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </button>
          </div>

          {pendingZonalAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>No Pending Approvals</h4>
                <p className="text-muted">All Zonal Admin registrations have been processed.</p>
              </div>
            </div>
          ) : (
            pendingZonalAdmins.map(admin => (
              <AdminApprovalCard
                key={admin._id || admin.id}
                admin={admin}
                onApprove={handleApproveZonalAdmin}
                onReject={handleRejectZonalAdmin}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* Approved Zonal Admins Section */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">Approved Zonal Admins</h5>
              <p className="text-muted mb-0">
                {approvedZonalAdmins.length} approved admin{approvedZonalAdmins.length !== 1 ? 's' : ''} currently active
              </p>
            </div>
            <button 
              className="btn btn-outline-success"
              onClick={loadApprovedZonalAdmins}
              disabled={approvedLoading}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </button>
          </div>

          {approvedLoading ? (
            <div className="row g-4">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="col-12">
                  <LoadingCard height="150px" />
                </div>
              ))}
            </div>
          ) : approvedError ? (
            <ErrorDisplay 
              message={approvedError}
              onRetry={loadApprovedZonalAdmins}
            />
          ) : approvedZonalAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h4>No Approved Zonal Admins</h4>
                <p className="text-muted">No Zonal Admins have been approved yet.</p>
              </div>
            </div>
          ) : (
            approvedZonalAdmins.map(admin => (
              <ApprovedAdminCard
                key={admin._id || admin.id}
                admin={admin}
              />
            ))
          )}
        </div>
      </div>
    );
  };

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
            className={`nav-link ${activeTab === 'zonal-admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('zonal-admin-management')}
            type="button"
          >
            <i className="fas fa-user-shield me-2"></i>
            Zonal Admin Management
            {pendingZonalAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingZonalAdmins.length}
              </span>
            )}
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'zonal-admin-management' && renderZonalAdminManagement()}
      </div>
    </div>
  );
};

export default BranchAdminTabs;
