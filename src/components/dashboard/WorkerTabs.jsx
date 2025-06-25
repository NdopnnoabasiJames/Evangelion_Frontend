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
  }, [activeTab]);  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading overview stats...');
      // Fetch worker statistics
      const response = await fetch(API_ENDPOINTS.WORKERS.STATS, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const stats = await response.json();
        console.log('Received stats:', stats);
        
        // Ensure stats has the expected structure
        const normalizedStats = {
          totalEvents: stats.totalEvents || stats.data?.totalEvents || 0,
          totalRegisteredGuests: stats.totalRegisteredGuests || stats.data?.totalRegisteredGuests || 0,
          totalCheckedInGuests: stats.totalCheckedInGuests || stats.data?.totalCheckedInGuests || 0
        };
        
        console.log('Normalized stats:', normalizedStats);
        setOverviewStats(normalizedStats);
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
      const response = await fetch(`${API_ENDPOINTS.WORKERS.ALL_EVENTS}`, {
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
      const response = await fetch(`${API_ENDPOINTS.WORKERS.MY_EVENTS}`, {
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
      console.log('Loading registered guests...');
      const response = await fetch(`${API_ENDPOINTS.WORKERS.MY_GUESTS}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('Guests response status:', response.status);
      
      if (response.ok) {
        const guests = await response.json();
        console.log('Received guests data:', guests);
        
        // Ensure we always set an array
        let guestsArray = [];
        if (Array.isArray(guests)) {
          guestsArray = guests;
        } else if (guests && Array.isArray(guests.data)) {
          guestsArray = guests.data;
        } else if (guests && guests.guests && Array.isArray(guests.guests)) {
          guestsArray = guests.guests;
        }
        
        console.log('Setting guests array:', guestsArray);
        setRegisteredGuests(guestsArray);
      } else {
        console.error('Failed to fetch guests, status:', response.status);
        setError(`Failed to load guests: ${response.status}`);
        setRegisteredGuests([]); // Ensure it's still an array
      }
    } catch (err) {
      console.error('Error loading registered guests:', err);
      setError('Failed to load registered guests');
      setRegisteredGuests([]); // Ensure it's still an array
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
        const result = await response.json();
        if (result?.message?.includes('approved')) {
          alert('Successfully volunteered! You can now register guests for this event.');
          loadMyEvents(); // Refresh My Events tab
        } else {
          alert('Volunteer request submitted! Waiting for branch admin approval.');
        }
        loadAllEvents(); // Refresh All Events to update button states
      } else {
        const error = await response.json();
        alert(`Failed to volunteer: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      alert('Failed to volunteer for event');
    }
  };

  // Helper function to get volunteer button state
  const getVolunteerButtonState = (event) => {
    if (!user || !event) return { text: 'Volunteer', disabled: false, variant: 'primary' };

    // Check if worker is already approved (in workers array)
    if (event.workers && event.workers.some(worker => 
      (typeof worker === 'object' ? worker._id : worker) === user._id
    )) {
      return { text: 'Volunteered', disabled: true, variant: 'success' };
    }

    // Check volunteer requests
    if (event.volunteerRequests && event.volunteerRequests.length > 0) {
      const userRequest = event.volunteerRequests.find(req => 
        (typeof req.workerId === 'object' ? req.workerId._id : req.workerId) === user._id
      );
      
      if (userRequest) {
        switch (userRequest.status) {
          case 'pending':
            return { text: 'Pending', disabled: true, variant: 'warning' };
          case 'approved':
            return { text: 'Volunteered', disabled: true, variant: 'success' };
          case 'rejected':
            return { text: 'Rejected', disabled: true, variant: 'danger' };
          default:
            return { text: 'Volunteer', disabled: false, variant: 'primary' };
        }
      }
    }

    return { text: 'Volunteer', disabled: false, variant: 'primary' };
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
      </div>      {/* Stats Cards */}
      <div className="row">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-primary mb-2">
                <i className="bi bi-calendar-event"></i>
              </div>
              <h3 className="mb-1">
                {console.log('Rendering totalEvents:', overviewStats.totalEvents) || overviewStats.totalEvents}
              </h3>
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
              <h3 className="mb-1">
                {console.log('Rendering totalRegisteredGuests:', overviewStats.totalRegisteredGuests) || overviewStats.totalRegisteredGuests}
              </h3>
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
              <h3 className="mb-1">
                {console.log('Rendering totalCheckedInGuests:', overviewStats.totalCheckedInGuests) || overviewStats.totalCheckedInGuests}
              </h3>
              <p className="text-muted mb-0">Total Checked-in Guests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );  // Helper function to format event location
  const formatEventLocation = (event) => {
    // Priority 1: selectedBranches (specific branch events)
    if (event.selectedBranches && event.selectedBranches.length > 0) {
      const branch = event.selectedBranches[0];
      if (branch.stateId && branch.stateId.name && branch.name) {
        return `${branch.stateId.name} State, ${branch.name} Branch`;
      }
      if (branch.name) {
        return `${branch.name} Branch`;
      }
    }
    
    // Priority 2: Check for event scope and handle accordingly
    if (event.scope === 'national') {
      return 'National Event';
    }
    
    if (event.scope === 'state' && event.availableStates && event.availableStates.length > 0) {
      const state = event.availableStates[0];
      return state.name ? `${state.name} State` : 'State Event';
    }
    
    // Priority 3: availableStates for other events
    if (event.availableStates && event.availableStates.length > 0) {
      if (event.availableStates.length === 1) {
        const state = event.availableStates[0];
        return state.name ? `${state.name} State` : 'State Event';
      }
      return 'Multi-State Event';
    }
    
    // Priority 4: Basic location field or fallback
    return event.location || 'Location TBD';
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
    const buttonState = getVolunteerButtonState(event);
    
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
                className={`btn btn-${buttonState.variant} btn-sm w-100`}
                onClick={() => !buttonState.disabled && handleVolunteerForEvent(event._id)}
                disabled={buttonState.disabled}
              >
                <i className={`bi ${buttonState.text === 'Volunteer' ? 'bi-hand-thumbs-up' : 
                  buttonState.text === 'Pending' ? 'bi-clock' : 
                  buttonState.text === 'Volunteered' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                {buttonState.text}
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
        <h5 className="mb-0">All Published Events</h5>
        <span className="badge bg-secondary">{allEvents.length} events</span>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : allEvents.length === 0 ? (
        <EmptyState message="No published events found" />
      ) : (
        <div className="row g-3">
          {allEvents.map(event => renderEventCard(event, true))}
        </div>
      )}
    </div>
  );

  const renderMyEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">My Approved Events</h5>
        <span className="badge bg-secondary">{myEvents.length} events</span>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : myEvents.length === 0 ? (
        <EmptyState message="No approved volunteer events. Volunteer for events in the All Events tab!" />
      ) : (
        <div className="row g-3">
          {myEvents.map(event => renderEventCard(event, false))}
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
      ) : !Array.isArray(registeredGuests) ? (
        <ErrorDisplay message="Error loading guests data" />
      ) : registeredGuests.length === 0 ? (
        <EmptyState message="No guests registered yet" />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">                  <tr>
                    <th scope="col">Guest Name</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Event</th>
                    <th scope="col">Comments</th>
                    <th scope="col">Event Date & Time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredGuests.map(guest => {
                    const eventLocation = guest.event ? formatEventLocation(guest.event) : 'No Event';
                    const eventDateTime = guest.event ? formatEventDateTime(guest.event) : { date: 'N/A', time: 'N/A' };
                    const registeredAt = guest.createdAt ? new Date(guest.createdAt) : null;
                    
                    return (
                      <tr key={guest._id}>
                        <td>
                          <div>
                            <div className="fw-semibold">{guest.name}</div>
                            <small className="text-muted">{guest.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{guest.phone}</div>
                          </div>
                        </td>                        <td>
                          <div>
                            <div className="fw-medium">{guest.event?.name || guest.event?.title || 'N/A'}</div>
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              {eventLocation}
                            </small>
                          </div>
                        </td>
                        <td className="text-muted">
                          {guest.comments || '-'}
                        </td>
                        <td>
                          <div>
                            <div>{eventDateTime.date}</div>
                            <small className="text-muted">{eventDateTime.time}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${guest.isCheckedIn ? 'bg-success' : 'bg-warning'}`}>
                            {guest.isCheckedIn ? 'Checked In' : 'Registered'}
                          </span>
                        </td>
                        <td>
                          <div>
                            {registeredAt ? (
                              <>
                                <div>{registeredAt.toLocaleDateString()}</div>
                                <small className="text-muted">{registeredAt.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</small>
                              </>
                            ) : (
                              <small className="text-muted">Unknown</small>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
const GuestRegistrationModal = ({ onClose, onSuccess }) => {  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
    comments: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Load worker's approved events for guest registration
    const loadEvents = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.WORKERS.MY_EVENTS, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const eventsData = await response.json();
          const eventsArray = Array.isArray(eventsData) ? eventsData : eventsData.data || [];
          console.log('Loading events for guest registration:', eventsArray);
          setEvents(eventsArray);
        } else {
          console.error('Failed to load events for guest registration:', response.status);
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
                >                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.name || event.title || 'Unnamed Event'} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Comments</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Optional comments..."
                ></textarea>
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
