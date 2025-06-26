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

const SuperAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  
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
  const handleApproveAdmin = (adminId) => adminHooks.handleApproveAdmin(adminId, loadPendingAdmins, loadApprovedAdmins, setError);
  const handleRejectAdmin = (adminId, reason) => adminHooks.handleRejectAdmin(adminId, reason, loadPendingAdmins, setError);const renderOverview = () => (
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
    />
  );

  const renderStatesManagement = () => (
    <AdminStatesTab />
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
    />
  );
  const renderBranches = () => <AdminBranchesTab />;

  const renderZones = () => <AdminZonesTab />;

  const renderWorkers = () => <AdminWorkersTab />;

  const renderGuests = () => <AdminGuestsTab />;

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
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
            type="button"
          >
            <i className="bi bi-building me-2"></i>
            Branches
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
            type="button"
          >
            <i className="bi bi-diagram-3 me-2"></i>
            Zones
          </button>
        </li>        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
            type="button"
          >
            <i className="bi bi-person-gear me-2"></i>
            Workers
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('guests')}
            type="button"
          >
            <i className="bi bi-person-check me-2"></i>
            Guests
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
        {activeTab === 'guests' && renderGuests()}
      </div>
    </div>
  );
};

export default SuperAdminTabs;
