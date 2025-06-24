import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';

const RegistrarTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [eventGuests, setEventGuests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [overviewStats, setOverviewStats] = useState({
    totalEventsVolunteered: 0,
    totalGuestsCheckedIn: 0,
    totalApprovedEvents: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      default:
        break;
    }
  }, [activeTab]);

  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTRARS.STATS, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        const normalizedStats = {
          totalEventsVolunteered: stats.totalEventsVolunteered || stats.data?.totalEventsVolunteered || 0,
          totalGuestsCheckedIn: stats.totalGuestsCheckedIn || stats.data?.totalGuestsCheckedIn || 0,
          totalApprovedEvents: stats.totalApprovedEvents || stats.data?.totalApprovedEvents || 0
        };
        setOverviewStats(normalizedStats);
      } else {
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
      const response = await fetch(API_ENDPOINTS.REGISTRARS.ALL_EVENTS, {
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
      const response = await fetch(API_ENDPOINTS.REGISTRARS.MY_EVENTS, {
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
      setError('Failed to load my events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventGuests = async (eventId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.REGISTRARS.BASE}/events/${eventId}/guests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const guests = await response.json();
        setEventGuests(Array.isArray(guests) ? guests : guests.data || []);
      }
    } catch (err) {
      console.error('Error loading event guests:', err);
      setError('Failed to load event guests');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerForEvent = async (eventId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.REGISTRARS.BASE}/events/${eventId}/volunteer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        alert('Successfully volunteered for event!');
        loadAllEvents(); // Refresh the events list
      } else {
        const error = await response.json();
        alert(`Failed to volunteer: ${error.message}`);
      }
    } catch (err) {
      console.error('Error volunteering for event:', err);
      alert('Error volunteering for event');
    }
  };

  const handleCheckInGuest = async (guestId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.REGISTRARS.BASE}/guests/${guestId}/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        // Refresh the guest list
        loadEventGuests(selectedEvent._id);
        // Refresh stats
        loadOverviewStats();
      } else {
        const error = await response.json();
        alert(`Failed to check in guest: ${error.message}`);
      }
    } catch (err) {
      console.error('Error checking in guest:', err);
      alert('Error checking in guest');
    }
  };

  const handleViewGuests = (event) => {
    setSelectedEvent(event);
    setActiveTab('event-guests');
    loadEventGuests(event._id);
  };

  // Helper function to get volunteer button state
  const getVolunteerButtonState = (event) => {
    if (!user || !event) return { text: 'Volunteer', disabled: false, variant: 'primary' };

    // Check if registrar is already approved (in registrars array)
    if (event.registrars && event.registrars.some(registrar => 
      (typeof registrar === 'object' ? registrar._id : registrar) === user._id
    )) {
      return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
    }

    // Check volunteer requests
    if (event.registrarRequests && event.registrarRequests.length > 0) {
      const userRequest = event.registrarRequests.find(req => 
        (typeof req.registrarId === 'object' ? req.registrarId._id : req.registrarId) === user._id
      );
      
      if (userRequest) {
        switch (userRequest.status) {
          case 'pending':
            return { text: 'Pending', disabled: true, variant: 'warning' };
          case 'approved':
            return { text: 'View Guests', disabled: false, variant: 'success', action: 'viewGuests' };
          case 'rejected':
            return { text: 'Rejected', disabled: true, variant: 'danger' };
          default:
            return { text: 'Volunteer', disabled: false, variant: 'primary' };
        }
      }
    }

    return { text: 'Volunteer', disabled: false, variant: 'primary' };
  };

  // Helper function to format event location
  const formatEventLocation = (event) => {
    if (event.selectedBranches && event.selectedBranches.length > 0) {
      const branch = event.selectedBranches[0];
      if (branch.stateId && branch.stateId.name && branch.name) {
        return `${branch.stateId.name} State, ${branch.name} Branch`;
      }
      if (branch.name) {
        return `${branch.name} Branch`;
      }
    }
    
    if (event.scope === 'national') {
      return 'National Event';
    }
    
    if (event.scope === 'state' && event.availableStates && event.availableStates.length > 0) {
      const state = event.availableStates[0];
      return state.name ? `${state.name} State` : 'State Event';
    }
    
    if (event.availableStates && event.availableStates.length > 0) {
      if (event.availableStates.length === 1) {
        const state = event.availableStates[0];
        return state.name ? `${state.name} State` : 'State Event';
      }
      return 'Multi-State Event';
    }
    
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
    
    return { date: 'Date TBD', time: 'Time TBD' };
  };

  // Filter guests based on search term
  const filteredGuests = eventGuests.filter(guest => 
    guest.phone?.includes(searchTerm) || 
    guest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverviewTab = () => (
    <div>
      {/* Registrar Information Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i className="bi bi-person-check text-primary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Welcome, {user?.name || 'Registrar'}</h5>
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
                  <span className="badge bg-info">
                    <i className="bi bi-clipboard-check me-1"></i>
                    Active Registrar
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
                <i className="bi bi-calendar-heart"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalEventsVolunteered}</h3>
              <p className="text-muted mb-0">Total Events Volunteered</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-success mb-2">
                <i className="bi bi-check-circle"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalGuestsCheckedIn}</h3>
              <p className="text-muted mb-0">Total Guests Checked In</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="display-6 text-info mb-2">
                <i className="bi bi-calendar-check"></i>
              </div>
              <h3 className="mb-1">{overviewStats.totalApprovedEvents}</h3>
              <p className="text-muted mb-0">Approved Events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventCard = (event, showViewGuestsButton = false) => {
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

            <button
              className={`btn btn-${buttonState.variant} btn-sm w-100`}
              onClick={() => {
                if (buttonState.action === 'viewGuests') {
                  handleViewGuests(event);
                } else {
                  handleVolunteerForEvent(event._id);
                }
              }}
              disabled={buttonState.disabled}
            >
              {buttonState.action === 'viewGuests' ? (
                <><i className="bi bi-people me-1"></i>{buttonState.text}</>
              ) : (
                <><i className="bi bi-hand-thumbs-up me-1"></i>{buttonState.text}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAllEventsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">All Published Events</h5>
        <small className="text-muted">Volunteer for events you want to help with registration</small>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : allEvents.length === 0 ? (
        <EmptyState message="No published events available" />
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
        <h5 className="mb-0">My Approved Events</h5>
        <small className="text-muted">Events where you can check in guests</small>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : myEvents.length === 0 ? (
        <EmptyState message="No approved events yet" />
      ) : (
        <div className="row g-3">
          {myEvents.map(event => renderEventCard(event, true))}
        </div>
      )}
    </div>
  );

  const renderEventGuestsTab = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            <button 
              className="btn btn-link p-0 me-2"
              onClick={() => setActiveTab('my-events')}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            Guest Check-In: {selectedEvent?.name || 'Event'}
          </h5>
          <small className="text-muted">
            <i className="bi bi-geo-alt me-1"></i>
            {selectedEvent ? formatEventLocation(selectedEvent) : 'Location'}
          </small>
        </div>
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by phone, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : filteredGuests.length === 0 ? (
        searchTerm ? (
          <EmptyState message={`No guests found matching "${searchTerm}"`} />
        ) : (
          <EmptyState message="No guests registered for this event" />
        )
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Guest Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                    <th scope="col">Check-In Time</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map(guest => (
                    <tr key={guest._id}>
                      <td>
                        <div className="fw-semibold">{guest.name}</div>
                      </td>
                      <td>{guest.phone}</td>
                      <td>{guest.email}</td>
                      <td>
                        <span className={`badge ${guest.checkedIn ? 'bg-success' : 'bg-warning'}`}>
                          {guest.checkedIn ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                      <td>
                        {guest.checkedInTime ? (
                          <div>
                            <div>{new Date(guest.checkedInTime).toLocaleDateString()}</div>
                            <small className="text-muted">
                              {new Date(guest.checkedInTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </small>
                          </div>
                        ) : (
                          <small className="text-muted">Not checked in</small>
                        )}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${guest.checkedIn ? 'btn-success' : 'btn-primary'}`}
                          onClick={() => handleCheckInGuest(guest._id)}
                          disabled={guest.checkedIn}
                        >
                          {guest.checkedIn ? (
                            <><i className="bi bi-check-circle me-1"></i>Checked In</>
                          ) : (
                            <><i className="bi bi-check2 me-1"></i>Check In</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
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
        {activeTab === 'event-guests' && (
          <li className="nav-item">
            <button className="nav-link active">
              <i className="bi bi-people me-2"></i>
              Event Guests
            </button>
          </li>
        )}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'all-events' && renderAllEventsTab()}
        {activeTab === 'my-events' && renderMyEventsTab()}
        {activeTab === 'event-guests' && renderEventGuestsTab()}
      </div>
    </div>
  );
};

export default RegistrarTabs;
