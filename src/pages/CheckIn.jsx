import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { LoadingCard, ErrorDisplay, EmptyState } from '../components/common/Loading';
import { TabbedInterface, TabPane, TabConfigurations } from '../components/common/TabNavigation';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { StatisticsGrid, StatisticsCardTypes } from '../components/common/StatisticsCard';
import { API_ENDPOINTS, STATUS } from '../utils/constants';

const CheckIn = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [checkInStats, setCheckInStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch events for dropdowns
  const { data: eventsData } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]._id);
      }
    }
  }, [eventsData]);

  // Fetch check-in statistics when event changes
  useEffect(() => {
    if (selectedEvent) {
      fetchCheckInStats();
    }
  }, [selectedEvent]);

  const fetchCheckInStats = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.REGISTRARS.STATISTICS}/${selectedEvent}/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckInStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch check-in statistics:', err);
    }
  };

  const handleGuestSearch = async () => {
    if (!searchTerm.trim() || !selectedEvent) {
      setError('Please enter a search term and select an event');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.REGISTRARS.SEARCH_GUESTS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          searchTerm: searchTerm
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.guests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Search failed');
      }
    } catch (err) {
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (guestId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      const response = await fetch(API_ENDPOINTS.REGISTRARS.CHECK_IN_GUEST, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestId: guestId,
          eventId: selectedEvent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message || 'Guest checked in successfully');
        
        // Refresh search results and statistics
        await handleGuestSearch();
        await fetchCheckInStats();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Check-in failed');
      }
    } catch (err) {
      setError('Check-in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (guest) => {
    if (guest.checkedIn) {
      return <span className="badge bg-success">Checked In</span>;
    }
    return <span className="badge bg-warning">Not Checked In</span>;
  };

  // Only registrars should access this page
  if (user?.role !== 'REGISTRAR') {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="alert alert-warning">
            <h4>Access Denied</h4>
            <p>This page is only available for Registrars.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-4">        {/* Header */}
        <PageHeader 
          {...HeaderConfigurations.checkInSystem(fetchCheckInStats)}
        />

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Event Selection */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">Select Event</label>
                <select 
                  className="form-select"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.name} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={fetchCheckInStats}
                    disabled={!selectedEvent}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Stats
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Check-in Statistics */}
        {selectedEvent && Object.keys(checkInStats).length > 0 && (
          <StatisticsGrid
            cards={[
              StatisticsCardTypes.totalGuests(checkInStats.totalGuests || 0),
              StatisticsCardTypes.checkedInGuests(checkInStats.checkedInGuests || 0),
              StatisticsCardTypes.checkInRate(checkInStats.checkInRate || 0),
              StatisticsCardTypes.notCheckedIn(checkInStats.notCheckedIn || 0)
            ]}
            columns={4}
          />
        )}        {/* Tab Navigation */}
        <TabbedInterface
          tabs={TabConfigurations.checkInSystem()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <TabPane isActive={activeTab === 'search'}>
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Search Guests</h5>
              </div>
              <div className="card-body">
                {/* Search Form */}
                <div className="row mb-4">
                  <div className="col-md-8">
                    <label className="form-label">Search by Name or Phone</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter guest name or phone number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGuestSearch()}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={handleGuestSearch}
                        disabled={loading || !selectedEvent}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        ) : (
                          <i className="bi bi-search me-2"></i>
                        )}
                        Search
                      </button>
                    </div>
                    {!selectedEvent && (
                      <small className="text-muted">Please select an event first</small>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div>
                    <h6 className="mb-3">Search Results ({searchResults.length} found)</h6>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Transport</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map(guest => (
                            <tr key={guest.id}>
                              <td>
                                <div className="fw-medium">{guest.name}</div>
                              </td>
                              <td>{guest.phone}</td>
                              <td className="text-muted">{guest.email || '-'}</td>
                              <td>
                                <span className={`badge ${guest.transportPreference === 'bus' ? 'bg-info' : 'bg-secondary'}`}>
                                  {guest.transportPreference}
                                </span>
                              </td>
                              <td>{getStatusBadge(guest)}</td>
                              <td>
                                {!guest.checkedIn ? (
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleCheckIn(guest.id)}
                                    disabled={loading}
                                  >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Check In
                                  </button>
                                ) : (
                                  <span className="text-success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Checked in at {new Date(guest.checkedInTime).toLocaleTimeString()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && !loading && (
                  <div className="text-center py-4">
                    <i className="bi bi-search fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">No guests found</h5>
                    <p className="text-muted">
                      No guests match your search criteria. Try a different name or phone number.
                    </p>
                  </div>
                )}

                {!searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <i className="bi bi-search fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">Search for Guests</h5>
                    <p className="text-muted">
                      Enter a guest's name or phone number to search and check them in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabPane>

          <TabPane isActive={activeTab === 'stats'}>
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Check-in Statistics</h5>
              </div>
              <div className="card-body">
                {selectedEvent ? (
                  <div>
                    <h6 className="mb-3">Statistics for Selected Event</h6>
                    {Object.keys(checkInStats).length > 0 ? (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="list-group">
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                              Total Guests Registered
                              <span className="badge bg-primary rounded-pill">{checkInStats.totalGuests || 0}</span>
                            </div>
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                              Guests Checked In
                              <span className="badge bg-success rounded-pill">{checkInStats.checkedInGuests || 0}</span>
                            </div>
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                              Guests Not Checked In
                              <span className="badge bg-warning rounded-pill">{checkInStats.notCheckedIn || 0}</span>
                            </div>
                            <div className="list-group-item d-flex justify-content-between align-items-center">
                              Bus Passengers
                              <span className="badge bg-info rounded-pill">{checkInStats.busGuests || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="text-center">
                            <div className="mb-3">
                              <h2 style={{ color: 'var(--primary-purple)' }}>{checkInStats.checkInRate || 0}%</h2>
                              <p className="text-muted">Check-in Rate</p>
                            </div>
                            <div className="progress" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ 
                                  width: `${checkInStats.checkInRate || 0}%`,
                                  background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-yellow))'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading statistics...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-graph-up fs-1 text-muted mb-3"></i>
                    <h5 className="text-muted">Select an Event</h5>
                    <p className="text-muted">
                      Please select an event to view check-in statistics.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabPane>
        </TabbedInterface>
      </div>
    </Layout>
  );
};

export default CheckIn;
