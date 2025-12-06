import React, { useState, useMemo } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime, getVolunteerButtonState } from '../../helpers/workerTabs.helpers';
import VolunteerSelectionModal from './VolunteerSelectionModal';

const WorkerEventsList = ({ events, loading, error, handleVolunteerForEvent, user, onRefresh, title = "Events", description }) => {
  const [eventFilter, setEventFilter] = useState('upcoming'); // 'upcoming', 'expired', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Helper function to check if event is upcoming (not expired) - use date-only comparison like Super Admin
  const isEventUpcoming = (event) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    // For multi-day specific dates events, check if any date is today or future (date-only)
    if (event.eventType === 'multi-day-specific' && event.specificDates) {
      return event.specificDates.some(dateStr => {
        const eventDate = new Date(dateStr);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        return eventDay >= today;
      });
    }
    
    // For multiday consecutive events, check if the event has ended using endDate (date-only)
    if (event.eventType === 'multi-day') {
      const eventEndDate = event.endDate ? new Date(event.endDate) : null;
      if (eventEndDate) {
        const endDay = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
        return endDay >= today;
      }
      // Fallback to startDate if endDate is not available
      const eventStartDate = event.startDate ? new Date(event.startDate) : null;
      if (eventStartDate) {
        const startDay = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
        return startDay >= today;
      }
      return false;
    }
    
    // For single-day events, use date-only comparison (not time-based)
    const eventDate = event.date ? new Date(event.date) : null;
    if (eventDate) {
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      return eventDay >= today;
    }
    return false;
  };

  // Helper function to check if event needs approval (vs auto-approved)
  const needsApproval = (event) => {
    if (!user?.branch) return true;
    
    const workerBranchId = user.branch._id || user.branch;
    
    // Auto-approved conditions:
    // 1. Event created by worker's branch pastor
    // 2. Event delegated to worker's branch (in selectedBranches or availableBranches)
    
    const isBranchEvent = event.selectedBranches?.some(branch => 
      (branch._id || branch).toString() === workerBranchId.toString()
    );
    
    const isDelegatedToBranch = event.availableBranches?.some(branch => 
      (branch._id || branch).toString() === workerBranchId.toString()
    );
    
    return !isBranchEvent && !isDelegatedToBranch;
  };

  // Handle volunteer button click
  const handleVolunteerClick = (event) => {
    if (needsApproval(event)) {
      // Show modal for state/branch selection
      setSelectedEvent(event);
      setShowVolunteerModal(true);
    } else {
      // Auto-approved - call the original handler
      handleVolunteerForEvent(event._id);
    }
  };

  // Handle volunteer confirmation from modal
  const handleVolunteerConfirm = (selectionData) => {
    if (selectedEvent) {
      // Call the volunteer handler with selection data
      handleVolunteerForEvent(selectedEvent._id, selectionData);
      setSelectedEvent(null);
    }
  };
  
  // Helper function to check if worker has registered/volunteered for an event
  const hasWorkerRegistered = (event) => {
    if (!user?._id) return false;
    
    const userId = user._id.toString();
    
    // ONLY return true if volunteerStatus is set AND it indicates THIS worker volunteered
    if (event.volunteerStatus && ['approved', 'pending', 'rejected'].includes(event.volunteerStatus)) {
      return true;
    }
    
    return false;
  };

  // Filter events based on the selected filter and search query
  const filteredEvents = useMemo(() => {
    // Reduced logging to prevent infinite loops
    
    if (!Array.isArray(events)) return [];
    
    let filtered = events;
    
    // Apply status filter
    switch (eventFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => isEventUpcoming(event));
        break;
      case 'expired':
        // For expired events, only show events the worker has registered for
        const expiredEvents = events.filter(event => !isEventUpcoming(event));
        const registeredExpiredEvents = expiredEvents.filter(event => hasWorkerRegistered(event));
        
        filtered = registeredExpiredEvents;
        break;
      case 'all':
      default:
        // For 'all', show all upcoming events + only expired events the worker volunteered for
        const allUpcomingEvents = events.filter(event => isEventUpcoming(event));
        const workerExpiredEvents = events.filter(event => !isEventUpcoming(event) && hasWorkerRegistered(event));
        
        filtered = [...allUpcomingEvents, ...workerExpiredEvents];
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const name = (event.name || event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const location = formatEventLocation(event).toLowerCase();
        const date = new Date(event.date).toLocaleDateString().toLowerCase();
        
        return name.includes(query) || 
               description.includes(query) || 
               location.includes(query) || 
               date.includes(query);
      });
    }
    
    // Sort by date - upcoming events first (earliest date first), then expired events
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const isUpcomingA = isEventUpcoming(a);
      const isUpcomingB = isEventUpcoming(b);
      
      // If both are upcoming or both are expired, sort by date
      if (isUpcomingA === isUpcomingB) {
        return isUpcomingA ? dateA - dateB : dateB - dateA; // Upcoming: earliest first, Expired: latest first
      }
      
      // Upcoming events come before expired events
      return isUpcomingA ? -1 : 1;
    });
    
    
    return sortedFiltered;
  }, [events, eventFilter, searchQuery]);

  const renderEventCard = (event) => {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
    const buttonState = getVolunteerButtonState(event, user);
    const isUpcoming = isEventUpcoming(event);
    
    return (
      <div key={event._id} className="col-12 col-sm-6 col-lg-4">
        <div className={`card h-100 border border-primary border-opacity-10 card-hover-lift event-card ${!isUpcoming ? 'opacity-50' : ''}`} 
             style={!isUpcoming ? { filter: 'grayscale(50%)' } : {}}>
          <div className="card-header bg-gradient border-0 pb-0">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)', wordWrap: 'break-word', hyphens: 'auto', lineHeight: '1.3', overflowWrap: 'break-word' }}>
                {event.name || event.title}
              </h5>
              <span className={`badge ${
                buttonState.text === 'Volunteered' ? 'bg-success' : 
                buttonState.text === 'Pending' ? 'bg-warning' : 
                isUpcoming ? 'bg-primary' : 'bg-secondary'
              } flex-shrink-0 ms-2`}>
                {isUpcoming ? (event.status || 'Published') : 'Expired'}
              </span>
            </div>
            {event.creatorLevel && (
              <small className="text-muted">
                <i className="bi bi-person-badge me-1"></i>
                {event.creatorLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Event
              </small>
            )}
          </div>
          
          <div className="card-body pt-2">
            <div className="mb-2">
              <i className="bi bi-calendar-event me-2 text-muted"></i>
              <small className="text-muted">
                {date} at {time}
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
            
            <div className="mb-2">
              <i className="bi bi-geo-alt me-2 text-muted"></i>
              <small className="text-muted text-truncate d-block">
                {location}
              </small>
            </div>
            
            {event.description && (
              <div className="mb-3">
                <p className="card-text text-muted small mb-0 description-truncate">
                  {event.description}
                </p>
              </div>
            )}
            
            <div className="mt-auto">
              <button
                className={`btn btn-${buttonState.variant} btn-sm w-100`}
                onClick={() => isUpcoming && !buttonState.disabled && handleVolunteerClick(event)}
                disabled={buttonState.disabled || !isUpcoming}
                title={!isUpcoming ? 'Cannot volunteer for expired events' : 
                       buttonState.text === 'Volunteer' && needsApproval(event) ? 'Requires branch pastor approval' : 
                       buttonState.text}
              >
                <i className={`bi ${
                  !isUpcoming ? 'bi-clock-history' :
                  buttonState.text === 'Volunteer' ? 'bi-hand-thumbs-up' : 
                  buttonState.text === 'Pending' ? 'bi-clock' : 
                  buttonState.text === 'Volunteered' ? 'bi-check-circle' : 'bi-x-circle'
                } me-1`}></i>
                {!isUpcoming ? 'Expired' : buttonState.text}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
        description="There are no events available at the moment. Check back later for new events to volunteer for."
        action={onRefresh && (
          <button 
            className="btn btn-primary mt-3"
            onClick={onRefresh}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh Events
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
          <h5 className="mb-1">{title} ({filteredEvents.length})</h5>
          <p className="text-muted mb-0">
            {description && `${description} • `}
            {searchQuery && `Search: "${searchQuery}" • `}
            {eventFilter === 'upcoming' && 'Showing upcoming events'}
            {eventFilter === 'expired' && 'Showing expired events'}
            {eventFilter === 'all' && 'Showing all events'}
          </p>
        </div>
        
        <div className="btn-group" role="group" aria-label="Event filter">
          <input 
            type="radio" 
            className="btn-check" 
            name="eventFilter" 
            id="filter-upcoming" 
            checked={eventFilter === 'upcoming'}
            onChange={() => setEventFilter('upcoming')}
          />
          <label className="btn btn-outline-success btn-sm" htmlFor="filter-upcoming">
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming ({events.filter(e => isEventUpcoming(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="eventFilter" 
            id="filter-expired" 
            checked={eventFilter === 'expired'}
            onChange={() => setEventFilter('expired')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="filter-expired">
            <i className="bi bi-calendar-x me-1"></i>
            Expired ({events.filter(e => !isEventUpcoming(e) && hasWorkerRegistered(e)).length})
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
            All ({events.filter(e => isEventUpcoming(e)).length + events.filter(e => !isEventUpcoming(e) && hasWorkerRegistered(e)).length})
          </label>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="row g-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <LoadingCard height="300px" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state for filtered results */}
      {!loading && filteredEvents.length === 0 && (
        <EmptyState 
          icon="bi-calendar-event"
          title={searchQuery ? "No Events Found" : `No ${eventFilter === 'all' ? '' : eventFilter} Events Found`}
          description={
            searchQuery 
              ? `No events match your search "${searchQuery}". Try different keywords or clear the search.`
              : eventFilter === 'upcoming' 
                ? "No upcoming events available. Check back later for new events to volunteer for." 
                : eventFilter === 'expired' 
                  ? "No expired events found." 
                  : "No events match your current filter."
          }
          action={searchQuery ? (
            <button 
              className="btn btn-outline-primary mt-3"
              onClick={() => setSearchQuery('')}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Clear Search
            </button>
          ) : (
            onRefresh && (
              <button 
                className="btn btn-primary mt-3"
                onClick={onRefresh}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh Events
              </button>
            )
          )}
        />
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="row g-4">
          {filteredEvents.map(event => renderEventCard(event))}
        </div>
      )}

      {/* Volunteer Selection Modal */}
      <VolunteerSelectionModal
        event={selectedEvent}
        isOpen={showVolunteerModal}
        onClose={() => {
          setShowVolunteerModal(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleVolunteerConfirm}
      />
    </div>
  );
};

export default WorkerEventsList;