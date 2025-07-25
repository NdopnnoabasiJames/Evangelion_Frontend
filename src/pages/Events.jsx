import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { ErrorDisplay, LoadingCard } from '../components/common/Loading';
import { TabbedInterface, TabPane } from '../components/common/TabNavigation';
import PageHeader from '../components/common/PageHeader';
import { API_ENDPOINTS } from '../utils/constants';
import EventsList from '../components/events/EventsList';
import EventDelegation from '../components/events/EventDelegation';
import HierarchicalEventCreation from '../components/events/HierarchicalEventCreation';
import PickupStationAssignment from '../components/events/PickupStationAssignment';
import RegistrarVolunteerEvents from '../components/registrars/RegistrarVolunteerEvents';
import PendingRegistrarRequests from '../components/registrars/PendingRegistrarRequests';

const Events = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'registrar' ? 'volunteer-events' : 'list');
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Fetch events based on user role
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  // Fetch events needing delegation for State/Branch Admins
  const { data: eventsNeedingBranchSelection, refetch: refetchBranchSelection } = useApi(
    user?.role === 'state_admin' ? API_ENDPOINTS.EVENTS.NEEDING_BRANCH_SELECTION : null,
    { immediate: user?.role === 'state_admin' }
  );

  const { data: eventsNeedingZoneSelection, refetch: refetchZoneSelection } = useApi(
    user?.role === 'branch_admin' ? API_ENDPOINTS.EVENTS.NEEDING_ZONE_SELECTION : null,
    { immediate: user?.role === 'branch_admin' }
  );  useEffect(() => {
    if (eventsData) {
      // Ensure we get the array of events from the API response
      const eventsArray = Array.isArray(eventsData) ? eventsData : (eventsData.data || []);
      setEvents(eventsArray);
    }
    setLoading(eventsLoading);
    setError(eventsError);
  }, [eventsData, eventsLoading, eventsError]);
  useEffect(() => {
    // Set pending events based on user role
    if (user?.role === 'state_admin' && eventsNeedingBranchSelection) {
      const pendingArray = Array.isArray(eventsNeedingBranchSelection) 
        ? eventsNeedingBranchSelection 
        : (eventsNeedingBranchSelection.data || []);
      setPendingEvents(pendingArray);
    } else if (user?.role === 'branch_admin' && eventsNeedingZoneSelection) {
      const pendingArray = Array.isArray(eventsNeedingZoneSelection) 
        ? eventsNeedingZoneSelection 
        : (eventsNeedingZoneSelection.data || []);
      setPendingEvents(pendingArray);
    }
  }, [eventsNeedingBranchSelection, eventsNeedingZoneSelection, user?.role]);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setActiveTab('edit');
  }, []);

  // Role-based permissions
  const canCreateEvents = ['super_admin', 'state_admin', 'branch_admin', 'zonal_admin'].includes(user?.role);
  const canEditEvents = ['super_admin', 'state_admin', 'branch_admin'].includes(user?.role);
  const canDelegateEvents = ['state_admin', 'branch_admin'].includes(user?.role);
  const canAssignPickupStations = user?.role === 'zonal_admin';
  const canViewPickupStations = ['super_admin', 'zonal_admin'].includes(user?.role);
  const isRegistrar = user?.role === 'registrar';
  const canApprovePendingRegistrars = user?.role === 'branch_admin';

  const refreshAllData = () => {
    refetch();
    if (refetchBranchSelection) refetchBranchSelection();
    if (refetchZoneSelection) refetchZoneSelection();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton-item mb-2" style={{ width: '250px', height: '2rem' }}></div>
              <div className="skeleton-item" style={{ width: '300px', height: '1rem' }}></div>
            </div>
            <div className="skeleton-item d-none d-md-block" style={{ width: '120px', height: '38px' }}></div>
          </div>
          
          <div className="row g-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-4">
                <LoadingCard loading className="h-100" minHeight="300px">
                  <div className="card-body">
                    <div className="skeleton-item mb-3" style={{ width: '70%', height: '1.5rem' }}></div>
                    <div className="skeleton-item mb-2" style={{ width: '100%', height: '1rem' }}></div>
                    <div className="skeleton-item mb-2" style={{ width: '60%', height: '1rem' }}></div>
                    <div className="skeleton-item" style={{ width: '40%', height: '1rem' }}></div>
                  </div>
                </LoadingCard>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <ErrorDisplay 
            error={error} 
            onRetry={refetch}
            title="Failed to load events"
          />
        </div>
      </Layout>
    );
  }

  const getTabsForRole = () => {
    const baseTabs = [];

    // For registrars, show volunteer events instead of regular events list
    if (isRegistrar) {
      baseTabs.push({
        key: 'volunteer-events',
        label: 'Volunteer Events',
        icon: 'bi-person-check'
      });
    } else {
      baseTabs.push({
        key: 'list',
        label: 'Events List',
        icon: 'bi-list-ul'
      });
    }

    if (canDelegateEvents && pendingEvents?.length > 0) {
      baseTabs.push({
        key: 'pending',
        label: `Pending Delegation (${pendingEvents.length})`,
        icon: 'bi-clock-history',
        badge: pendingEvents.length
      });
    }

    if (canApprovePendingRegistrars) {
      baseTabs.push({
        key: 'pending-registrars',
        label: 'Pending Registrars',
        icon: 'bi-person-exclamation'
      });
    }

    if (canCreateEvents) {
      baseTabs.push({
        key: 'create',
        label: 'Create Event',
        icon: 'bi-plus-circle'
      });
    }

    if (canEditEvents && editingEvent) {
      baseTabs.push({
        key: 'edit',
        label: 'Edit Event',
        icon: 'bi-pencil-square'
      });
    }    if (canViewPickupStations) {
      baseTabs.push({
        key: 'pickup-stations',
        label: user?.role === 'super_admin' ? 'View Pickup Stations' : 'Pickup Stations',
        icon: 'bi-geo-alt'
      });
    }

    return baseTabs;
  };
  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <PageHeader
          title="Events Management"
          subtitle={`Manage events and activities${user?.role ? ` as ${user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}`}
          actions={canCreateEvents ? [
            {
              label: 'Create Event',
              icon: 'bi-plus-circle',
              variant: 'primary',
              onClick: () => setActiveTab('create')
            }
          ] : []}
        />

        {/* Tab Navigation */}
        <TabbedInterface
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={getTabsForRole()}
          variant="tabs"
        >          
          {/* Registrar Volunteer Events Tab */}
          {isRegistrar && (
            <TabPane tabId="volunteer-events" title="Volunteer Events">
              <RegistrarVolunteerEvents />
            </TabPane>
          )}

          {/* Regular Events List for Admins */}
          {!isRegistrar && (
            <TabPane tabId="list" title="Events List">
              <EventsList 
                events={events}
                loading={loading}
                error={error}
                canEdit={canEditEvents}
                onRefresh={refreshAllData}
                onEditEvent={handleEditEvent}
                onCreateEvent={canCreateEvents ? () => {
                  setActiveTab('create');
                } : null}
              />
            </TabPane>
          )}

          {/* Pending Registrar Requests for Branch Admins */}
          {canApprovePendingRegistrars && (
            <TabPane tabId="pending-registrars" title="Pending Registrars">
              <PendingRegistrarRequests />
            </TabPane>
          )}

          {canDelegateEvents && pendingEvents?.length > 0 && (
            <TabPane tabId="pending" title="Pending Delegation">
              <EventDelegation 
                events={pendingEvents}
                userRole={user?.role}
                onDelegationComplete={refreshAllData}
              />
            </TabPane>
          )}          {canCreateEvents && (
            <TabPane tabId="create" title="Create Event">
              <HierarchicalEventCreation 
                userRole={user?.role}
                onEventCreated={() => {
                  setActiveTab('list');
                  // Small delay to ensure backend has processed the event
                  setTimeout(() => {
                    refreshAllData();
                  }, 500);
                }}
              />
            </TabPane>
          )}

          {canEditEvents && editingEvent && (
            <TabPane tabId="edit" title="Edit Event">
              <HierarchicalEventCreation 
                userRole={user?.role}
                editingEvent={editingEvent}
                onEventCreated={() => {
                  setEditingEvent(null);
                  setActiveTab('list');
                  // Small delay to ensure backend has processed the event
                  setTimeout(() => {
                    refreshAllData();
                  }, 500);
                }}
              />
            </TabPane>
          )}          {canViewPickupStations && (
            <TabPane tabId="pickup-stations" title="Pickup Stations">
              <PickupStationAssignment 
                zonalAdminId={user?.id}
                userRole={user?.role}
                onAssignmentComplete={refreshAllData}
              />
            </TabPane>
          )}</TabbedInterface>
      </div>
    </Layout>
  );
};

export default Events;
