import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { TabPane, TabContent, TabbedInterface } from '../common/TabNavigation';
import Loading, { ErrorDisplay } from '../common/Loading';
import EventDelegation from '../events/EventDelegation';
import EventsList from '../events/EventsList';
import HierarchicalEventCreation from '../events/HierarchicalEventCreation';

const BranchAdminEvents = ({ isReadOnly = false }) => {
  const [eventActiveTab, setEventActiveTab] = useState('pending');
  const [editingEvent, setEditingEvent] = useState(null);
  
  // API hooks for different event types
  const { 
    data: pendingEvents, 
    loading: pendingLoading, 
    error: pendingError, 
    execute: refetchZoneSelection 
  } = useApi(API_ENDPOINTS.EVENTS.NEEDING_ZONE_SELECTION);
  const { 
    data: branchEvents, 
    loading: branchLoading, 
    error: branchError, 
    execute: refetchEvents  } = useApi(API_ENDPOINTS.EVENTS.ACCESSIBLE);

  // Refresh all data
  const refreshAllData = () => {
    refetchZoneSelection();
    refetchEvents();
  };

  const handleDelegationComplete = () => {
    refetchEvents();
    refetchZoneSelection();
  };

  const handleEventCreated = () => {
    setEventActiveTab('list');
    setTimeout(() => {
      refetchEvents();
      refetchZoneSelection();
    }, 500);
  };

  const handleEditEvent = (event) => {
    // Branch admins can only edit their own events
    if (event.creatorLevel === 'branch_admin') {
      setEditingEvent(event);
      setEventActiveTab('edit');
    }
  };

  // Function to determine if an event can be edited by branch admin
  const canEditEvent = (event) => {
    return event.creatorLevel === 'branch_admin';
  };

  const renderTabContent = () => {
    switch (eventActiveTab) {
      case 'pending':        if (pendingLoading) return <Loading />;
        if (pendingError) return <ErrorDisplay message={pendingError} />;
        
        return (
          <div>
            <div className="mb-3">
              <h6>Upcoming Events Needing Zone Selection</h6>
              <p className="text-muted">
                These upcoming events have been delegated to your branch. Please select which zones should participate in each event. Past events are automatically hidden.
              </p>
            </div>
            <div className="events-container">
              <EventDelegation 
                events={pendingEvents}
                userRole="branch_admin"
                onDelegationComplete={handleDelegationComplete}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        );      case 'list':        if (branchLoading) return <Loading />;
        if (branchError) return <ErrorDisplay message={branchError} />;
        
        // Extract events array from API response
        const eventsArray = Array.isArray(branchEvents) ? branchEvents : 
                           Array.isArray(branchEvents?.data) ? branchEvents.data : [];
        
        return (
          <div>
            <div className="mb-3">
              <h6>Branch Events</h6>
              <p className="text-muted">
                Events accessible in your branch - including events you created and events delegated to your branch.
              </p>
            </div>
            <EventsList 
              events={eventsArray} 
              userRole="branch_admin" 
              isReadOnly={isReadOnly}
              canEdit={canEditEvent}
              onEditEvent={handleEditEvent}
            />
          </div>
        );

      case 'create':
        return (
          <HierarchicalEventCreation 
            userRole="branch_admin"
            onEventCreated={handleEventCreated}
          />
        );

      case 'edit':
        return (
          <HierarchicalEventCreation 
            userRole="branch_admin"
            editingEvent={editingEvent}
            onEventCreated={() => {
              setEditingEvent(null);
              handleEventCreated();
            }}
          />
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="branch-admin-events">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Event Management</h4>
          <p className="text-muted mb-0">Manage zones for delegated events and create branch events</p>
        </div>
      </div>      <TabbedInterface
        tabs={[
          {
            key: 'pending',
            label: 'Zone Selection',
            icon: 'bi-diagram-3',
            badge: (() => {
              const pendingArray = Array.isArray(pendingEvents) ? pendingEvents : 
                                  Array.isArray(pendingEvents?.data) ? pendingEvents.data : [];
              
              // Filter to only count upcoming events
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingPendingEvents = pendingArray.filter(event => {
                // For multiday events, check the end date
                if (event.eventType === 'multi-day') {
                  if (!event.endDate) return true;
                  const eventEndDate = new Date(event.endDate);
                  eventEndDate.setHours(0, 0, 0, 0);
                  return eventEndDate >= today;
                }
                
                // For single-day events, check the date
                if (!event.date) return true;
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
              });
              
              return upcomingPendingEvents.length > 0 ? 
                     { count: upcomingPendingEvents.length, className: 'bg-warning' } : null;
            })()
          },
          {
            key: 'list',
            label: 'Branch Events',
            icon: 'bi-calendar-event',
            badge: (() => {
              const branchArray = Array.isArray(branchEvents) ? branchEvents : 
                                 Array.isArray(branchEvents?.data) ? branchEvents.data : [];
              return branchArray.length > 0 ? 
                     { count: branchArray.length, className: 'bg-primary' } : null;
            })()
          },
          // Hide Create Event tab for Branch ME users
          ...(!isReadOnly ? [{
            key: 'create',
            label: 'Create Event',
            icon: 'bi-plus-circle'
          }] : []),
          // Edit Event tab (only show when editing)
          ...(editingEvent ? [{
            key: 'edit',
            label: 'Edit Event',
            icon: 'bi-pencil'
          }] : [])
        ]}
        activeTab={eventActiveTab}
        onTabChange={setEventActiveTab}
      >
        <TabPane tabId="pending">
          {eventActiveTab === 'pending' && renderTabContent()}
        </TabPane>
        <TabPane tabId="list">
          {eventActiveTab === 'list' && renderTabContent()}
        </TabPane>
        {/* Hide Create Event tab for Branch ME users */}
        {!isReadOnly && (
          <TabPane tabId="create">
            {eventActiveTab === 'create' && renderTabContent()}
          </TabPane>
        )}
        {/* Edit Event tab */}
        {editingEvent && (
          <TabPane tabId="edit">
            {eventActiveTab === 'edit' && renderTabContent()}
          </TabPane>
        )}
      </TabbedInterface>
    </div>
  );
};

export default BranchAdminEvents;
