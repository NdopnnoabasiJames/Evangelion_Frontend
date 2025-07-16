import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { DataListState, LoadingCard, ErrorDisplay, EmptyState } from '../components/common/Loading';
import { StatisticsGrid, StatisticsCardTypes } from '../components/common/StatisticsCard';
import { TabbedInterface, TabPane, TabConfigurations } from '../components/common/TabNavigation';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { API_ENDPOINTS } from '../utils/constants';
import GuestRegistrationForm from '../components/guests/GuestRegistrationForm';
import { fetchGuestsHelper, fetchPickupStationsHelper, handleQuickSearchHelper, getStatusBadge } from '../helpers/guests.helpers.jsx';

const Guests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState({});
  const [pickupStations, setPickupStations] = useState([]);
  const [loadingPickupStations, setLoadingPickupStations] = useState(false);
  // Form state for guest registration
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    transportPreference: 'private',
    pickupStation: '',
    notes: '',
    comments: '',
    isNewConvert: false
  });

  // Fetch events for dropdowns
  const { data: eventsData, loading: eventsLoading } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  // Fetch guests based on role and permissions
  const fetchGuests = async () => {
    await fetchGuestsHelper({
      user,
      selectedEvent,
      setLoading,
      setGuests,
      setStatistics,
      setError,
      API_ENDPOINTS
    });
  };

  // Fetch pickup stations for the worker's branch
  const fetchPickupStations = async () => {
    await fetchPickupStationsHelper({
      user,
      setLoadingPickupStations,
      setPickupStations,
      API_ENDPOINTS
    });
  };

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]._id);
      }
    }
  }, [eventsData]);

  useEffect(() => {
    if (selectedEvent) {
      fetchGuests();
    }
  }, [selectedEvent, user]);

  // Fetch pickup stations when user's branch is available
  useEffect(() => {
    if (user?.branch?._id) {
      fetchPickupStations();
    }
  }, [user]);

  // Role-based permissions
  const canRegisterGuests = ['WORKER'].includes(user?.role);
  const canManageGuests = ['SUPER_ADMIN', 'SUPER_ME', 'STATE_ADMIN', 'BRANCH_ADMIN', 'BRANCH_ME', 'ZONAL_ADMIN'].includes(user?.role);
  const canSearchAdvanced = ['SUPER_ADMIN', 'STATE_ADMIN', 'BRANCH_ADMIN', 'ZONAL_ADMIN'].includes(user?.role);

  const handleGuestRegistration = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      alert('Please select an event');
      return;
    }

    // Validate pickup station when church bus is selected
    if (guestForm.transportPreference === 'church_bus' && !guestForm.pickupStation) {
      alert('Please select a pickup station for church bus transport');
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = user?.role === 'WORKER' 
        ? `${API_ENDPOINTS.WORKERS.REGISTER_GUEST}/${selectedEvent}/guests`
        : `${API_ENDPOINTS.GUESTS.BASE}/${selectedEvent}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(guestForm)
      });

      if (response.ok) {        // Reset form
        setGuestForm({
          name: '',
          email: '',
          phone: '',
          transportPreference: 'private',
          pickupStation: '',
          notes: '',
          comments: '',
          isNewConvert: false
        });
        
        // Refresh guest list
        await fetchGuests();
        
        // Switch to list view
        setActiveTab('list');
        
        alert('Guest registered successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to register guest: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error registering guest: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = async () => {
    await handleQuickSearchHelper({
      searchTerm,
      canSearchAdvanced,
      fetchGuests,
      setLoading,
      setGuests,
      setError,
      API_ENDPOINTS
    });
  };

  if (loading && !guests.length) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0" style={{ color: 'var(--primary-purple)' }}>
                Guests Management
              </h1>
              <p className="text-muted mb-0">Manage guest registrations and information</p>
            </div>
          </div>
          <div className="row g-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-12">
                <LoadingCard height="200px" />
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
            message={error}
            onRetry={() => fetchGuests()}
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
          {...HeaderConfigurations.guestManagement(
            user?.role, 
            fetchGuests, 
            () => {/* Export functionality */}
          )}
        />

        {/* Statistics Cards (for admins) */}
        {canManageGuests && Object.keys(statistics).length > 0 && (
          <div className="mb-4">
            <StatisticsGrid 
              cards={[
                StatisticsCardTypes.totalGuests(statistics.totalGuests || 0),
                StatisticsCardTypes.checkedIn(statistics.checkedInGuests || 0),
                StatisticsCardTypes.busTransport(statistics.busGuests || 0),
                {
                  ...StatisticsCardTypes.checkInRate(
                    statistics.totalGuests 
                      ? Math.round((statistics.checkedInGuests / statistics.totalGuests) * 100) 
                      : 0
                  ),
                  background: 'linear-gradient(135deg, #17a2b8, #6f42c1)'
                }
              ]}
              columns={4}
            />
          </div>
        )}

        {/* Event Selection and Search */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4">
                <label className="form-label">Select Event</label>
                <select 
                  className="form-select"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.name} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Search Guests</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
                  />
                  <button 
                    className="btn btn-outline-primary"
                    onClick={handleQuickSearch}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex gap-2">
                  {canRegisterGuests && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab('register')}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      Register Guest
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary"
                    onClick={fetchGuests}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Tab Navigation */}
        <TabbedInterface
          activeTab={activeTab}
          onTabChange={setActiveTab}
          configuration="guestManagement"
          rolePermissions={{
            canRegisterGuests,
            canManageGuests
          }}
        >
          <TabPane tabId="list" title="Guest List">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Guests List</h5>
              </div>
              <div className="card-body p-0">
                {error && (
                  <div className="alert alert-danger m-3">
                    {error}
                  </div>
                )}
                
                {loading ? (
                  <DataListState
                    loading={true}
                    data={[]}
                    emptyMessage="No guests found"
                    emptyIcon="bi-people"
                    renderItem={() => null}
                  />
                ) : (
                  <DataListState
                    loading={false}
                    data={guests}
                    emptyMessage={selectedEvent ? 'No guests registered for this event' : 'Start by selecting an event'}
                    emptyIcon="bi-people"
                    renderItem={() => (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">                            <tr>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>Transport</th>
                              <th>New Convert</th>
                              <th>Status</th>
                              <th>Registered By</th>
                              <th>Comments</th>
                              <th>Check-in Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guests.map(guest => (
                              <tr key={guest._id}>
                                <td>
                                  <div className="fw-medium">{guest.name}</div>
                                </td>
                                <td>{guest.phone}</td>
                                <td className="text-muted">{guest.email || '-'}</td>
                                <td>
                                  <div>
                                    <span className={`badge ${guest.transportPreference === 'church_bus' ? 'bg-info' : 'bg-secondary'}`}>
                                      {guest.transportPreference === 'church_bus' ? 'Church Bus' : 'Private'}
                                    </span>
                                    {guest.transportPreference === 'church_bus' && guest.pickupStation && (
                                      <div className="small text-muted mt-1">
                                        📍 {guest.pickupStation.location}
                                        {guest.pickupStation.departureTime && (
                                          <span className="ms-1">({guest.pickupStation.departureTime})</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${guest.isNewConvert ? 'bg-success' : 'bg-light text-dark'}`}>
                                    {guest.isNewConvert ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td>{getStatusBadge(guest.status)}</td>                                <td className="text-muted">
                                  {guest.registeredBy?.name || 'Unknown'}
                                </td>
                                <td className="text-muted">
                                  {guest.comments || '-'}
                                </td>
                                <td className="text-muted">
                                  {guest.checkedInTime 
                                    ? new Date(guest.checkedInTime).toLocaleString()
                                    : '-'
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  />
                )}
              </div>
            </div>
          </TabPane>

          {canRegisterGuests && (
            <TabPane tabId="register" title="Register Guest">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Register New Guest</h5>
                </div>
                <div className="card-body">
                  <GuestRegistrationForm
                    guestForm={guestForm}
                    setGuestForm={setGuestForm}
                    handleGuestRegistration={handleGuestRegistration}
                    loading={loading}
                    loadingPickupStations={loadingPickupStations}
                    pickupStations={pickupStations}
                    setActiveTab={setActiveTab}
                  />
                </div>
              </div>
            </TabPane>
          )}

          {canManageGuests && (
            <TabPane tabId="analytics" title="Analytics">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Guest Analytics</h5>
                </div>
                <div className="card-body">
                  <div className="text-center py-5">
                    <i className="bi bi-graph-up fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">Analytics Dashboard</h5>
                    <p className="text-muted">
                      Detailed analytics and reporting will be implemented in Phase 5
                    </p>
                  </div>
                </div>
              </div>
            </TabPane>
          )}        </TabbedInterface>
      </div>
    </Layout>
  );
};

export default Guests;
