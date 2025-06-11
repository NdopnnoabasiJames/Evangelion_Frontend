// filepath: c:\Users\hp\OneDrive\Desktop\EVANGELION\Evangelion_Frontend\src\components\dashboard\StateAdminEvents.jsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import EventsList from '../events/EventsList';
import EventDelegation from '../events/EventDelegation';
import HierarchicalEventCreation from '../events/HierarchicalEventCreation';
import { TabbedInterface, TabPane } from '../common/TabNavigation';
import { LoadingCard } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';

const StateAdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [eventActiveTab, setEventActiveTab] = useState('list');

  // Fetch events for state admin
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  // Fetch events needing branch selection
  const { data: eventsNeedingBranchSelection, refetch: refetchBranchSelection } = useApi(
    API_ENDPOINTS.EVENTS.NEEDING_BRANCH_SELECTION,
    { immediate: true }
  );

  // Update events data when API data changes
  useEffect(() => {
    if (eventsData) {
      const processedEvents = Array.isArray(eventsData) 
        ? eventsData 
        : (eventsData.data || []);
      setEvents(processedEvents);
    }
    if (eventsNeedingBranchSelection) {
      const pendingArray = Array.isArray(eventsNeedingBranchSelection) 
        ? eventsNeedingBranchSelection 
        : (eventsNeedingBranchSelection.data || []);
      setPendingEvents(pendingArray);
    }
  }, [eventsData, eventsNeedingBranchSelection]);

  const handleRefresh = () => {
    refetchEvents();
    refetchBranchSelection();
  };

  const handleDelegationComplete = () => {
    refetchEvents();
    refetchBranchSelection();
  };

  const handleEventCreated = () => {
    setEventActiveTab('list');
    setTimeout(() => {
      refetchEvents();
      refetchBranchSelection();
    }, 500);
  };

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

  const eventTabs = [
    {
      key: 'list',
      label: 'All Events',
      icon: 'bi-list-ul'
    },
    {
      key: 'pending',
      label: `Branch Selection (${pendingEvents.length})`,
      icon: 'bi-clock-history',
      badge: pendingEvents.length > 0 ? pendingEvents.length : null
    },
    {
      key: 'create',
      label: 'Create Event',
      icon: 'bi-plus-circle'
    }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-calendar me-2"></i>
          Events Management
        </h5>
      </div>
      <div className="card-body">
        <TabbedInterface
          activeTab={eventActiveTab}
          onTabChange={setEventActiveTab}
          tabs={eventTabs}
        >
          <TabPane tabId="list" title="All Events">
            <div className="events-container">
              <EventsList 
                events={events}
                loading={eventsLoading}
                error={eventsError}
                canEdit={true}
                onRefresh={handleRefresh}
                onCreateEvent={() => setEventActiveTab('create')}
              />
            </div>
          </TabPane>

          <TabPane tabId="pending" title="Branch Selection">
            <div className="mb-3">
              <h6>Super Admin Events Needing Branch Selection</h6>
              <p className="text-muted">
                These events have been created by super admins and are available in your state. 
                Please select which branches should participate in each event.
              </p>
            </div>
            <div className="events-container">
              <EventDelegation 
                events={pendingEvents}
                userRole="state_admin"
                onDelegationComplete={handleDelegationComplete}
              />
            </div>
          </TabPane>

          <TabPane tabId="create" title="Create Event">
            <HierarchicalEventCreation 
              userRole="state_admin"
              onEventCreated={handleEventCreated}
            />
          </TabPane>
        </TabbedInterface>
      </div>
    </div>
  );
};

export default StateAdminEvents;
