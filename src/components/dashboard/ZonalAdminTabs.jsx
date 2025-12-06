import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay } from '../common/Loading';
import analyticsService from '../../services/analyticsService';
import dashboardStatsService from '../../services/dashboardStatsService';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { StatusBadge } from '../../utils/statusUtils';
import PickupStationManagement from '../events/PickupStationManagement';
import PickupStationAssignmentModal from '../events/PickupStationAssignmentModal';

const ZonalAdminTabs = ({ dashboardData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedEventForAssignment, setSelectedEventForAssignment] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  
  // Event filtering states
  const [eventFilter, setEventFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get the appropriate event date for comparison/sorting
  const getEventEndDate = (event) => {
    if (event.eventType === 'multi-day') {
      return event.endDate || event.startDate || event.date;
    } else if (event.eventType === 'multi-day-specific') {
      // For specific dates, use the latest date in the specificDates array
      if (event.specificDates && event.specificDates.length > 0) {
        const dates = event.specificDates.map(date => new Date(date));
        return Math.max(...dates);
      }
      return event.date; // fallback
    }
    return event.date;
  };
  // Debug log for tab changes
  useEffect(() => {
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoneStats, setZoneStats] = useState(null);

  // Fetch events accessible to this zonal admin
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useApi(
    API_ENDPOINTS.EVENTS.ACCESSIBLE, 
    { immediate: true }
  );

  useEffect(() => {
    if (activeTab === 'overview') {
      loadZoneStatistics();
    }
  }, [activeTab]);

  // Load initial statistics when component mounts
  useEffect(() => {
    loadZoneStatistics();
  }, []);  const loadZoneStatistics = async () => {
    setLoading(true);
    setError(null);
    try {      
      // Call the real dashboard stats service for zonal admin
      const dashboardStats = await dashboardStatsService.getDashboardStatsByRole('zonal_admin');
      const zoneData = {
        totalRegistrars: dashboardStats.totalRegistrars || 0,
        activeEvents: dashboardStats.activeEvents || 0,
        totalGuests: dashboardStats.totalGuests || 0,
        recentCheckIns: dashboardStats.recentCheckIns || 0,
        totalPickupStations: dashboardStats.totalPickupStations || 0,
        zoneName: user?.zone?.name || 'Your Zone',
        branchName: user?.branch?.name || 'Your Branch',
        stateName: user?.state?.name || 'Your State',
        // Add assignment info
        hasZoneAssignment: !!user?.zone,
        zoneId: user?.zone?._id,
        assignedZonesCount: user?.assignedZones?.length || 0
      };      
      setZoneStats(zoneData);
      
      if (zoneData.totalRegistrars === 0) {
        console.info('ZonalAdminTabs: No registrars assigned to zone:', zoneData.zoneName);
      }
    } catch (err) {
      console.error('Error loading zone statistics:', err);
      setError(err.message || 'Failed to load zone statistics');
      
      // Fallback to empty stats on error
      setZoneStats({
        totalRegistrars: 0,
        activeEvents: 0,
        totalGuests: 0,
        recentCheckIns: 0,
        totalPickupStations: 0,
        zoneName: user?.zone?.name || 'Your Zone',
        branchName: user?.branch?.name || 'Your Branch',
        stateName: user?.state?.name || 'Your State',
        hasZoneAssignment: !!user?.zone,
        zoneId: user?.zone?._id,
        assignedZonesCount: user?.assignedZones?.length || 0
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="row g-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <LoadingCard height="120px" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay 
          message={error}
        />
      );
    }

    return (
      <div>
        {/* Zone Information Header */}
        <div className="row mb-4 mt-5 mt-md-0">
          <div className="col-12">
            <div className="card bg-primary bg-gradient text-white">
              <div className="card-body">                <h5 className="card-title mb-1">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  Zone Administration
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <small className="opacity-75">Zone:</small>
                    <div className="fw-bold">{zoneStats?.zoneName}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="opacity-75">Branch:</small>
                    <div className="fw-bold">{zoneStats?.branchName}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="opacity-75">State:</small>
                    <div className="fw-bold">{zoneStats?.stateName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-success bg-opacity-10 text-success p-3 rounded">
                      <i className="bi bi-calendar-event-fill fs-3"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Active Events</h6>
                    <h3 className="mb-0">{zoneStats?.activeEvents || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded">
                      <i className="bi bi-bus-front-fill fs-3"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="text-muted mb-1">Total Pickup Stations</h6>
                    <h3 className="mb-0">{zoneStats?.totalPickupStations || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">              <div className="card-header">
                <h6 className="mb-0">
                  <i className="bi bi-lightning-fill me-2"></i>
                  Quick Actions
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <button 
                      className="btn btn-outline-primary w-100"
                      onClick={() => setActiveTab('pickup-stations')}
                    >
                      <i className="bi bi-bus-front me-2"></i>
                      Manage Pickup Stations
                    </button>
                  </div>
                  <div className="col-md-6">
                    <button 
                      className="btn btn-outline-info w-100"
                      onClick={() => setActiveTab('events')}
                    >
                      <i className="bi bi-calendar-event me-2"></i>
                      Manage Events
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };  // Helper function to check if event is active/expired
  const isEventActive = (event) => {
    const eventDate = new Date(getEventEndDate(event));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return eventDate >= today;
  };

  // Filter events based on current filter and search query
  const filteredEvents = useMemo(() => {
    const events = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);
    if (!Array.isArray(events)) return [];
    
    let filtered = events;
    
    // Apply status filter
    switch (eventFilter) {
      case 'active':
        filtered = filtered.filter(event => isEventActive(event));
        break;
      case 'inactive':
        filtered = filtered.filter(event => !isEventActive(event));
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const name = event.name?.toLowerCase() || '';
        const description = event.description?.toLowerCase() || '';
        const location = event.location?.toLowerCase() || '';
        
        // Handle date display for both single-day and multi-day events
        let dateStr = '';
        if (event.eventType === 'multi-day') {
          const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString().toLowerCase() : '';
          const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString().toLowerCase() : '';
          dateStr = `${startDate} ${endDate}`.trim();
        } else {
          dateStr = event.date ? new Date(event.date).toLocaleDateString().toLowerCase() : '';
        }
        
        return name.includes(query) || 
               description.includes(query) || 
               location.includes(query) || 
               dateStr.includes(query);
      });
    }
    
    return filtered;
  }, [eventsData, eventFilter, searchQuery]);

  const renderEvents = () => {
    if (eventsLoading) {
      return (
        <div className="row g-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <LoadingCard loading className="h-100" minHeight="200px">
                <div className="card-body">
                  <div className="skeleton-item mb-3" style={{ width: '70%', height: '1.5rem' }}></div>
                  <div className="skeleton-item mb-2" style={{ width: '100%', height: '1rem' }}></div>
                  <div className="skeleton-item mb-2" style={{ width: '60%', height: '1rem' }}></div>
                </div>
              </LoadingCard>
            </div>
          ))}
        </div>
      );
    }

    if (eventsError) {
      return (
        <ErrorDisplay 
          error={eventsError}
          title="Failed to load events"
        />
      );
    }

    const allEvents = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);
    const events = filteredEvents;
    
    if (allEvents.length === 0) {
      return (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-event text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Events Found</h4>
            <p className="text-muted">
              No events have been delegated to your zone yet.<br/>
              Events delegated by branch admins will appear here.
            </p>
            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Zone: {user?.zone?.name || 'Not assigned'}
              </small>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Event Filters and Search */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <div className="btn-group" role="group" aria-label="Event filter">
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="eventFilter" 
                        id="filter-active" 
                        checked={eventFilter === 'active'}
                        onChange={() => setEventFilter('active')}
                      />
                      <label className="btn btn-outline-primary btn-sm" htmlFor="filter-active">
                        <i className="bi bi-calendar-check me-1"></i>
                        Upcoming ({allEvents.filter(e => isEventActive(e)).length})
                      </label>
                      
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="eventFilter" 
                        id="filter-inactive" 
                        checked={eventFilter === 'inactive'}
                        onChange={() => setEventFilter('inactive')}
                      />
                      <label className="btn btn-outline-secondary btn-sm" htmlFor="filter-inactive">
                        <i className="bi bi-calendar-x me-1"></i>
                        Expired ({allEvents.filter(e => !isEventActive(e)).length})
                      </label>
                      
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="eventFilter" 
                        id="filter-all" 
                        checked={eventFilter === 'all'}
                        onChange={() => setEventFilter('all')}
                      />
                      <label className="btn btn-outline-info btn-sm" htmlFor="filter-all">
                        <i className="bi bi-calendar-event me-1"></i>
                        All ({allEvents.length})
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search events by name, description, location, or date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearchQuery('')}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length === 0 && allEvents.length > 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-3">No Events Found</h4>
              <p className="text-muted">
                No events match your current filter criteria.
                {searchQuery && (
                  <>
                    <br/>Try adjusting your search terms or filters.
                  </>
                )}
              </p>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  setEventFilter('all');
                  setSearchQuery('');
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {events.map((event) => {
              const isActive = isEventActive(event);
              return (
                <div key={event._id} className="col-12 col-sm-6 col-lg-4">
                  <div className={`card h-100 border border-primary border-opacity-10 card-hover-lift event-card ${!isActive ? 'opacity-50' : ''}`} 
                       style={!isActive ? { filter: 'grayscale(50%)' } : {}}>
                    <div className="card-header bg-gradient border-0 pb-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5 className="card-title mb-1 text-truncate" style={{ color: 'var(--primary-purple)' }}>
                          {event.name}
                        </h5>
                        <StatusBadge status={event.status} type="event" className="flex-shrink-0 ms-2" />
                      </div>
                      {event.creatorLevel && (
                        <small className="text-muted">
                          <i className="bi bi-person-badge me-1"></i>
                          {event.creatorLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Event
                        </small>
                      )}
                    </div>
                    
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-calendar-date text-primary me-2"></i>
                          <span className="fw-medium">
                            {event.eventType === 'multi-day' ? (
                              <>
                                {event.startDate && new Date(event.startDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {event.startDate && event.endDate && ' - '}
                                {event.endDate && new Date(event.endDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </>
                            ) : (
                              event.date && new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            )}
                          </span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-clock text-primary me-2"></i>
                          <span>
                            {event.eventType === 'multi-day' ? (
                              'Multi-day Event'
                            ) : (
                              event.date && new Date(event.date).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })
                            )}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-geo-alt text-primary me-2"></i>
                          <span className="text-truncate">
                            {event.location || 
                             (event.creatorLevel === 'super_admin' && event.availableStates?.length > 0
                               ? event.availableStates.map(state => state?.name || state).filter(Boolean).join(', ')
                               : event.creatorLevel === 'state_admin' && event.availableBranches?.length > 0 
                               ? event.availableBranches.map(branch => branch?.location || branch?.name || branch).filter(Boolean).join(', ')
                               : event.creatorLevel === 'branch_admin' && event.availableZones?.length > 0
                                 ? event.availableZones.map(zone => zone?.name || zone).filter(Boolean).join(', ')
                                 : 'Location TBD'
                             )}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="card-text text-muted small mb-3" 
                           style={{ 
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             overflow: 'hidden'
                           }}>
                          {event.description}
                        </p>
                      )}

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedEventForDetails(event);
                              setShowEventDetailsModal(true);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View Details
                          </button>
                          <button 
                            className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => isActive && setSelectedEventForAssignment(event)}
                            disabled={!isActive}
                            title={isActive ? 'Assign pickup stations to this event' : 'Cannot assign pickup to expired events'}
                          >
                            <i className="bi bi-geo-alt me-1"></i>
                            {isActive ? 'Assign Pickup' : 'Expired'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mt-3">
                <p className="text-muted mb-0">
                  Showing {events.length} of {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} for {user?.zone?.name || 'your zone'}
                  {eventFilter !== 'all' && (
                    <span className="ms-2">
                      <i className="bi bi-funnel me-1"></i>
                      {eventFilter === 'active' ? 'Upcoming only' : 'Expired only'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };  const renderPickupStations = () => {
    return (
      <PickupStationManagement />
    );
  };

  // Handle tab change and close mobile menu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div>
      {/* Back Button (only show when not on overview tab) */}
      {activeTab !== 'overview' && (
        <div className="mb-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => handleTabChange('overview')}
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Overview
          </button>
        </div>
      )}
      
      {/* Mobile Navigation */}
      <div className="d-md-none mb-3 position-relative">
        <h5 className="mb-0 text-center">
          {activeTab === 'overview' && <><i className="bi bi-bar-chart-line me-2"></i>Overview</>}
          {activeTab === 'events' && <><i className="bi bi-calendar-event me-2"></i>Events</>}
          {activeTab === 'pickup-stations' && <><i className="bi bi-bus-front me-2"></i>Pickup Stations</>}
        </h5>
        <button 
          className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0"
          style={{ width: '32px', height: '32px', padding: '0' }}
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'} small`}></i>
        </button>
      </div>
        
      {mobileMenuOpen && (
          <div className="mobile-nav-menu show d-md-none">
            <div className="list-group">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
                type="button"
              >
                <i className="bi bi-bar-chart-line me-2"></i>
                Overview
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleTabChange('events')}
                type="button"
              >
                <i className="bi bi-calendar-event me-2"></i>
                Events
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'pickup-stations' ? 'active' : ''}`}
                onClick={() => handleTabChange('pickup-stations')}
                type="button"
              >
                <i className="bi bi-bus-front me-2"></i>
                Pickup Stations
              </button>
            </div>
          </div>
        )}

      {/* Desktop Tab Navigation */}
      <ul className="nav nav-tabs mb-4 d-none d-md-flex" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
            type="button"
            role="tab"
          >
            <i className="bi bi-bar-chart-line me-2"></i>
            Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
            type="button"
            role="tab"
          >
            <i className="bi bi-calendar-event me-2"></i>
            Events
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pickup-stations' ? 'active' : ''}`}
            onClick={() => handleTabChange('pickup-stations')}
            type="button"
            role="tab"
          >
            <i className="bi bi-bus-front me-2"></i>
            Pickup Stations
          </button>
        </li>
      </ul>      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'pickup-stations' && renderPickupStations()}
      </div>

      {/* Pickup Station Assignment Modal */}
      {selectedEventForAssignment && (
        <PickupStationAssignmentModal
          event={selectedEventForAssignment}
          onClose={() => setSelectedEventForAssignment(null)}
          onComplete={() => {
            setSelectedEventForAssignment(null);
            refetchEvents(); // Refresh events to show updated assignment status
          }}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          onClose={() => {
            setShowEventDetailsModal(false);
            setSelectedEventForDetails(null);
          }}
        />
      )}
    </div>
  );
};

// Event Details Modal Component
const EventDetailsModal = ({ event, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      case 'cancelled': return 'danger';
      case 'completed': return 'primary';
      default: return 'secondary';
    }
  };

  const getCreatorLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'super_admin': return 'danger';
      case 'state_admin': return 'warning';
      case 'branch_admin': return 'info';
      case 'zonal_admin': return 'success';
      default: return 'secondary';
    }
  };

  const getCreatorLevelText = (level) => {
    switch (level?.toLowerCase()) {
      case 'super_admin': return 'Super Admin';
      case 'state_admin': return 'State Admin';
      case 'branch_admin': return 'Branch Admin';
      case 'zonal_admin': return 'Zonal Admin';
      default: return level || 'Unknown';
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-primary bg-opacity-10">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-calendar-event me-2"></i>
              Event Details
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Event Basic Information */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Basic Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <h4 className="mb-3">{event.name}</h4>
                        {event.description && (
                          <p className="text-muted mb-3">{event.description}</p>
                        )}
                        <div className="mb-3">
                          <strong>📅 Date & Time:</strong><br />
                          <span className="text-muted">
                            {event.eventType === 'multi-day' ? (
                              <>
                                {event.startDate && formatDate(event.startDate)}
                                {event.startDate && event.endDate && ' - '}
                                {event.endDate && formatDate(event.endDate)}
                              </>
                            ) : (
                              event.date && formatDate(event.date)
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <span className={`badge bg-${getStatusColor(event.status)} fs-6 mb-2`}>
                            {event.status || 'Unknown'}
                          </span>
                          <br />
                          <small className="text-muted">Status</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Availability Zones */}
            {event.availableZones && event.availableZones.length > 0 && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title mb-0">
                        <i className="bi bi-geo-alt me-2"></i>
                        Available Zones ({event.availableZones.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {event.availableZones.map((zone, index) => (
                          <div key={index} className="col-md-4 col-sm-6 mb-2">
                            <span className="badge bg-secondary me-2">
                              <i className="bi bi-geo-alt me-1"></i>
                              {typeof zone === 'object' ? zone.name : zone}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Stations */}
            {event.pickupStations && event.pickupStations.length > 0 && (
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title mb-0">
                        <i className="bi bi-bus-front me-2"></i>
                        Assigned Pickup Stations ({event.pickupStations.length})
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {event.pickupStations.map((station, index) => (
                          <div key={index} className="col-md-6 col-lg-4 mb-3">
                            <div className="border rounded p-3">
                              <h6 className="mb-2">
                                <i className="bi bi-geo-alt me-1"></i>
                                {station.pickupStationId?.location || `Station ${index + 1}`}
                              </h6>
                              <div className="small text-muted">
                                {station.departureTime && (
                                  <div><strong>Departure:</strong> {formatTime(station.departureTime)}</div>
                                )}
                                {station.maxCapacity && (
                                  <div><strong>Capacity:</strong> {station.maxCapacity}</div>
                                )}
                                {station.currentCount !== undefined && (
                                  <div><strong>Current Count:</strong> {station.currentCount}</div>
                                )}
                                {station.notes && (
                                  <div><strong>Notes:</strong> {station.notes}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <i className="bi bi-x-circle me-2"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZonalAdminTabs;