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
  eventActiveTab,
  setEventActiveTab,
  refetchEvents,
  user,
  isReadOnly = false
}) => {
  const [editingEvent, setEditingEvent] = useState(null);
  
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventActiveTab('edit');
  };
  const eventTabs = [
    {
      key: 'list',
      label: 'All Events',
      icon: 'bi-list-ul'
    },
    // Hide Create Event tab for Super ME users
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
                isReadOnly={isReadOnly}
                onEditEvent={!isReadOnly ? handleEditEvent : undefined}
                onRefresh={() => {
                  refetchEvents();
                }}
                onCreateEvent={!isReadOnly ? () => {
                  setEventActiveTab('create');
                } : undefined}
              />
            </div>
          </TabPane>

          {!isReadOnly && (
            <TabPane tabId="create" title="Create Event">
              <HierarchicalEventCreation 
                userRole={user?.role || 'super_admin'}
                onEventCreated={() => {
                  refetchEvents();
                  // Switch back to list tab after creation
                  setEventActiveTab('list');
                }}
              />
            </TabPane>
          )}

          {editingEvent && !isReadOnly && (
            <TabPane tabId="edit" title="Edit Event">
              <HierarchicalEventCreation 
                userRole={user?.role || 'super_admin'}
                editingEvent={editingEvent}
                onEventCreated={() => {
                  setEditingEvent(null);
                  refetchEvents();
                  // Switch back to list tab after editing
                  setEventActiveTab('list');
                }}
              />
            </TabPane>
          )}

          <TabPane tabId="pickup-stations" title="Pickup Stations">
            <PickupStationAssignment 
              canManage={!isReadOnly}
              showGlobalView={true}
              isReadOnly={isReadOnly}
            />
          </TabPane>
        </TabbedInterface>
      </div>
    </div>
  );
};

export default AdminEventsTab;
