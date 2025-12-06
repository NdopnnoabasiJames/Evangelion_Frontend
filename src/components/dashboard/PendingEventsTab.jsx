import React, { useState, useMemo } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime } from '../../helpers/workerTabs.helpers';

const PendingEventsTab = ({ pendingEvents, loading, error }) => {
  const [eventFilter, setEventFilter] = useState('upcoming'); // 'upcoming', 'expired', 'all'
  
  // Helper function to check if event is upcoming (not expired)
  const isEventUpcoming = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate >= now;
  };
  
  // Filter events based on the selected filter
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(pendingEvents)) return [];
    
    let filtered = pendingEvents;
    
    // Apply status filter
    switch (eventFilter) {
      case 'upcoming':
        filtered = filtered.filter(event => isEventUpcoming(event));
        break;
      case 'expired':
        filtered = filtered.filter(event => !isEventUpcoming(event));
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }
    
    // Sort by date - upcoming events first (earliest date first), then expired events
    return filtered.sort((a, b) => {
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
  }, [pendingEvents, eventFilter]);

  function renderEventCard(event) {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
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
              <span className={`badge ${isUpcoming ? 'bg-warning' : 'bg-secondary'} flex-shrink-0 ms-2`}>
                {isUpcoming ? 'Pending' : 'Expired'}
              </span>
            </div>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Awaiting Approval
            </small>
          </div>
          
          <div className="card-body pt-2">
            <div className="mb-2">
              <i className="bi bi-calendar-event me-2 text-muted"></i>
              <small className="text-muted">
                {date} at {time}
              </small>
            </div>
            
            <div className="mb-2">
              <i className="bi bi-geo-alt me-2 text-muted"></i>
              <small className="text-muted text-truncate d-block">
                {location}
              </small>
            </div>
            
            {event.targetBranch && (
              <div className="mb-2">
                <i className="bi bi-building me-2 text-muted"></i>
                <small className="text-muted">
                  Applied to: {event.targetBranch.name}
                </small>
              </div>
            )}
            
            {event.description && (
              <div className="mb-2">
                <p className="card-text text-muted small mb-0 description-truncate">
                  {event.description}
                </p>
              </div>
            )}
            
            <div className="mt-auto">
              <button 
                className="btn btn-warning btn-sm w-100" 
                disabled
                title="Waiting for branch pastor approval"
              >
                <i className="bi bi-clock me-1"></i>
                Pending Approval
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Pending Volunteer Requests ({filteredEvents.length})</h5>
          <p className="text-muted mb-0">
            {eventFilter === 'upcoming' && 'Showing upcoming events awaiting approval'}
            {eventFilter === 'expired' && 'Showing expired events awaiting approval'}
            {eventFilter === 'all' && 'Showing all events awaiting approval'}
          </p>
        </div>
        
        <div className="btn-group" role="group" aria-label="Event filter">
          <input 
            type="radio" 
            className="btn-check" 
            name="pendingEventFilter" 
            id="pending-filter-upcoming" 
            checked={eventFilter === 'upcoming'}
            onChange={() => setEventFilter('upcoming')}
          />
          <label className="btn btn-outline-success btn-sm" htmlFor="pending-filter-upcoming">
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming ({pendingEvents.filter(e => isEventUpcoming(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="pendingEventFilter" 
            id="pending-filter-expired" 
            checked={eventFilter === 'expired'}
            onChange={() => setEventFilter('expired')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="pending-filter-expired">
            <i className="bi bi-calendar-x me-1"></i>
            Expired ({pendingEvents.filter(e => !isEventUpcoming(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="pendingEventFilter" 
            id="pending-filter-all" 
            checked={eventFilter === 'all'}
            onChange={() => setEventFilter('all')}
          />
          <label className="btn btn-outline-info btn-sm" htmlFor="pending-filter-all">
            <i className="bi bi-calendar-event me-1"></i>
            All ({pendingEvents.length})
          </label>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading ? (
        <div className="row g-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4">
              <LoadingCard height="300px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorDisplay 
          error={error} 
          title="Failed to load pending events"
        />
      ) : pendingEvents.length === 0 ? (
        <EmptyState 
          icon="bi-clock"
          title="No Pending Volunteer Requests"
          description="You don't have any pending volunteer requests. All your volunteer requests have been processed."
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState 
          icon="bi-clock"
          title={eventFilter === 'upcoming' ? "No Upcoming Pending Events" : eventFilter === 'expired' ? "No Expired Pending Events" : "No Pending Events Found"}
          description={
            eventFilter === 'upcoming' 
              ? "You don't have any upcoming events awaiting approval." 
              : eventFilter === 'expired' 
                ? "You don't have any expired events awaiting approval." 
                : "No events match your current filter."
          }
        />
      ) : (
        <div className="row g-4">
          {filteredEvents.map(event => renderEventCard(event))}
        </div>
      )}
    </div>
  );
};

export default PendingEventsTab;