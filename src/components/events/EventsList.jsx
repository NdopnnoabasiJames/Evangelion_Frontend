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
  }if (!Array.isArray(events) || events.length === 0) {
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

  return (    <div className="row g-4">
      {events.map((event) => (
        <div key={event._id} className="col-12 col-sm-6 col-lg-4">
          <div className="card h-100 border border-primary border-opacity-10 card-hover-lift event-card">
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
            
            <div className="card-body pt-2">
              <div className="mb-2">
                <i className="bi bi-calendar-event me-2 text-muted"></i>
                <small className="text-muted">
                  {new Date(event.date).toLocaleDateString()}
                </small>
              </div>              <div className="mb-2">
                <i className="bi bi-geo-alt me-2 text-muted"></i>                <small className="text-muted text-truncate d-block">
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
              
              {/* Delegation Progress for Super Admin and Branch Pastor Events */}
              {(event.creatorLevel === 'super_admin' || event.creatorLevel === 'branch_admin') && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    {event.creatorLevel === 'super_admin' ? 'Delegation Progress:' : 'Zone Assignment:'}
                  </small>
                  <div className="d-flex gap-2">
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
