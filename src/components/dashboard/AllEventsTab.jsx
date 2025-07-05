import React from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime, getVolunteerButtonState } from '../../helpers/workerTabs.helpers';

const AllEventsTab = ({ allEvents, loading, error, handleVolunteerForEvent, user }) => {
  function renderEventCard(event) {
    const location = formatEventLocation(event);
    const { date, time } = formatEventDateTime(event);
    const buttonState = getVolunteerButtonState(event, user);
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
