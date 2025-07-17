import React, { useState } from 'react';
import { LoadingCard } from '../../common/Loading';
import { TabbedInterface, TabPane } from '../../common/TabNavigation';
import EventsList from '../../events/EventsList';
import HierarchicalEventCreation from '../../events/HierarchicalEventCreation';
import PickupStationAssignment from '../../events/PickupStationAssignment';

const AdminEventsTab = ({
  events,
  eventsLoading,
  eventsError,
  hierarchicalEventsData,
  eventActiveTab,
  setEventActiveTab,
  refetchEvents,
  refetchHierarchicalEvents,
  user,
  isReadOnly = false
}) => {
  const [editingEvent, setEditingEvent] = useState(null);
  
  const handleEditEvent = (event) => {
    if (isReadOnly) {
      return;
    }
    setEditingEvent(event);
    setEventActiveTab('edit');
  };

  const handleTabSwitch = (tabKey) => {
    const restrictedTabs = ['create', 'edit'];
    if (isReadOnly && restrictedTabs.includes(tabKey)) {
      return;
    }
    setEventActiveTab(tabKey);
  };
  const eventTabs = [
    {
      key: 'list',
      label: 'All Events',
      icon: 'bi-list-ul'
    },
    ...(!isReadOnly ? [{
      key: 'create',
      label: 'Create Event',
      icon: 'bi-plus-circle'
    }] : []),
    ...(editingEvent && !isReadOnly ? [{
      key: 'edit',
      label: 'Edit Event',
      icon: 'bi-pencil-square'
    }] : []),
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
        {/* Read-only indicator for M&E roles */}
        {isReadOnly && (
          <div className="alert alert-info mb-3" role="alert">
            <i className="bi bi-eye me-2"></i>
            <strong>Monitoring & Evaluation Mode:</strong> You are viewing in read-only mode. Event modification is not permitted for M&E roles.
          </div>
        )}
        
        <TabbedInterface
          tabs={eventTabs}
          activeTab={eventActiveTab}
          onTabChange={handleTabSwitch}
        >
          <TabPane tabId="list" title="All Events">
            <div className="events-container">
              <EventsList 
                events={events}
                loading={eventsLoading}
                error={eventsError}
                canManage={!isReadOnly} // Super admin can manage all events
                canEdit={!isReadOnly}
                canDelete={!isReadOnly}
                onEditEvent={handleEditEvent}
                onRefresh={() => {
                  refetchEvents();
                  refetchHierarchicalEvents();
                }}
                onCreateEvent={() => {
                  setEventActiveTab('create');
                }}
              />
            </div>
          </TabPane>

          <TabPane tabId="create" title="Create Event">
            <HierarchicalEventCreation 
              userRole={user?.role || 'super_admin'}
              onEventCreated={() => {
                refetchEvents();
                refetchHierarchicalEvents();
                // Switch back to list tab after creation
                setEventActiveTab('list');
              }}
            />
          </TabPane>

          {editingEvent && (
            <TabPane tabId="edit" title="Edit Event">
              <HierarchicalEventCreation 
                userRole={user?.role || 'super_admin'}
                editingEvent={editingEvent}
                onEventCreated={() => {
                  setEditingEvent(null);
                  refetchEvents();
                  refetchHierarchicalEvents();
                  // Switch back to list tab after editing
                  setEventActiveTab('list');
                }}
              />
            </TabPane>
          )}

          <TabPane tabId="hierarchical" title="Hierarchical Events">
            <div className="mb-3">
              <h6>System-wide Event Overview</h6>
              <p className="text-muted">Manage events across all organizational levels</p>
            </div>
            <div className="events-container">
              <EventsList 
                events={hierarchicalEventsData || []}
                loading={eventsLoading}
                error={eventsError}
                canManage={!isReadOnly}
                canEdit={!isReadOnly}
                canDelete={!isReadOnly}
                showHierarchy={true}
                onEditEvent={handleEditEvent}
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

export default AdminEventsTab;
