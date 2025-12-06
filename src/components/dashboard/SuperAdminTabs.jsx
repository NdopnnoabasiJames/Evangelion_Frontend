import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';
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
  
  // Determine if user should have read-only access (Super ME)
  const isReadOnly = user?.role === 'super_me';
  
  // Import custom hooks for admin management only
  const adminHooks = useAdminManagement();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Load data when tabs are active
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
  const handleApproveAdmin = (adminId) => adminHooks.handleApproveAdmin(adminId, loadPendingAdmins, loadApprovedAdmins, setError);
  const handleRejectAdmin = (adminId, reason) => adminHooks.handleRejectAdmin(adminId, reason, loadPendingAdmins, setError);  const renderOverview = () => (
    <AdminOverviewTab 
      dashboardData={dashboardData}
      setActiveTab={setActiveTab}
      isReadOnly={isReadOnly}
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
      eventActiveTab={eventActiveTab}
      setEventActiveTab={setEventActiveTab}
      refetchEvents={refetchEvents}
      user={user}
      isReadOnly={isReadOnly}
    />
  );
  const renderBranches = () => <AdminBranchesTab isReadOnly={isReadOnly} />;

  const renderZones = () => <AdminZonesTab isReadOnly={isReadOnly} />;

  const renderWorkers = () => <AdminWorkersTab isReadOnly={isReadOnly} />;

  const renderGuests = () => <AdminGuestsTab isReadOnly={isReadOnly} />;

  // Handle tab change and close mobile menu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const renderPickupStations = () => <SuperAdminPickupStationsTab isReadOnly={isReadOnly} />;

  const renderRegistrars = () => <RegistrarsManagement isReadOnly={isReadOnly} />;

  return (
    <div className="admin-tabs-container">
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
      
      {/* Mobile Navigation */}
      <div className="d-md-none mb-3">
        <div className="position-relative mb-3">
          <h5 className="mb-0 text-start">
            {activeTab === 'overview' && <><i className="bi bi-graph-up me-2"></i>Overview</>}
            {activeTab === 'admin-management' && <><i className="bi bi-shield-check me-2"></i>Admin Management</>}
            {activeTab === 'events' && <><i className="bi bi-calendar-event me-2"></i>Events</>}
            {activeTab === 'states' && <><i className="bi bi-map me-2"></i>States</>}
            {activeTab === 'branches' && <><i className="bi bi-building me-2"></i>Branches</>}
            {activeTab === 'zones' && <><i className="bi bi-diagram-3 me-2"></i>Zones</>}
            {activeTab === 'workers' && <><i className="bi bi-person-gear me-2"></i>Workers</>}
            {activeTab === 'registrars' && <><i className="bi bi-person-badge me-2"></i>Registrars/PCU/Internship</>}
            {activeTab === 'guests' && <><i className="bi bi-person-check me-2"></i>Guests</>}
            {activeTab === 'pickup-stations' && <><i className="bi bi-geo-alt me-2"></i>Pickup Stations</>}
          </h5>
          <button 
            className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0"
            style={{ width: '32px', height: '32px', padding: '0', marginTop: '-8px' }}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x' : 'bi-list'} small`}></i>
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu show d-md-none">
            <div className="list-group">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
                type="button"
              >
                <i className="bi bi-graph-up me-2"></i>
                Overview
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'admin-management' ? 'active' : ''}`}
                onClick={() => handleTabChange('admin-management')}
                type="button"
              >
                <i className="bi bi-shield-check me-2"></i>
                Admin Management
                {pendingAdmins.length > 0 && (
                  <span className="badge bg-warning text-dark ms-2">
                    {pendingAdmins.length}
                  </span>
                )}
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleTabChange('events')}
                type="button"
              >
                <i className="bi bi-calendar-event me-2"></i>
                Events
                {dashboardData?.activeEvents > 0 && (
                  <span className="badge bg-info text-white ms-2">
                    {dashboardData.activeEvents}
                  </span>
                )}
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'states' ? 'active' : ''}`}
                onClick={() => handleTabChange('states')}
                type="button"
              >
                <i className="bi bi-map me-2"></i>
                States
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'branches' ? 'active' : ''}`}
                onClick={() => handleTabChange('branches')}
                type="button"
              >
                <i className="bi bi-building me-2"></i>
                Branches
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'zones' ? 'active' : ''}`}
                onClick={() => handleTabChange('zones')}
                type="button"
              >
                <i className="bi bi-diagram-3 me-2"></i>
                Zones
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'workers' ? 'active' : ''}`}
                onClick={() => handleTabChange('workers')}
                type="button"
              >
                <i className="bi bi-person-gear me-2"></i>
                Workers
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'registrars' ? 'active' : ''}`}
                onClick={() => handleTabChange('registrars')}
                type="button"
              >
                <i className="bi bi-person-badge me-2"></i>
                Registrars/PCU/Internship
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'guests' ? 'active' : ''}`}
                onClick={() => handleTabChange('guests')}
                type="button"
              >
                <i className="bi bi-person-check me-2"></i>
                Guests
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'pickup-stations' ? 'active' : ''}`}
                onClick={() => handleTabChange('pickup-stations')}
                type="button"
              >
                <i className="bi bi-geo-alt me-2"></i>
                Pickup Stations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Tab Navigation */}
      <ul className="nav nav-tabs nav-tabs-responsive mb-4 d-none d-md-flex" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
            type="button"
          >            <i className="bi bi-graph-up me-2"></i>
            Overview
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'admin-management' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin-management')}
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
            onClick={() => handleTabChange('events')}
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
            onClick={() => handleTabChange('states')}
            type="button"
          >
            <i className="bi bi-map me-2"></i>
            States
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => handleTabChange('branches')}
            type="button"
          >
            <i className="bi bi-building me-2"></i>
            Branches
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => handleTabChange('zones')}
            type="button"
          >
            <i className="bi bi-diagram-3 me-2"></i>
            Zones
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => handleTabChange('workers')}
            type="button"
          >
            <i className="bi bi-person-gear me-2"></i>
            Workers
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'registrars' ? 'active' : ''}`}
            onClick={() => handleTabChange('registrars')}
            type="button"
          >
            <i className="bi bi-person-badge me-2"></i>
            Registrars/PCU/Internship
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => handleTabChange('guests')}
            type="button"
          >
            <i className="bi bi-person-check me-2"></i>
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
            Pickup Stations
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content mt-4 mt-md-0">
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
