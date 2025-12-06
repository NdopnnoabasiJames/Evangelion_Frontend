import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import BranchAdminEvents from './BranchAdminEvents';
import ZoneAdminManagement from './ZoneAdminManagement';
import ZonesManagement from '../admin/ZonesManagement';
import WorkerManagement from '../admin/WorkerManagement';
import RegistrarManagement from '../admin/RegistrarManagement';
import EventVolunteersManagement from '../admin/EventVolunteersManagement';
import BranchAdminPickupStationsTab from './tabs/BranchAdminPickupStationsTab';
import NotificationTab from './tabs/NotificationTab';
import GuestsManagement from '../admin/GuestsManagement';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';
import workerService from '../../services/workerService';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/constants';

const BranchAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  
  // Determine if user has read-only access (only branch_me should be read-only)
  const isReadOnly = user?.role === 'branch_me' || user?.currentRole === 'branch_me';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingZonalAdmins, setPendingZonalAdmins] = useState([]);
  const [approvedZonalAdmins, setApprovedZonalAdmins] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [pendingRegistrars, setPendingRegistrars] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState({
    totalZones: 0,
    activeEvents: 0,
    totalGuests: 0,
    totalWorkers: 0
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
        totalWorkers: 0
      });
    } catch (err) {
      console.error('Error loading branch statistics:', err);
      setError(err.message || 'Failed to load branch statistics');
      // Set default values only on error
      setBranchStatistics({
        totalZones: 0,
        activeEvents: 0,
        totalGuests: 0,
        totalWorkers: 0
      });
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTRARS.PENDING}`, {
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
                  <h6 className="text-white-50 mb-1">Services/Programs</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.activeEvents || dashboardData?.activeEvents || 0}</h3>
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
                    <i className="bi bi-people-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Workers</h6>
                  <h3 className="mb-0 text-white">{branchStatistics.totalWorkers || dashboardData?.totalWorkers || 0}</h3>
                  <small className="text-white-75">Active workers</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Management Overview */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                Branch Management Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center g-4">
                <div className="col-lg-3 col-md-6 col-sm-6">
                  <div className="h-100 d-flex flex-column justify-content-center">
                    <h3 className="text-primary mb-2">{pendingZonalAdmins.length}</h3>
                    <p className="text-muted mb-0">Pending Zonal Admins</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-6">
                  <div className="h-100 d-flex flex-column justify-content-center">
                    <h3 className="text-success mb-2">{approvedZonalAdmins.length}</h3>
                    <p className="text-muted mb-0">Active Zonal Admins</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-6">
                  <div className="h-100 d-flex flex-column justify-content-center">
                    <h3 className="text-warning mb-2">{pendingWorkers.length}</h3>
                    <p className="text-muted mb-0">Pending Workers</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-6 col-sm-6">
                  <div className="h-100 d-flex flex-column justify-content-center">
                    <h3 className="text-info mb-2">{pendingRegistrars.length}</h3>
                    <p className="text-muted mb-0">Pending PCUs/Internships</p>
                  </div>
                </div>
              </div>
              <hr className="my-4" />
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                <span className="text-muted">Branch Coverage</span>
                <span className="badge bg-success fs-6 px-3 py-2">
                  {branchStatistics.totalZones > 0 ? 
                    `${Math.round((approvedZonalAdmins.length / branchStatistics.totalZones) * 100)}% Zones Covered` : 
                    'No zones configured'
                  }
                </span>
              </div>
            </div>
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
                isReadOnly={isReadOnly}
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

  // Handle tab change and close mobile menu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div>
      {/* Back Button (only show when not on overview tab) */}
      {activeTab !== 'overview' && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleTabChange('overview')}
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Overview
          </button>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="position-relative">
        {/* Mobile Navigation */}
        <div className="d-md-none mb-3">
          <div className="position-relative mb-3">
            <h5 className="mb-0 text-center">
              {activeTab === 'overview' && <><i className="bi bi-graph-up me-2"></i>Overview</>}
              {activeTab === 'zones' && <><i className="bi bi-geo-alt me-2"></i>Zones</>}
              {activeTab === 'zonal-admin-management' && <><i className="bi bi-shield-check me-2"></i>Zonal Admins</>}
              {activeTab === 'worker-management' && <><i className="bi bi-people-fill me-2"></i>Workers</>}
              {activeTab === 'registrar-management' && <><i className="bi bi-person-badge me-2"></i>Registrars</>}
              {activeTab === 'events' && <><i className="bi bi-calendar-event me-2"></i>Events</>}
              {activeTab === 'guests' && <><i className="bi bi-person-check me-2"></i>Guests</>}
              {activeTab === 'pickup-stations' && <><i className="bi bi-pin-map me-2"></i>Pickup Stations</>}
              {activeTab === 'event-volunteers' && <><i className="bi bi-people me-2"></i>Event Volunteers</>}
              {activeTab === 'notifications' && <><i className="bi bi-bell me-2"></i>Notifications</>}
            </h5>
            <button 
              className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0"
              style={{ width: '32px', height: '32px', padding: '0', marginTop: '-8px' }}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'} small`}></i>
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mobile-nav-menu show d-md-none">
          <div className="list-group">
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              <i className="bi bi-graph-up me-2"></i>
              Overview
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => handleTabChange('zones')}
            >
              <i className="bi bi-geo-alt me-2"></i>
              Zones
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'zonal-admin-management' ? 'active' : ''}`}
              onClick={() => handleTabChange('zonal-admin-management')}
            >
              <i className="bi bi-shield-check me-2"></i>
              Zone Admins
              {pendingZonalAdmins.length > 0 && (
                <span className="badge bg-warning text-dark ms-2">
                  {pendingZonalAdmins.length}
                </span>
              )}
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'worker-management' ? 'active' : ''}`}
              onClick={() => handleTabChange('worker-management')}
            >
              <i className="bi bi-people me-2"></i>
              Workers
              {pendingWorkers.length > 0 && (
                <span className="badge bg-warning text-dark ms-2">
                  {pendingWorkers.length}
                </span>
              )}
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'registrar-management' ? 'active' : ''}`}
              onClick={() => handleTabChange('registrar-management')}
            >
              <i className="bi bi-clipboard-check me-2"></i>
              Registrars/PCUs
              {pendingRegistrars.filter(r => r.role !== 'worker' && r.role !== 'WORKER').length > 0 && (
                <span className="badge bg-warning text-dark ms-2">
                  {pendingRegistrars.filter(r => r.role !== 'worker' && r.role !== 'WORKER').length}
                </span>
              )}
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => handleTabChange('events')}
            >
              <i className="bi bi-calendar-event me-2"></i>
              Events
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => handleTabChange('guests')}
            >
              <i className="bi bi-person-check-fill me-2"></i>
              Guests
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'pickup-stations' ? 'active' : ''}`}
              onClick={() => handleTabChange('pickup-stations')}
            >
              <i className="bi bi-geo-alt me-2"></i>
              Pickup Stations
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'event-volunteers' ? 'active' : ''}`}
              onClick={() => handleTabChange('event-volunteers')}
            >
              <i className="bi bi-hand-thumbs-up me-2"></i>
              Event Volunteers
            </button>
            <button
              className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleTabChange('notifications')}
            >
              <i className="bi bi-envelope me-2"></i>
              Notifications
            </button>
          </div>
        </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <ul className="nav nav-tabs mb-4 d-none d-md-flex" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
              type="button"
            >
              <i className="bi bi-graph-up me-2"></i>
              Overview
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'zones' ? 'active' : ''}`}
              onClick={() => handleTabChange('zones')}
              type="button"
            >
              <i className="bi bi-geo-alt me-2"></i>
              Zones
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'zonal-admin-management' ? 'active' : ''}`}
              onClick={() => handleTabChange('zonal-admin-management')}
              type="button"
            >
              <i className="bi bi-shield-check me-2"></i>
              <span className="d-none d-sm-inline">Zone Admin Management</span>
              <span className="d-inline d-sm-none">Zone Admins</span>
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
              onClick={() => handleTabChange('worker-management')}
              type="button"
            >
              <i className="bi bi-people me-2"></i>
              <span className="d-none d-sm-inline">Worker Management</span>
              <span className="d-inline d-sm-none">Workers</span>
              {pendingWorkers.length > 0 && (
                <span className="badge bg-warning text-dark ms-2">
                  {pendingWorkers.length}
                </span>
              )}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'registrar-management' ? 'active' : ''}`}
              onClick={() => handleTabChange('registrar-management')}
              type="button"
            >
              <i className="bi bi-clipboard-check me-2"></i>
              <span className="d-none d-sm-inline">Manage Registrars/PCUs/Internships</span>
              <span className="d-inline d-sm-none">Registrars/PCUs</span>
              {pendingRegistrars.filter(r => r.role !== 'worker' && r.role !== 'WORKER').length > 0 && (
                <span className="badge bg-warning text-dark ms-2">
                  {pendingRegistrars.filter(r => r.role !== 'worker' && r.role !== 'WORKER').length}
                </span>
              )}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => handleTabChange('events')}
              type="button"
            >
              <i className="bi bi-calendar-event me-2"></i>
              Events
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => handleTabChange('guests')}
              type="button"
            >
              <i className="bi bi-person-check-fill me-2"></i>
              Guests
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''}`}
              onClick={() => handleTabChange('pickup-stations')}
              type="button"
            >
              <i className="bi bi-geo-alt me-2"></i>
              <span className="d-none d-sm-inline">Pickup Stations</span>
              <span className="d-inline d-sm-none">Pickup</span>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'event-volunteers' ? 'active' : ''}`}
              onClick={() => handleTabChange('event-volunteers')}
              type="button"
            >
              <i className="bi bi-hand-thumbs-up me-2"></i>
              <span className="d-none d-sm-inline">Event Volunteers</span>
              <span className="d-inline d-sm-none">Volunteers</span>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleTabChange('notifications')}
              type="button"
            >
              <i className="bi bi-envelope me-2"></i>
              Notifications
            </button>
          </li>
        </ul>
      </div>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'zones' && <ZonesManagement isReadOnly={isReadOnly} />}
        {activeTab === 'zonal-admin-management' && (
          <ZoneAdminManagement 
            onPendingCountChange={(count) => setPendingZonalAdmins(Array(count).fill({}))}
            isReadOnly={isReadOnly}
          />
        )}
        {activeTab === 'worker-management' && <WorkerManagement isReadOnly={isReadOnly} />}
        {activeTab === 'registrar-management' && <RegistrarManagement isReadOnly={isReadOnly} />}
        {activeTab === 'event-volunteers' && <EventVolunteersManagement isReadOnly={isReadOnly} />}
        {activeTab === 'events' && <BranchAdminEvents isReadOnly={isReadOnly} />}
        {activeTab === 'guests' && <GuestsManagement />}
        {activeTab === 'pickup-stations' && <BranchAdminPickupStationsTab isReadOnly={isReadOnly} />}
        {activeTab === 'notifications' && <NotificationTab isReadOnly={isReadOnly} />}
      </div>
    </div>
  );
};

export default BranchAdminTabs;
