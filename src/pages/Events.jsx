import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { DataListState, ErrorDisplay, EmptyState, LoadingCard } from '../components/common/Loading';
import { TabbedInterface, TabPane } from '../components/common/TabNavigation';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { StatusBadge } from '../utils/statusUtils.jsx';
import { API_ENDPOINTS } from '../utils/constants';

const Events = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events based on user role
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
    }
    setLoading(eventsLoading);
    setError(eventsError);
  }, [eventsData, eventsLoading, eventsError]);

  // Role-based permissions
  const canCreateEvents = ['SUPER_ADMIN', 'STATE_ADMIN', 'BRANCH_ADMIN', 'ZONAL_ADMIN'].includes(user?.role);
  const canEditEvents = ['SUPER_ADMIN', 'STATE_ADMIN', 'BRANCH_ADMIN'].includes(user?.role);

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
  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <PageHeader 
          title="Events Management"
          subtitle="Manage church events and activities"
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
          tabs={[
            {
              key: 'list',
              label: 'Events List',
              icon: 'bi-list-ul'
            },
            ...(canCreateEvents ? [{
              key: 'create',
              label: 'Create Event',
              icon: 'bi-plus-circle'
            }] : [])
          ]}
          variant="tabs"
        >
          <TabPane tabId="list" title="Events List">
            <EventsList 
              events={events}
              loading={loading}
              error={error}
              canEdit={canEditEvents}
              onRefresh={refetch}
            />
          </TabPane>

          {canCreateEvents && (
            <TabPane tabId="create" title="Create Event">
              <CreateEvent 
                userRole={user?.role}
                onEventCreated={() => {
                  setActiveTab('list');
                  refetch();
                }}
              />
            </TabPane>
          )}
        </TabbedInterface>
      </div>
    </Layout>
  );
};

// Events List Component with enhanced mobile responsiveness
const EventsList = ({ events, loading, error, canEdit, onRefresh }) => {
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRefresh}
        title="Failed to load events"
      />
    );
  }

  if (!events || events.length === 0) {
    return (
      <EmptyState 
        icon="bi-calendar-event"
        title="No Events Found"
        description="There are no events available at the moment. Create your first event to get started."
        action={
          <button className="btn btn-primary mt-3">
            <i className="bi bi-plus-circle me-2"></i>
            Create Your First Event
          </button>
        }
      />
    );
  }

  return (
    <div className="row g-4">
      {events.map((event) => (
        <div key={event._id} className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 card-hover-lift">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-start">
                <h5 className="card-title mb-1 text-truncate" style={{ color: 'var(--primary-purple)' }}>
                  {event.name}
                </h5>                <StatusBadge status={event.status} type="event" className="flex-shrink-0 ms-2" />
              </div>
            </div>
            
            <div className="card-body pt-2">
              <div className="mb-2">
                <i className="bi bi-calendar-event me-2 text-muted"></i>
                <small className="text-muted">
                  {new Date(event.date).toLocaleDateString()}
                </small>
              </div>
              
              <div className="mb-2">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small className="text-muted text-truncate d-block">
                  {event.location || 'Location TBD'}
                </small>
              </div>
              
              {event.description && (
                <p className="card-text text-muted small mb-3" style={{ 
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {event.description}
                </p>
              )}
              
              <div className="d-flex justify-content-between align-items-center mt-auto">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  {event.participantCount || 0}
                  <span className="d-none d-sm-inline"> participants</span>
                </small>
                
                {canEdit && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    aria-label={`Edit ${event.name}`}
                  >
                    <i className="bi bi-pencil"></i>
                    <span className="d-none d-lg-inline ms-1">Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Create Event Component
const CreateEvent = ({ userRole, onEventCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: ''
  });
  const [creating, setCreating] = useState(false);

  const { execute: createEvent } = useApi(null, { immediate: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createEvent(API_ENDPOINTS.EVENTS.HIERARCHICAL, {
        method: 'POST',
        body: formData
      });
      
      onEventCreated();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0">
            <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
              Create New Event
            </h5>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Event Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter event name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter event description"
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Event Date *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Event location"
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onEventCreated()}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  style={{ backgroundColor: 'var(--primary-purple)', borderColor: 'var(--primary-purple)' }}
                >
                  {creating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
