import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../../utils/statusUtils.jsx';
import { ErrorDisplay, EmptyState } from '../common/Loading';
import AttendanceReport from './AttendanceReport';
import { formatEventDate, isEventUpcoming } from '../../utils/dateUtils';

const EventsList = ({ events, loading, error, canEdit, onRefresh, onCreateEvent, onEditEvent, isReadOnly = false }) => {
  const [eventFilter, setEventFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Helper function to check if event is active/expired
  const isEventActive = (event) => {
    return isEventUpcoming(event);
  };

  const handleViewAttendance = (eventId) => {
    setSelectedEventId(eventId);
    setShowAttendanceReport(true);
  };

  const closeAttendanceReport = () => {
    setShowAttendanceReport(false);
    setSelectedEventId(null);
  };
  
  // Filter events based on the selected filter and search query
  const filteredEvents = useMemo(() => {
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
        const date = formatEventDate(event).toLowerCase();
        
        return name.includes(query) || 
               description.includes(query) || 
               location.includes(query) || 
               date.includes(query);
      });
    }
    
    return filtered;
  }, [events, eventFilter, searchQuery]);
  
  const handleEditClick = (event) => {
    // Don't allow editing of inactive events
    if (!isEventActive(event)) {
      return;
    }
    
    if (onEditEvent) {
      onEditEvent(event);
    } else {
      console.error('onEditEvent is not defined!');
    }
  };
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRefresh}
        title="Failed to load events"
      />
    );
  }

  // Check if we have any events at all
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <EmptyState 
        icon="bi-calendar-event"
        title="No Events Found"
        description="There are no events available at the moment. Create your first event to get started."
        action={onCreateEvent && !isReadOnly && (
          <button 
            className="btn btn-primary mt-3"
            onClick={onCreateEvent}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Your First Event
          </button>
        )}
      />
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-light border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search events by name, location, description, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              borderColor: 'var(--bs-border-color)',
              boxShadow: 'none'
            }}
          />
          {searchQuery && (
            <button
              className="btn btn-outline-secondary border-start-0"
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Events ({filteredEvents.length})</h5>
          <p className="text-muted mb-0">
            {searchQuery && `Search results for "${searchQuery}" • `}
            {eventFilter === 'active' && 'Showing active events'}
            {eventFilter === 'inactive' && 'Showing expired events'}
            {eventFilter === 'all' && 'Showing all events'}
          </p>
        </div>
        
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
            Active ({events.filter(e => isEventActive(e)).length})
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
            Expired ({events.filter(e => !isEventActive(e)).length})
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
            All ({events.length})
          </label>
        </div>
      </div>

      {/* Empty state for filtered results */}
      {filteredEvents.length === 0 && (
        <EmptyState 
          icon="bi-calendar-event"
          title={searchQuery ? "No Events Found" : `No ${eventFilter === 'all' ? '' : eventFilter} Events Found`}
          description={
            searchQuery 
              ? `No events match your search "${searchQuery}". Try different keywords or clear the search.`
              : eventFilter === 'active' 
                ? "No active events available." 
                : eventFilter === 'inactive' 
                  ? "No expired events found." 
                  : "No events match your current filter."
          }
          action={searchQuery && (
            <button 
              className="btn btn-outline-primary mt-3"
              onClick={() => setSearchQuery('')}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Clear Search
            </button>
          )}
        />
      )}

      {/* Events Grid */}
      {filteredEvents.length > 0 && (
        <div className="row g-4">
          {filteredEvents.map((event) => {
            const isActive = isEventActive(event);
            return (
        <div key={event._id} className="col-12 col-sm-6 col-lg-4">
          <div className={`card event-card ${!isActive ? 'opacity-50' : ''}`} 
               style={!isActive ? { filter: 'grayscale(50%)' } : {}}>
            
            {/* Fixed Header Section */}
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-start">
                {/* Desktop title - truncated */}
                <h5 className="card-title d-none d-md-block text-truncate" style={{ color: 'var(--primary-purple)' }}>
                  {event.name}
                </h5>
                {/* Mobile title - wrapped */}
                <h5 className="card-title d-md-none" style={{ color: 'var(--primary-purple)', wordWrap: 'break-word', hyphens: 'auto', lineHeight: '1.3', marginRight: '8px' }}>
                  {event.name}
                </h5>
                <StatusBadge status={event.status} type="event" className="flex-shrink-0 ms-2" />
              </div>
              {event.creatorLevel && (
                <small className="text-muted mt-1 d-block">
                  <i className="bi bi-person-badge me-1"></i>
                  {event.creatorLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Event
                </small>
              )}
            </div>
            
            {/* Fixed Body Section with Uniform Layout */}
            <div className="card-body d-flex flex-column">
              
              {/* Date Section - Fixed Height */}
              <div className="mb-3 event-date-section">
                <i className="bi bi-calendar-event me-2 text-muted"></i>
                <small className="text-muted">
                  {formatEventDate(event)}
                </small>
                {event.eventType === 'multi-day' && (
                  <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                    Multi-day
                  </span>
                )}
                {event.eventType === 'multi-day-specific' && (
                  <span className="badge bg-warning ms-2" style={{ fontSize: '0.7rem' }}>
                    Specific Dates
                  </span>
                )}
              </div>
              
              {/* Location Section - Fixed Height */}
              <div className="mb-3 event-location-section">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small className="text-muted text-truncate d-block">
                  {event.creatorLevel === 'super_admin' && event.availableStates?.length > 0
                    ? event.availableStates.length === 1 
                      ? event.availableStates[0]?.name || `${event.availableStates.length} state selected`
                      : event.availableStates.length <= 6
                      ? event.availableStates.map(state => state?.name).filter(Boolean).join(', ')
                      : `${event.availableStates.map(state => state?.name).filter(Boolean).slice(0, 3).join(', ')} and ${event.availableStates.length - 3} more states`
                    : event.creatorLevel === 'state_admin' && event.availableBranches?.length > 0
                    ? event.availableBranches.length === 1 
                      ? event.availableBranches[0]?.name || `${event.availableBranches.length} branch selected`
                      : event.availableBranches.length <= 4
                      ? event.availableBranches.map(branch => branch?.name).filter(Boolean).join(', ')
                      : `${event.availableBranches.map(branch => branch?.name).filter(Boolean).slice(0, 2).join(', ')} and ${event.availableBranches.length - 2} more branches`
                    : event.creatorLevel === 'branch_admin' && event.location
                    ? event.location
                    : event.creatorLevel === 'branch_admin' && event.availableZones?.length > 0
                    ? event.availableZones.length === 1 
                      ? event.availableZones[0]?.name || `${event.availableZones.length} zone selected`
                      : event.availableZones.length <= 4
                      ? event.availableZones.map(zone => zone?.name).filter(Boolean).join(', ')
                      : `${event.availableZones.map(zone => zone?.name).filter(Boolean).slice(0, 2).join(', ')} and ${event.availableZones.length - 2} more zones`
                    : event.location || 'Location TBD'
                  }
                </small>
              </div>
              
              {/* Description Section - Fixed Height (3 lines max) */}
              <div className="mb-3 event-description-section">
                <p className="card-text text-muted small event-description">
                  {event.description || 'No description available.'}
                </p>
              </div>
              
              {/* Badges Section - Fixed Height and Position */}
              <div className="mb-3 event-badges-section">
                {(event.creatorLevel === 'super_admin' || event.creatorLevel === 'branch_admin') ? (
                  <div>
                    <small className="text-muted d-block mb-2">
                      {event.creatorLevel === 'super_admin' ? 'Delegation Progress:' : 'Zone Assignment:'}
                    </small>
                    <div className="d-flex gap-2 flex-wrap">
                      {event.creatorLevel === 'super_admin' && (
                        <span className={`badge ${event.availableBranches?.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                          Branches {event.availableBranches?.length > 0 ? '✓' : '○'}
                        </span>
                      )}
                      <span className={`badge ${event.availableZones?.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                        Zones {event.availableZones?.length > 0 ? '✓' : '○'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: '52px' }}></div> // Placeholder to maintain consistent height
                )}
              </div>
              
              {/* Action Buttons Section - Fixed at Bottom */}
              <div className="mt-auto event-actions-section">
                <div className="d-flex gap-2 justify-content-start" style={{ flexDirection: 'row', flexWrap: 'nowrap' }}>
                  <button 
                    className="btn btn-sm btn-outline-info flex-shrink-0"
                    aria-label={`View attendance report for ${event.name}`}
                    onClick={() => handleViewAttendance(event._id)}
                    title="View Attendance Report"
                    style={{ minWidth: 'auto', width: 'auto', padding: '4px 8px' }}
                  >
                    <i className="bi bi-clipboard-data"></i>
                    <span className="d-none d-lg-inline ms-1">Attendance</span>
                  </button>
                  
                  {(typeof canEdit === 'function' ? canEdit(event) : canEdit) && !isReadOnly && (
                    <button 
                      className={`btn btn-sm ${isActive ? 'btn-outline-primary' : 'btn-outline-secondary'} flex-shrink-0`}
                      aria-label={`Edit ${event.name}`}
                      onClick={() => handleEditClick(event)}
                      disabled={!isActive}
                      title={!isActive ? 'Cannot edit expired events' : 
                             event.creatorLevel === 'super_admin' ? 'Super admin events can only be delegated, not edited' : 
                             `Edit ${event.name}`}
                      style={{ minWidth: 'auto', width: 'auto', padding: '4px 8px' }}
                    >
                      <i className="bi bi-pencil"></i>
                      <span className="d-none d-lg-inline ms-1">Edit</span>
                    </button>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
            );
          })}
        </div>
      )}

      {/* Attendance Report Modal */}
      {showAttendanceReport && selectedEventId && (
        <AttendanceReport 
          eventId={selectedEventId} 
          onClose={closeAttendanceReport} 
        />
      )}
    </div>
  );
};

export default EventsList;
