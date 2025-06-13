import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { TabPane, TabContent, TabbedInterface } from '../common/TabNavigation';
import Loading, { ErrorDisplay } from '../common/Loading';
import EventDelegation from '../events/EventDelegation';
import EventsList from '../events/EventsList';
import HierarchicalEventCreation from '../events/HierarchicalEventCreation';

const BranchAdminEvents = () => {
  const [eventActiveTab, setEventActiveTab] = useState('pending');
  
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

  const renderTabContent = () => {
    switch (eventActiveTab) {
      case 'pending':        if (pendingLoading) return <Loading />;
        if (pendingError) return <ErrorDisplay message={pendingError} onRetry={refetchZoneSelection} />;
        
        return (
          <div>
            <div className="mb-3">
              <h6>Events Needing Zone Selection</h6>
              <p className="text-muted">
                These events have been delegated to your branch. Please select which zones should participate in each event.
              </p>
            </div>
            <div className="events-container">
              <EventDelegation 
                events={pendingEvents}
                userRole="branch_admin"
                onDelegationComplete={handleDelegationComplete}
              />
            </div>
          </div>
        );      case 'list':        if (branchLoading) return <Loading />;
        if (branchError) return <ErrorDisplay message={branchError} onRetry={refetchEvents} />;
        
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
            <EventsList events={eventsArray} userRole="branch_admin" />
          </div>
        );

      case 'create':
        return (
          <HierarchicalEventCreation 
            userRole="branch_admin"
            onEventCreated={handleEventCreated}
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
        <button 
          className="btn btn-outline-primary"
          onClick={refreshAllData}
          disabled={pendingLoading || branchLoading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>      <TabbedInterface
        tabs={[
          {
            key: 'pending',
            label: 'Zone Selection',
            icon: 'bi-diagram-3',
            badge: (() => {
              const pendingArray = Array.isArray(pendingEvents) ? pendingEvents : 
                                  Array.isArray(pendingEvents?.data) ? pendingEvents.data : [];
              return pendingArray.length > 0 ? 
                     { count: pendingArray.length, className: 'bg-warning' } : null;
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
          {
            key: 'create',
            label: 'Create Event',
            icon: 'bi-plus-circle'
          }
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
        <TabPane tabId="create">
          {eventActiveTab === 'create' && renderTabContent()}
        </TabPane>
      </TabbedInterface>
    </div>
  );
};

export default BranchAdminEvents;
