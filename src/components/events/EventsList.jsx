import React from 'react';
import { StatusBadge } from '../../utils/statusUtils.jsx';
import { ErrorDisplay, EmptyState } from '../common/Loading';

const EventsList = ({ events, loading, error, canEdit, onRefresh, onCreateEvent }) => {
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRefresh}
        title="Failed to load events"
      />
    );
  }  if (!Array.isArray(events) || events.length === 0) {
    return (
      <EmptyState 
        icon="bi-calendar-event"
        title="No Events Found"
        description="There are no events available at the moment. Create your first event to get started."
        action={onCreateEvent && (
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
    <div className="row g-4">
      {events.map((event) => (
        <div key={event._id} className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0 card-hover-lift">
            <div className="card-header bg-white border-0 pb-0">
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
            
            <div className="card-body pt-2">
              <div className="mb-2">
                <i className="bi bi-calendar-event me-2 text-muted"></i>
                <small className="text-muted">
                  {new Date(event.date).toLocaleDateString()}
                </small>
              </div>
              
              <div className="mb-2">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small className="text-muted text-truncate d-block">
                  {event.location || 'Location TBD'}
                </small>
              </div>
              
              {event.description && (
                <p className="card-text text-muted small mb-3" style={{ 
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {event.description}
                </p>
              )}
              
              {/* Delegation Progress for Super Admin Events */}
              {event.creatorLevel === 'super_admin' && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Delegation Progress:</small>
                  <div className="d-flex gap-2">
                    <span className={`badge ${event.availableBranches?.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                      Branches {event.availableBranches?.length > 0 ? '✓' : '○'}
                    </span>
                    <span className={`badge ${event.availableZones?.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                      Zones {event.availableZones?.length > 0 ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="d-flex justify-content-between align-items-center mt-auto">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  {event.participantCount || 0}
                  <span className="d-none d-sm-inline"> participants</span>
                </small>
                
                {canEdit && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    aria-label={`Edit ${event.name}`}
                  >
                    <i className="bi bi-pencil"></i>
                    <span className="d-none d-lg-inline ms-1">Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsList;
