import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import { isReadOnlyRole } from '../../utils/readOnlyHelpers';
import { useAdminManagement } from './hooks/useAdminManagement';
import AdminOverviewTab from './tabs/AdminOverviewTab';
import AdminManagementTab from './tabs/AdminManagementTab';
import AdminStatesTab from './tabs/AdminStatesTab';
import AdminEventsTab from './tabs/AdminEventsTab';
import AdminBranchesTab from './tabs/AdminBranchesTab';
import AdminZonesTab from './tabs/AdminZonesTab';
import AdminWorkersTab from './tabs/AdminWorkersTab';
import AdminGuestsTab from './tabs/AdminGuestsTab';
import SuperAdminPickupStationsTab from './tabs/SuperAdminPickupStationsTab';
import RegistrarsManagement from '../admin/RegistrarsManagement';

const SuperAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  
  // Check if user is in read-only M&E role
  const isReadOnly = isReadOnlyRole(user?.currentRole || user?.role);
  
  // Import custom hooks for admin management only
  const adminHooks = useAdminManagement();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedError, setApprovedError] = useState(null);
  
  // Event management state
  const [events, setEvents] = useState([]);
  const [eventActiveTab, setEventActiveTab] = useState('list');
  // Fetch events data for super admin
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: activeTab === 'events' }
  );

  const { data: hierarchicalEventsData, refetch: refetchHierarchicalEvents } = useApi(
    API_ENDPOINTS.EVENTS.HIERARCHICAL,
    { immediate: activeTab === 'events' }
  );  // Load data when tabs are active
  useEffect(() => {
    if (activeTab === 'admin-management') {
      adminHooks.loadPendingAdmins(setPendingAdmins, setLoading, setError);
      adminHooks.loadApprovedAdmins(setApprovedAdmins, setApprovedLoading, setApprovedError);
    } else if (activeTab === 'events') {
      // Events data is loaded automatically via useApi hook
      if (eventsData) {
        // Handle both direct array and wrapped response
        const processedEvents = Array.isArray(eventsData) 
          ? eventsData 
          : (eventsData.data || []);
        setEvents(processedEvents);
      }
    }
  }, [activeTab, eventsData]);
  // Wrapper functions for admin management
  const loadPendingAdmins = () => adminHooks.loadPendingAdmins(setPendingAdmins, setLoading, setError);
  const loadApprovedAdmins = () => adminHooks.loadApprovedAdmins(setApprovedAdmins, setApprovedLoading, setApprovedError);
  
  const handleApproveAdmin = (adminId) => {
    if (isReadOnly) {
      return;
    }
    adminHooks.handleApproveAdmin(adminId, loadPendingAdmins, loadApprovedAdmins, setError);
  };
  
  const handleRejectAdmin = (adminId, reason) => {
    if (isReadOnly) {
      return;
    }
    adminHooks.handleRejectAdmin(adminId, reason, loadPendingAdmins, setError);
  };

  // Handle tab switching with read-only checks for modification tabs
  const handleTabSwitch = (tabName) => {
    const modificationTabs = ['admin-management', 'events', 'states', 'branches', 'zones', 'workers', 'registrars'];
    
    if (isReadOnly && modificationTabs.includes(tabName)) {
      // For M&E roles, allow viewing but show read-only indicator
      setActiveTab(tabName);
    } else {
      setActiveTab(tabName);
    }
  };const renderOverview = () => (
    <AdminOverviewTab 
      dashboardData={dashboardData}
      setActiveTab={setActiveTab}
    />
  );

  const renderAdminManagement = () => (
    <AdminManagementTab
      loading={loading}
      error={error}
      pendingAdmins={pendingAdmins}
      approvedAdmins={approvedAdmins}
      approvedLoading={approvedLoading}
      approvedError={approvedError}
      loadPendingAdmins={loadPendingAdmins}
      loadApprovedAdmins={loadApprovedAdmins}
      handleApproveAdmin={handleApproveAdmin}
      handleRejectAdmin={handleRejectAdmin}
      isReadOnly={isReadOnly}
    />
  );

  const renderStatesManagement = () => (
    <AdminStatesTab isReadOnly={isReadOnly} />
  );

  const renderEventManagement = () => (
    <AdminEventsTab
      events={events}
      eventsLoading={eventsLoading}
      eventsError={eventsError}
      hierarchicalEventsData={hierarchicalEventsData}
      eventActiveTab={eventActiveTab}
      setEventActiveTab={setEventActiveTab}
      refetchEvents={refetchEvents}
      refetchHierarchicalEvents={refetchHierarchicalEvents}
      user={user}
      isReadOnly={isReadOnly}
    />
  );
  const renderBranches = () => <AdminBranchesTab isReadOnly={isReadOnly} />;

  const renderZones = () => <AdminZonesTab isReadOnly={isReadOnly} />;

  const renderWorkers = () => <AdminWorkersTab isReadOnly={isReadOnly} />;

  const renderGuests = () => <AdminGuestsTab isReadOnly={isReadOnly} />;

  const renderPickupStations = () => <SuperAdminPickupStationsTab isReadOnly={isReadOnly} />;

  const renderRegistrars = () => <RegistrarsManagement isReadOnly={isReadOnly} />;

  return (
    <div className="admin-tabs-container">
      {/* Tab Navigation */}
      <ul className="nav nav-tabs nav-tabs-responsive mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('overview')}
            type="button"
          >            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'admin-management' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('admin-management')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >            <i className="bi bi-shield-check me-2"></i>
            Admin Management
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
            {pendingAdmins.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingAdmins.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('events')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >            <i className="bi bi-calendar-event me-2"></i>
            Events
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
            {dashboardData?.activeEvents > 0 && (
              <span className="badge bg-info text-white ms-2">
                {dashboardData.activeEvents}
              </span>
            )}
          </button>        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'states' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('states')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-map me-2"></i>
            States
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('branches')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-building me-2"></i>
            Branches
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zones' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('zones')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-diagram-3 me-2"></i>
            Zones
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'workers' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('workers')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-person-gear me-2"></i>
            Workers
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'registrars' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('registrars')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-person-badge me-2"></i>
            Registrars
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'guests' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('guests')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-person-check me-2"></i>
            Guests
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''} ${isReadOnly ? 'text-muted' : ''}`}
            onClick={() => handleTabSwitch('pickup-stations')}
            type="button"
            title={isReadOnly ? 'Read-only access for M&E role' : ''}
          >
            <i className="bi bi-geo-alt me-2"></i>
            Pickup Stations
            {isReadOnly && <i className="bi bi-eye-fill ms-1 text-info"></i>}
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'admin-management' && renderAdminManagement()}
        {activeTab === 'events' && renderEventManagement()}
        {activeTab === 'states' && renderStatesManagement()}
        {activeTab === 'branches' && renderBranches()}
        {activeTab === 'zones' && renderZones()}
        {activeTab === 'workers' && renderWorkers()}
        {activeTab === 'registrars' && renderRegistrars()}
        {activeTab === 'guests' && renderGuests()}
        {activeTab === 'pickup-stations' && renderPickupStations()}
      </div>
    </div>
  );
};

export default SuperAdminTabs;
