import React from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime, getVolunteerButtonState } from '../../helpers/workerTabs.helpers';

const AllEventsTab = ({ allEvents, loading, error, handleVolunteerForEvent, user }) => {
  function renderEventCard(event) {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
    const buttonState = getVolunteerButtonState(event, user);
    
    return (
      <div key={event._id} className="col-12 col-sm-6 col-lg-4">
        <div className="card h-100 border border-primary border-opacity-10 card-hover-lift event-card">
          <div className="card-header bg-gradient border-0 pb-0">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)', wordWrap: 'break-word', hyphens: 'auto', lineHeight: '1.3', overflowWrap: 'break-word' }}>
                {event.name || event.title}
              </h5>
              <span className={`badge ${
                buttonState.text === 'Volunteered' ? 'bg-success' : 
                buttonState.text === 'Pending' ? 'bg-warning' : 
                'bg-primary'
              } flex-shrink-0 ms-2`}>
                {event.status || 'Published'}
              </span>
            </div>
            <small className="text-muted">
              <i className="bi bi-calendar-plus me-1"></i>
              Available Event
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
                onClick={() => !buttonState.disabled && handleVolunteerForEvent(event._id)}
                disabled={buttonState.disabled}
              >
                <i className={`bi ${buttonState.text === 'Volunteer' ? 'bi-hand-thumbs-up' : 
                  buttonState.text === 'Pending' ? 'bi-clock' : 
                  buttonState.text === 'Volunteered' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                {buttonState.text}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
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
          {allEvents.map(event => renderEventCard(event))}
        </div>
      )}
    </div>
  );
};

export default AllEventsTab;
