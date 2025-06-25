import React, { useState, useEffect } from 'react';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import { TabbedInterface, TabPane } from '../common/TabNavigation';
import EventsList from '../events/EventsList';
import EventDelegation from '../events/EventDelegation';
import HierarchicalEventCreation from '../events/HierarchicalEventCreation';
import PickupStationAssignment from '../events/PickupStationAssignment';
import StatesManagement from '../admin/StatesManagement';
import analyticsService from '../../services/analyticsService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

const SuperAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [adminHistory, setAdminHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedError, setApprovedError] = useState(null);
  // Branches state
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(null);
  // Event management state
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [eventActiveTab, setEventActiveTab] = useState('list');
  // Fetch events data for super admin
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: activeTab === 'events' }
  );

  const { data: hierarchicalEventsData, refetch: refetchHierarchicalEvents } = useApi(
    API_ENDPOINTS.EVENTS.HIERARCHICAL,
    { immediate: activeTab === 'events' }
  );  // Load pending admins when Admin Management tab is active
  useEffect(() => {
    if (activeTab === 'admin-management') {
      loadPendingAdmins();
      loadApprovedAdmins();
    } else if (activeTab === 'events') {
      // Events data is loaded automatically via useApi hook
      if (eventsData) {
        // Handle both direct array and wrapped response
        const processedEvents = Array.isArray(eventsData) 
          ? eventsData 
          : (eventsData.data || []);
        setEvents(processedEvents);
      }
    } else if (activeTab === 'branches') {
      loadBranches();
    }
  }, [activeTab, eventsData]);const loadPendingAdmins = async () => {
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

  const loadApprovedAdmins = async () => {
    setApprovedLoading(true);
    setApprovedError(null);
    try {
      const data = await analyticsService.getApprovedAdmins();
      setApprovedAdmins(data || []);
    } catch (err) {
      console.error('Error loading approved admins:', err);
      setApprovedError(err.message || 'Failed to load approved admins');
    } finally {
      setApprovedLoading(false);
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
    try {      await analyticsService.approveAdmin(adminId, {
        approvedBy: 'Super Admin',
        approvedAt: new Date().toISOString()
      });
      
      // Remove from pending list
      setPendingAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      // Show success message
      alert('Admin approved successfully!');
    } catch (err) {
      console.error('Error approving admin:', err);
      alert('Failed to approve admin: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRejectAdmin = async (adminId, reason) => {
    try {      await analyticsService.rejectAdmin(adminId, reason);
      
      // Remove from pending list
      setPendingAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      
      // Show success message
      alert('Admin rejection recorded successfully!');
    } catch (err) {
      console.error('Error rejecting admin:', err);
      alert('Failed to reject admin: ' + (err.message || 'Unknown error'));
    }
  };  const renderOverview = () => (
    <div>
      {/* Primary Metrics Cards */}
      <div className="row g-4 mb-4">        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-primary bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-people-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Total Users</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalUsers || 0}</h3>
                  {dashboardData?.recentRegistrations > 0 && (
                    <small className="text-white-75">+{dashboardData.recentRegistrations} today</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-success bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-geo-alt-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">States</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalStates || 0}</h3>
                  <small className="text-white-75">{dashboardData?.totalBranches || 0} branches</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-calendar-event-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Services/Programs</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalEvents || 0}</h3>
                  <small className="text-white-75">{dashboardData?.totalGuests || 0} guests</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">          <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-geo-alt-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Zones</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalZones || 0}</h3>
                </div>
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
            </div>            <div className="card-body">
              <div className="row g-3">
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
                  </div>                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Zonal Admins</h6>
                      <h4 className="mb-0 text-info">{dashboardData?.adminsByRole?.zonalAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-layer-group fa-2x text-info"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Workers</h6>
                      <h4 className="mb-0 text-secondary">{dashboardData?.adminsByRole?.workers || 0}</h4>
                    </div>
                    <i className="fas fa-users fa-2x text-secondary"></i>
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
            <div className="card-body">              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Pickup Stations</span>
                  <strong>{dashboardData?.totalPickupStations || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{width: `${Math.min(100, (dashboardData?.totalPickupStations || 0) * 2)}%`}}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Services/Programs</span>
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
      </div>      {/* Quick Actions */}
      <div className="row g-4">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>            <div className="card-body">
              <div className="d-grid gap-2 d-md-flex">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('admin-management')}
                >
                  <i className="fas fa-user-check me-2"></i>
                  Manage Admins
                </button>                <button 
                  className="btn btn-success"
                  onClick={() => {
                    setActiveTab('events');
                  }}
                >
                  <i className="fas fa-calendar me-2"></i>
                  Manage Events
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-download me-2"></i>
                  Export System Report
                </button>                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setActiveTab('states')}
                >
                  <i className="fas fa-map me-2"></i>
                  Manage States
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => setActiveTab('branches')}
                >
                  <i className="fas fa-building me-2"></i>
                  Manage Branches
                </button>
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

    return (
      <div>
        {/* Pending Admins Section */}
        <div className="mb-5">
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
          </div>          {pendingAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>No Pending Approvals</h4>
                <p className="text-muted">All State Admin registrations have been processed.</p>
              </div>
            </div>
          ) : (
            pendingAdmins.map(admin => (
              <AdminApprovalCard
                key={admin._id || admin.id}
                admin={admin}
                onApprove={handleApproveAdmin}
                onReject={handleRejectAdmin}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* Approved Admins Section */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">Approved State Admins</h5>
              <p className="text-muted mb-0">
                {approvedAdmins.length} approved admin{approvedAdmins.length !== 1 ? 's' : ''} currently active
              </p>
            </div>
            <button 
              className="btn btn-outline-success"
              onClick={loadApprovedAdmins}
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
              onRetry={loadApprovedAdmins}
            />
          ) : approvedAdmins.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <h4>No Approved Admins</h4>
                <p className="text-muted">No State Admins have been approved yet.</p>
              </div>
            </div>
          ) : (
            approvedAdmins.map(admin => (
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


  const renderStatesManagement = () => {
    return <StatesManagement />;
  };

  const renderEventManagement = () => {
    const eventTabs = [
      {
        key: 'list',
        label: 'All Events',
        icon: 'bi-list-ul'
      },
      {
        key: 'create',
        label: 'Create Event',
        icon: 'bi-plus-circle'
      },
      {
        key: 'hierarchical',
        label: 'Hierarchical Events',
        icon: 'bi-diagram-3'
      },
      {
        key: 'pickup-stations',
        label: 'Pickup Stations',
        icon: 'bi-geo-alt'
      }
    ];

    if (eventsLoading) {
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

    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-calendar me-2"></i>
            Event Management
          </h5>
        </div>
        <div className="card-body">
          <TabbedInterface
            tabs={eventTabs}
            activeTab={eventActiveTab}
            onTabChange={(tab) => {
              setEventActiveTab(tab);
            }}
          >            <TabPane tabId="list" title="All Events">
              <div className="events-container">
                <EventsList 
                  events={events}
                  loading={eventsLoading}
                  error={eventsError}
                  canManage={true} // Super admin can manage all events
                  canEdit={true}
                  canDelete={true}
                  onRefresh={() => {
                    refetchEvents();
                    refetchHierarchicalEvents();
                  }}
                  onCreateEvent={() => {
                    setEventActiveTab('create');
                  }}
                />
              </div>
            </TabPane><TabPane tabId="create" title="Create Event">
              <HierarchicalEventCreation 
                userRole={user?.role || 'super_admin'}
                onEventCreated={() => {
                  refetchEvents();
                  refetchHierarchicalEvents();
                  // Switch back to list tab after creation
                  setEventActiveTab('list');
                }}
              />
            </TabPane>            <TabPane tabId="hierarchical" title="Hierarchical Events">
              <div className="mb-3">
                <h6>System-wide Event Overview</h6>
                <p className="text-muted">Manage events across all organizational levels</p>
              </div>
              <div className="events-container">
                <EventsList 
                  events={hierarchicalEventsData || []}
                  loading={eventsLoading}
                  error={eventsError}
                  canManage={true}
                  canEdit={true}
                  canDelete={true}
                  showHierarchy={true}
                  onRefresh={refetchHierarchicalEvents}
                  onCreateEvent={() => {
                    setEventActiveTab('create');
                  }}
                />
              </div>
            </TabPane>

            <TabPane tabId="pickup-stations" title="Pickup Stations">
              <PickupStationAssignment 
                canManage={true}
                showGlobalView={true}
              />
            </TabPane>
          </TabbedInterface>
        </div>
      </div>
    );
  };
  const loadBranches = async () => {
    setBranchesLoading(true);
    setBranchesError(null);
    try {
      const response = await fetch(API_ENDPOINTS.BRANCHES.ALL_WITH_ADMINS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Branches API Response:', data); // Debug log
      
      // Handle different response formats
      let branchesArray = [];
      if (Array.isArray(data)) {
        branchesArray = data;
      } else if (data && Array.isArray(data.data)) {
        branchesArray = data.data;
      } else if (data && data.branches && Array.isArray(data.branches)) {
        branchesArray = data.branches;
      } else {
        console.warn('Unexpected branches response format:', data);
        branchesArray = [];
      }
      
      setBranches(branchesArray);
    } catch (err) {
      console.error('Error loading branches:', err);
      setBranchesError(err.message || 'Failed to load branches');
    } finally {
      setBranchesLoading(false);
    }
  };
  const renderBranches = () => {
    if (branchesLoading) {
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

    if (branchesError) {
      return (
        <ErrorDisplay 
          message={branchesError}
          onRetry={loadBranches}
        />
      );
    }

    // Ensure branches is always an array
    const branchesArray = Array.isArray(branches) ? branches : [];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">All Branches</h5>
            <p className="text-muted mb-0">
              {branchesArray.length} branch{branchesArray.length !== 1 ? 'es' : ''} across all states
            </p>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={loadBranches}
            disabled={branchesLoading}
          >
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </button>
        </div>

        {branchesArray.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-building fa-3x text-muted mb-3"></i>
              <h4>No Branches Found</h4>
              <p className="text-muted">No branches have been created yet.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>State</th>
                      <th>Branch Admin</th>
                      <th>Zones</th>
                      <th>Workers</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchesArray.map(branch => (
                      <tr key={branch._id}>
                        <td>
                          <div className="fw-bold">{branch.name}</div>
                          {branch.address && (
                            <small className="text-muted">{branch.address}</small>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {branch.stateId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          {branch.branchAdmin ? (
                            <div>
                              <div className="fw-bold">{branch.branchAdmin.name}</div>
                              <small className="text-muted">{branch.branchAdmin.email}</small>
                            </div>
                          ) : (
                            <span className="text-muted">No admin assigned</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {branch.zonesCount} zones
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {branch.workersCount} workers
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${branch.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
          >            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'admin-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-management')}
            type="button"
          >            <i className="bi bi-shield-check me-2"></i>
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
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            type="button"
          >            <i className="bi bi-calendar-event me-2"></i>
            Events
            {dashboardData?.activeEvents > 0 && (
              <span className="badge bg-info text-white ms-2">
                {dashboardData.activeEvents}
              </span>
            )}
          </button>        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'states' ? 'active' : ''}`}
            onClick={() => setActiveTab('states')}
            type="button"
          >
            <i className="bi bi-map me-2"></i>
            States
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
            type="button"
          >
            <i className="bi bi-building me-2"></i>
            Branches
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'admin-management' && renderAdminManagement()}
        {activeTab === 'events' && renderEventManagement()}
        {activeTab === 'states' && renderStatesManagement()}
        {activeTab === 'branches' && renderBranches()}
      </div>
    </div>
  );
};

export default SuperAdminTabs;
