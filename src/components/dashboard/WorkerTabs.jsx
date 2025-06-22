import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import workerService from '../../services/workerService';
import { API_ENDPOINTS } from '../../utils/constants';

const WorkerTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [registeredGuests, setRegisteredGuests] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalEvents: 0,
    totalRegisteredGuests: 0,
    totalCheckedInGuests: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadOverviewStats();
        break;
      case 'all-events':
        loadAllEvents();
        break;
      case 'my-events':
        loadMyEvents();
        break;
      case 'registered-guests':
        loadRegisteredGuests();
        break;
      default:
        break;
    }
  }, [activeTab]);
  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch worker statistics
      const response = await fetch(API_ENDPOINTS.WORKERS.STATS, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setOverviewStats(stats);
      } else {
        console.error('Failed to fetch worker stats, status:', response.status);
        setError(`Failed to load statistics: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading overview stats:', err);
      setError('Failed to load overview statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.EVENTS.BASE}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const events = await response.json();
        setAllEvents(Array.isArray(events) ? events : events.data || []);
      }
    } catch (err) {
      console.error('Error loading all events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadMyEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.BASE}/events/available`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const events = await response.json();
        setMyEvents(Array.isArray(events) ? events : events.data || []);
      }
    } catch (err) {
      console.error('Error loading my events:', err);
      setError('Failed to load branch events');
    } finally {
      setLoading(false);
    }
  };

  const loadRegisteredGuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.MY_GUESTS}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const guests = await response.json();
        setRegisteredGuests(Array.isArray(guests) ? guests : guests.data || []);
      }
    } catch (err) {
      console.error('Error loading registered guests:', err);
      setError('Failed to load registered guests');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerForEvent = async (eventId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.BASE}/events/${eventId}/volunteer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        alert('Successfully volunteered for event!');
        loadMyEvents(); // Refresh the events list
      } else {
        const error = await response.json();
        alert(`Failed to volunteer: ${error.message}`);
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      alert('Failed to volunteer for event');
    }
  };
  const renderOverviewTab = () => (
    <div>
      {/* Worker Information Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i className="bi bi-person-circle text-primary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Welcome, {user?.name || 'Worker'}</h5>
                  <div className="text-muted">
                    <i className="bi bi-geo-alt me-1"></i>
                    {user?.state?.name ? `${user.state.name} State` : 'State not assigned'}
                    {user?.branch?.name ? `, ${user.branch.name} Branch` : ''}
                    {!user?.state?.name && !user?.branch?.name && 'Location not assigned'}
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-envelope me-1"></i>
                    {user?.email || 'Email not available'}
                  </small>
                </div>
                <div className="text-end">
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Active Worker
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">
                <i className="bi bi-calendar-event"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalEvents}</h3>
              <p className="text-muted mb-0">Total Events Participated</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-2">
                <i className="bi bi-person-plus"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalRegisteredGuests}</h3>
              <p className="text-muted mb-0">Total Registered Guests</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-2">
                <i className="bi bi-check-circle"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalCheckedInGuests}</h3>
              <p className="text-muted mb-0">Total Checked-in Guests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );// Helper function to format event location
  const formatEventLocation = (event) => {
    // Check selectedBranches first
    if (event.selectedBranches && event.selectedBranches.length > 0) {
      const branch = event.selectedBranches[0];
      if (branch.stateId && branch.stateId.name && branch.name) {
        return `${branch.stateId.name} State, ${branch.name} Branch`;
      }
      if (branch.name) {
        return `${branch.name} Branch`;
      }
    }
    
    // Check availableStates for national events
    if (event.scope === 'national' && event.availableStates && event.availableStates.length > 0) {
      if (event.availableStates.length === 1 && event.availableStates[0].name) {
        return `${event.availableStates[0].name} State`;
      }
      return 'Multiple States';
    }
    
    // Fallback to basic location or description
    return event.location || event.description || 'National Event';
  };

  // Helper function to format date and time
  const formatEventDateTime = (event) => {
    if (event.date) {
      const eventDate = new Date(event.date);
      const date = eventDate.toLocaleDateString();
      const time = eventDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return { date, time };
    }
    
    // Fallback if no date
    return { 
      date: 'Date TBD', 
      time: 'Time TBD' 
    };
  };

  const renderEventCard = (event, showVolunteerButton = false) => {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
    
    return (
      <div key={event._id} className="col-12 col-md-6 col-lg-4">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                <i className="bi bi-calendar-event text-primary"></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1 fw-semibold">{event.name || event.title}</h6>
                <small className="text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  {location}
                </small>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="row g-2 text-sm">
                <div className="col-6">
                  <strong>Date:</strong>
                  <div className="text-muted">{date}</div>
                </div>
                <div className="col-6">
                  <strong>Time:</strong>
                  <div className="text-muted">{time}</div>
                </div>
                <div className="col-12">
                  <strong>Description:</strong>
                  <div className="text-muted small">{event.description || 'No description available'}</div>
                </div>
              </div>
            </div>

            {showVolunteerButton && (
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={() => handleVolunteerForEvent(event._id)}
              >
                <i className="bi bi-hand-thumbs-up me-1"></i>
                Volunteer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAllEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">All Events in System</h5>
        <span className="badge bg-secondary">{allEvents.length} events</span>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : allEvents.length === 0 ? (
        <EmptyState message="No events found" />
      ) : (
        <div className="row g-3">
          {allEvents.map(event => renderEventCard(event, false))}
        </div>
      )}
    </div>
  );

  const renderMyEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Events in My Branch</h5>
        <span className="badge bg-secondary">{myEvents.length} events</span>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : myEvents.length === 0 ? (
        <EmptyState message="No events available in your branch" />
      ) : (
        <div className="row g-3">
          {myEvents.map(event => renderEventCard(event, true))}
        </div>
      )}
    </div>
  );

  const renderRegisteredGuestsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">My Registered Guests</h5>
        <button
          className="btn btn-primary"
          onClick={() => setShowGuestModal(true)}
        >
          <i className="bi bi-person-plus me-2"></i>
          Register New Guest
        </button>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : registeredGuests.length === 0 ? (
        <EmptyState message="No guests registered yet" />
      ) : (        <div className="row g-3">
          {registeredGuests.map(guest => {
            const eventLocation = guest.event ? formatEventLocation(guest.event) : 'No Event';
            const eventDateTime = guest.event ? formatEventDateTime(guest.event) : { date: 'N/A', time: 'N/A' };
            
            return (
              <div key={guest._id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3">
                        <i className="bi bi-person text-success"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-semibold">{guest.name}</h6>
                        <small className="text-muted">{guest.email}</small>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="row g-2 text-sm">
                        <div className="col-6">
                          <strong>Phone:</strong>
                          <div className="text-muted">{guest.phone}</div>
                        </div>
                        <div className="col-6">
                          <strong>Status:</strong>
                          <div className="text-muted">
                            <span className={`badge ${guest.isCheckedIn ? 'bg-success' : 'bg-warning'}`}>
                              {guest.isCheckedIn ? 'Checked In' : 'Registered'}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <strong>Event:</strong>
                          <div className="text-muted">{guest.event?.name || guest.event?.title || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <strong>Date:</strong>
                          <div className="text-muted small">{eventDateTime.date}</div>
                        </div>
                        <div className="col-6">
                          <strong>Time:</strong>
                          <div className="text-muted small">{eventDateTime.time}</div>
                        </div>
                        <div className="col-12">
                          <strong>Location:</strong>
                          <div className="text-muted small">
                            <i className="bi bi-geo-alt me-1"></i>
                            {eventLocation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid">
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-speedometer2 me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-events')}
          >
            <i className="bi bi-calendar3 me-2"></i>
            All Events
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'my-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-events')}
          >
            <i className="bi bi-calendar-check me-2"></i>
            My Events
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'registered-guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('registered-guests')}
          >
            <i className="bi bi-people me-2"></i>
            Registered Guests
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'all-events' && renderAllEventsTab()}
        {activeTab === 'my-events' && renderMyEventsTab()}
        {activeTab === 'registered-guests' && renderRegisteredGuestsTab()}
      </div>

      {/* Guest Registration Modal */}
      {showGuestModal && (
        <GuestRegistrationModal
          onClose={() => setShowGuestModal(false)}
          onSuccess={() => {
            setShowGuestModal(false);
            loadRegisteredGuests();
          }}
        />
      )}
    </div>
  );
};

// Guest Registration Modal Component
const GuestRegistrationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load available events for guest registration
    const loadEvents = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.WORKERS.BASE}/events/available`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const eventsData = await response.json();
          setEvents(Array.isArray(eventsData) ? eventsData : eventsData.data || []);
        }
      } catch (err) {
        console.error('Error loading events:', err);
      }
    };

    loadEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.WORKERS.BASE}/events/register-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Guest registered successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Failed to register guest: ${error.message}`);
      }
    } catch (err) {
      console.error('Error registering guest:', err);
      alert('Failed to register guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Register New Guest</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Event *</label>
                <select
                  className="form-select"
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkerTabs;
