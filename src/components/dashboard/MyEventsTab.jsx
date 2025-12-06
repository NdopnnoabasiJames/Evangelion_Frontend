import React, { useState, useMemo } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime } from '../../helpers/workerTabs.helpers';

const MyEventsTab = ({ myEvents, loading, error }) => {
  const [eventFilter, setEventFilter] = useState('upcoming'); // 'upcoming', 'expired', 'all'
  
  // Helper function to check if event is upcoming (not expired)
  const isEventUpcoming = (event) => {
    const now = new Date();
    
    // For multi-day specific dates events, check if any date is upcoming
    if (event.eventType === 'multi-day-specific' && event.specificDates) {
      return event.specificDates.some(date => new Date(date) >= now);
    }
    
    // For multiday events, check if the event has ended using endDate
    if (event.eventType === 'multi-day') {
      const eventEndDate = event.endDate ? new Date(event.endDate) : null;
      if (eventEndDate) {
        return eventEndDate >= now;
      }
      // Fallback to startDate if endDate is not available
      const eventStartDate = event.startDate ? new Date(event.startDate) : null;
      return eventStartDate ? eventStartDate >= now : false;
    }
    
    // For single-day events, use the date field
    const eventDate = event.date ? new Date(event.date) : null;
    return eventDate ? eventDate >= now : false;
  };
  
  // Filter events based on the selected filter
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(myEvents)) return [];
    
    let filtered = myEvents;
    
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
      // Get proper date for each event type
      const getEventDate = (event) => {
        if (event.eventType === 'multi-day' && event.startDate) {
          return new Date(event.startDate);
        }
        return event.date ? new Date(event.date) : new Date(0);
      };
      
      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      const isUpcomingA = isEventUpcoming(a);
      const isUpcomingB = isEventUpcoming(b);
      
      // If both are upcoming or both are expired, sort by date
      if (isUpcomingA === isUpcomingB) {
        return isUpcomingA ? dateA - dateB : dateB - dateA; // Upcoming: earliest first, Expired: latest first
      }
      
      // Upcoming events come before expired events
      return isUpcomingA ? -1 : 1;
    });
  }, [myEvents, eventFilter]);
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
              <span className={`badge ${isUpcoming ? 'bg-success' : 'bg-secondary'} flex-shrink-0 ms-2`}>
                {isUpcoming ? 'Active' : 'Expired'}
              </span>
            </div>
            <small className="text-muted">
              <i className="bi bi-person-check me-1"></i>
              Volunteered Event
            </small>
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
            </div>
            
            <div className="mb-2">
              <i className="bi bi-geo-alt me-2 text-muted"></i>
              <small className="text-muted text-truncate d-block">
                {location}
              </small>
            </div>
            
            {event.description && (
              <div className="mb-2">
                <p className="card-text text-muted small mb-0 description-truncate">
                  {event.description}
                </p>
              </div>
            )}
            
            <div className="mt-auto pt-2">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  Event Participation
                </small>
                <div className="d-flex gap-1">
                  {isUpcoming && (
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                      <i className="bi bi-check-circle me-1"></i>
                      Approved
                    </span>
                  )}
                </div>
              </div>
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
          <h5 className="mb-1">My Approved Events ({filteredEvents.length})</h5>
          <p className="text-muted mb-0">
            {eventFilter === 'upcoming' && 'Showing upcoming events you volunteered for'}
            {eventFilter === 'expired' && 'Showing expired events you volunteered for'}
            {eventFilter === 'all' && 'Showing all events you volunteered for'}
          </p>
        </div>
        
        <div className="btn-group" role="group" aria-label="Event filter">
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-upcoming" 
            checked={eventFilter === 'upcoming'}
            onChange={() => setEventFilter('upcoming')}
          />
          <label className="btn btn-outline-success btn-sm" htmlFor="my-filter-upcoming">
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming ({myEvents.filter(e => isEventUpcoming(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-expired" 
            checked={eventFilter === 'expired'}
            onChange={() => setEventFilter('expired')}
          />
          <label className="btn btn-outline-secondary btn-sm" htmlFor="my-filter-expired">
            <i className="bi bi-calendar-x me-1"></i>
            Expired ({myEvents.filter(e => !isEventUpcoming(e)).length})
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="myEventFilter" 
            id="my-filter-all" 
            checked={eventFilter === 'all'}
            onChange={() => setEventFilter('all')}
          />
          <label className="btn btn-outline-info btn-sm" htmlFor="my-filter-all">
            <i className="bi bi-calendar-event me-1"></i>
            All ({myEvents.length})
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
          title="Failed to load your events"
        />
      ) : myEvents.length === 0 ? (
        <EmptyState 
          icon="bi-calendar-event"
          title="No Volunteered Events Found"
          description="You haven't volunteered for any events yet. Visit the 'All Events' or 'Branch Events' tabs to find events to volunteer for."
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState 
          icon="bi-calendar-event"
          title={eventFilter === 'upcoming' ? "No Upcoming Events" : eventFilter === 'expired' ? "No Expired Events" : "No Events Found"}
          description={
            eventFilter === 'upcoming' 
              ? "You don't have any upcoming events you've volunteered for." 
              : eventFilter === 'expired' 
                ? "You don't have any expired events you've volunteered for." 
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

export default MyEventsTab;
