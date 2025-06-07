import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import { StatisticsGrid, StatisticsCardTypes } from '../common/StatisticsCard';
import analyticsService from '../../services/analyticsService';

const StateAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingBranchAdmins, setPendingBranchAdmins] = useState([]);
  const [approvedBranchAdmins, setApprovedBranchAdmins] = useState([]);
  const [stateStatistics, setStateStatistics] = useState({
    totalBranches: 0,
    totalZones: 0,
    activeEvents: 0,
    totalGuests: 0
  });
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedError, setApprovedError] = useState(null);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'branch-admin-management') {
      loadPendingBranchAdmins();
      loadApprovedBranchAdmins();
    } else if (activeTab === 'overview') {
      loadStateStatistics();
    }
  }, [activeTab]);

  const loadStateStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await analyticsService.getStateAdminDashboardStats();
      console.log('StateAdminTabs: Loaded state statistics:', stats);
      setStateStatistics(stats || {
        totalBranches: 0,
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0
      });
    } catch (err) {
      console.error('Error loading state statistics:', err);
      setError(err.message || 'Failed to load state statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBranchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getPendingBranchAdmins();
      console.log('StateAdminTabs: Loaded pending branch admins:', data);
      setPendingBranchAdmins(data || []);
    } catch (err) {
      console.error('Error loading pending branch admins:', err);
      setError(err.message || 'Failed to load pending branch admins');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedBranchAdmins = async () => {
    setApprovedLoading(true);
    setApprovedError(null);
    try {
      const data = await analyticsService.getApprovedBranchAdmins();
      console.log('StateAdminTabs: Loaded approved branch admins:', data);
      setApprovedBranchAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved branch admins:', err);
      setApprovedError(err.message || 'Failed to load approved branch admins');
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleApproveBranchAdmin = async (adminId) => {
    try {
      await analyticsService.approveBranchAdmin(adminId, {
        approvedBy: user?.name || user?.email,
        approvedAt: new Date().toISOString()
      });
      
      // Remove from pending list
      setPendingBranchAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      // Add to approved list
      const approvedAdmin = pendingBranchAdmins.find(admin => (admin._id || admin.id) === adminId);
      if (approvedAdmin) {
        setApprovedBranchAdmins(prev => [...prev, {
          ...approvedAdmin,
          status: 'approved',
          approvedBy: user?.name || user?.email,
          approvedAt: new Date().toISOString()
        }]);
      }
      
      alert('Branch Admin approved successfully!');
    } catch (err) {
      console.error('Error approving branch admin:', err);
      alert('Failed to approve branch admin: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectBranchAdmin = async (adminId, reason) => {
    try {
      await analyticsService.rejectBranchAdmin(adminId, reason);
      
      // Remove from pending list
      setPendingBranchAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      alert('Branch Admin rejection recorded successfully!');
    } catch (err) {
      console.error('Error rejecting branch admin:', err);
      alert('Failed to reject branch admin: ' + (err.message || 'Unknown error'));
    }
  };

  const renderOverview = () => (
    <div>
      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.totalBranches || dashboardData?.branches || 0}</h4>
                  <p className="mb-0">Total Branches</p>
                  <small className="opacity-75">In your state</small>
                </div>
                <i className="fas fa-building fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.totalZones || 0}</h4>
                  <p className="mb-0">Total Zones</p>
                  <small className="opacity-75">Across all branches</small>
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
                  <h4 className="mb-0">{stateStatistics.activeEvents || dashboardData?.activeEvents || 0}</h4>
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
                  <h4 className="mb-0">{stateStatistics.totalGuests || dashboardData?.totalGuests || 0}</h4>
                  <p className="mb-0">Total Guests</p>
                  <small className="opacity-75">Registered in state</small>
                </div>
                <i className="fas fa-users fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State Management Overview */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                State Management Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Branch Admins</h6>
                      <h4 className="mb-0 text-success">{approvedBranchAdmins.length}</h4>
                    </div>
                    <i className="fas fa-user-tie fa-2x text-success"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Pending Approvals</h6>
                      <h4 className="mb-0 text-warning">{pendingBranchAdmins.length}</h4>
                    </div>
                    <i className="fas fa-clock fa-2x text-warning"></i>
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
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('branch-admin-management')}
                >
                  <i className="fas fa-user-check me-2"></i>
                  Manage Branch Admins
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Create State Event
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="fas fa-download me-2"></i>
                  Export State Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranchAdminManagement = () => {
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
          onRetry={loadPendingBranchAdmins}
        />
      );
    }

    return (
      <div>
        {/* Pending Branch Admins Section */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">Pending Branch Admin Registrations</h5>
              <p className="text-muted mb-0">
                {pendingBranchAdmins.length} registration{pendingBranchAdmins.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={loadPendingBranchAdmins}
              disabled={loading}
            >
              <i className="fas fa-refresh me-2"></i>
              Refresh
            </button>
          </div>

          {pendingBranchAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>No Pending Approvals</h4>
                <p className="text-muted">All Branch Admin registrations have been processed.</p>
              </div>
            </div>
          ) : (
            pendingBranchAdmins.map(admin => (
              <AdminApprovalCard
                key={admin._id || admin.id}
                admin={admin}
                onApprove={handleApproveBranchAdmin}
                onReject={handleRejectBranchAdmin}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* Approved Branch Admins Section */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">Approved Branch Admins</h5>
              <p className="text-muted mb-0">
                {approvedBranchAdmins.length} approved admin{approvedBranchAdmins.length !== 1 ? 's' : ''} currently active
              </p>
            </div>
            <button 
              className="btn btn-outline-success"
              onClick={loadApprovedBranchAdmins}
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
              onRetry={loadApprovedBranchAdmins}
            />
          ) : approvedBranchAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h4>No Approved Branch Admins</h4>
                <p className="text-muted">No Branch Admins have been approved yet.</p>
              </div>
            </div>
          ) : (
            approvedBranchAdmins.map(admin => (
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
            className={`nav-link ${activeTab === 'branch-admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('branch-admin-management')}
            type="button"
          >
            <i className="fas fa-user-shield me-2"></i>
            Branch Admin Management
            {pendingBranchAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingBranchAdmins.length}
              </span>
            )}
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'branch-admin-management' && renderBranchAdminManagement()}
      </div>
    </div>
  );
};

export default StateAdminTabs;
