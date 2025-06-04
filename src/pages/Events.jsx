import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import Loading from '../components/common/Loading';
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
        <Loading text="Loading events..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0" style={{ color: 'var(--primary-purple)' }}>
              Events Management
            </h1>
            <p className="text-muted mb-0">Manage church events and activities</p>
          </div>
          
          {canCreateEvents && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('create')}
              style={{ backgroundColor: 'var(--primary-purple)', borderColor: 'var(--primary-purple)' }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Event
            </button>
          )}
        </div>

        {/* Tabs Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
              style={activeTab === 'list' ? {
                backgroundColor: 'var(--primary-purple)',
                borderColor: 'var(--primary-purple)',
                color: 'white'
              } : {}}
            >
              <i className="bi bi-list-ul me-2"></i>
              Events List
            </button>
          </li>
          
          {canCreateEvents && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
                style={activeTab === 'create' ? {
                  backgroundColor: 'var(--primary-purple)',
                  borderColor: 'var(--primary-purple)',
                  color: 'white'
                } : {}}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Event
              </button>
            </li>
          )}
        </ul>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <EventsList 
            events={events}
            loading={loading}
            error={error}
            canEdit={canEditEvents}
            onRefresh={refetch}
          />
        )}

        {activeTab === 'create' && canCreateEvents && (
          <CreateEvent 
            userRole={user?.role}
            onEventCreated={() => {
              setActiveTab('list');
              refetch();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// Events List Component
const EventsList = ({ events, loading, error, canEdit, onRefresh }) => {
  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Error loading events: {error}
        <button className="btn btn-outline-danger btn-sm ms-3" onClick={onRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-calendar-event" style={{ fontSize: '4rem', color: 'var(--primary-purple)', opacity: 0.5 }}></i>
        <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>No Events Found</h4>
        <p className="text-muted">There are no events available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {events.map((event) => (
        <div key={event._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-start">
                <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                  {event.name}
                </h5>
                <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                  {event.status}
                </span>
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
                <small className="text-muted">{event.location || 'Location TBD'}</small>
              </div>
              
              {event.description && (
                <p className="card-text text-muted small mb-3">
                  {event.description.substring(0, 100)}
                  {event.description.length > 100 && '...'}
                </p>
              )}
              
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  {event.participantCount || 0} participants
                </small>
                
                {canEdit && (
                  <button className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-pencil"></i>
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

// Helper function for status badge styling
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-success';
    case 'upcoming':
      return 'bg-primary';
    case 'completed':
      return 'bg-secondary';
    case 'cancelled':
      return 'bg-danger';
    default:
      return 'bg-warning';
  }
};

export default Events;
