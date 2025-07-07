import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import BranchAdminEvents from './BranchAdminEvents';
import ZoneAdminManagement from './ZoneAdminManagement';
import ZonesManagement from '../admin/ZonesManagement';
import WorkerManagement from '../admin/WorkerManagement';
import RegistrarManagement from '../admin/RegistrarManagement';
import BranchAdminPickupStationsTab from './tabs/BranchAdminPickupStationsTab';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';
import workerService from '../../services/workerService';
import { API_ENDPOINTS } from '../../utils/constants';

const BranchAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();  
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingZonalAdmins, setPendingZonalAdmins] = useState([]);
  const [approvedZonalAdmins, setApprovedZonalAdmins] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [pendingRegistrars, setPendingRegistrars] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState({
    totalZones: 0,
    activeEvents: 0,
    totalGuests: 0,
    totalRegistrations: 0
  });
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedError, setApprovedError] = useState(null);  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'zonal-admin-management') {
      loadPendingZonalAdmins();
      loadApprovedZonalAdmins();
    } else if (activeTab === 'worker-management') {
      loadPendingWorkers();
    } else if (activeTab === 'registrar-management') {
      loadPendingRegistrars();
    } else if (activeTab === 'overview') {
      loadBranchStatistics();
      loadPendingWorkers(); // Also load workers for overview stats
      loadPendingRegistrars(); // Also load registrars for overview stats
    }
  }, [activeTab]);
  const loadBranchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await analyticsService.getBranchAdminDashboardStats();
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
      setApprovedZonalAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved zonal admins:', err);
      setApprovedError(err.message || 'Failed to load approved zonal admins');
    } finally {
      setApprovedLoading(false);
    }  };  const loadPendingWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workerService.getPendingWorkers();
      setPendingWorkers(data);
    } catch (err) {
      console.error('Error loading pending workers:', err);
      setError(err.message || 'Failed to load pending workers');
    } finally {
      setLoading(false);
    }
  };  const loadPendingRegistrars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTRARS.PENDING, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const registrarsArray = Array.isArray(data) ? data : data.data || [];
        setPendingRegistrars(registrarsArray);      } else {
        setError('Failed to load pending registrars');
      }
    } catch (err) {
      console.error('Error loading pending registrars:', err);
      setError(err.message || 'Failed to load pending registrars');
    } finally {
      setLoading(false);
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
    <div>      {/* Statistics Cards */}
      <div className="row g-4 mb-4">        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-primary bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-grid-3x3-gap-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Zones</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.totalZones || dashboardData?.zones || 0}</h3>
                  <small className="text-white-75">In your branch</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-warning bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-calendar-event-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Active Events</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.activeEvents || dashboardData?.activeEvents || 0}</h3>
                  <small className="text-white-75">Currently running</small>
                </div>
              </div>
            </div>
          </div>
        </div><div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-people-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Guests</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.totalGuests || dashboardData?.totalGuests || 0}</h3>
                  <small className="text-white-75">Registered in branch</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-success bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">                  <div className="bg-white bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-clipboard-check-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Registrations</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.totalRegistrations || dashboardData?.totalRegistrations || 0}</h3>
                  <small className="text-white-75">All time</small>
                </div>
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
            <div className="card-body">              <div className="row text-center">
                <div className="col-md-3 col-6">
                  <div className="border-end">
                    <h3 className="text-primary">{pendingZonalAdmins.length}</h3>
                    <p className="text-muted mb-0">Pending Zonal Admins</p>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="border-end">
                    <h3 className="text-success">{approvedZonalAdmins.length}</h3>
                    <p className="text-muted mb-0">Active Zonal Admins</p>
                  </div>
                </div>                <div className="col-md-3 col-6">
                  <div className="border-end">
                    <h3 className="text-warning">{pendingWorkers.length}</h3>
                    <p className="text-muted mb-0">Pending Workers</p>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <h3 className="text-info">{pendingRegistrars.length}</h3>
                  <p className="text-muted mb-0">Pending Registrars</p>
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
            </div>            {pendingZonalAdmins.length > 0 && (
              <div className="d-flex align-items-center mb-3">
                <div className="flex-shrink-0">
                  <i className="fas fa-clock text-warning"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Pending Zonal Admin Approvals</h6>
                  <p className="text-muted mb-0 small">
                    {pendingZonalAdmins.length} zonal admin{pendingZonalAdmins.length !== 1 ? 's' : ''} awaiting approval
                  </p>
                </div>
                <small className="text-muted">Today</small>
              </div>
            )}
            
            {pendingRegistrars.length > 0 && (
              <div className="d-flex align-items-center mb-3">
                <div className="flex-shrink-0">
                  <i className="fas fa-clipboard-check text-info"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Pending Registrar Approvals</h6>
                  <p className="text-muted mb-0 small">
                    {pendingRegistrars.length} registrar{pendingRegistrars.length !== 1 ? 's' : ''} awaiting approval
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
            </div>          ) : (
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
      {/* Tab Navigation */}      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
            type="button"
          >
            <i className="bi bi-geo-alt me-2"></i>
            Zones
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zonal-admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('zonal-admin-management')}
            type="button"          >
            <i className="bi bi-shield-check me-2"></i>
            Zone Admin Management
            {pendingZonalAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingZonalAdmins.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'worker-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('worker-management')}
            type="button"
          >
            <i className="bi bi-people me-2"></i>
            Worker Management
            {pendingWorkers.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingWorkers.length}
              </span>
            )}
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'registrar-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrar-management')}
            type="button"
          >
            <i className="bi bi-clipboard-check me-2"></i>
            Manage Registrars
            {pendingRegistrars.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingRegistrars.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            type="button"
          >            <i className="bi bi-calendar-event me-2"></i>
            Events
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickup-stations')}
            type="button"
          >
            <i className="bi bi-geo-alt me-2"></i>
            Pickup Stations
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'zones' && <ZonesManagement />}
        {activeTab === 'zonal-admin-management' && (
          <ZoneAdminManagement 
            onPendingCountChange={(count) => setPendingZonalAdmins(Array(count).fill({}))}
          />
        )}
        {activeTab === 'worker-management' && <WorkerManagement />}
        {activeTab === 'registrar-management' && <RegistrarManagement />}
        {activeTab === 'events' && <BranchAdminEvents />}
        {activeTab === 'pickup-stations' && <BranchAdminPickupStationsTab />}
      </div>
    </div>
  );
};

export default BranchAdminTabs;
