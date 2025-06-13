import React, { useState } from 'react';
import { EmptyState } from '../common/Loading';
import SelectionModal from './SelectionModal';

const EventDelegation = ({ events, userRole, onDelegationComplete }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  if (!events || events.length === 0) {
    return (
      <EmptyState 
        icon="bi-check-circle"
        title="No Events Pending Delegation"
        description="All events have been properly delegated. New events will appear here when they need your attention."
      />
    );
  }

  const handleSelectForDelegation = (event) => {
    setSelectedEvent(event);
    setShowSelectionModal(true);
  };
  return (
    <>      <div className="row g-4">
        {(Array.isArray(events) ? events : Array.isArray(events?.data) ? events.data : []).map((event) => (
          <div key={event._id} className="col-12">
            <div className="card border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{event.name}</h5>
                    <small className="text-muted">
                      Created by {event.createdBy?.name || 'Unknown'} • {new Date(event.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <button 
                    className="btn btn-warning"
                    onClick={() => handleSelectForDelegation(event)}
                  >
                    <i className="bi bi-arrow-down-square me-2"></i>
                    {userRole === 'state_admin' ? 'Select Branches' : 'Select Zones'}
                  </button>
                </div>
              </div>              <div className="card-body">
                <p className="text-muted mb-2">{event.description}</p>
                
                {/* Delegation Status */}
                <div className="mb-3">
                  {userRole === 'state_admin' && (
                    <div className="d-flex flex-wrap gap-2">                      <span className="badge bg-primary">
                        <i className="bi bi-building me-1"></i>
                        {event.availableBranches?.length > 0 
                          ? `${event.availableBranches.map(branch => 
                              typeof branch === 'object' ? branch.name : branch
                            ).join(', ')} delegated`
                          : 'No branches delegated yet'
                        }
                      </span>
                      {event.availableStates?.length > 0 && (
                        <span className="badge bg-info">
                          <i className="bi bi-map me-1"></i>
                          Available in {event.availableStates.length} State{event.availableStates.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {userRole === 'branch_admin' && (
                    <div className="d-flex flex-wrap gap-2">                      <span className="badge bg-primary">
                        <i className="bi bi-geo-alt me-1"></i>
                        {event.availableZones?.length > 0 
                          ? `${event.availableZones.map(zone => 
                              typeof zone === 'object' ? zone.name : zone
                            ).join(', ')} delegated`
                          : 'No zones delegated yet'
                        }
                      </span>
                      {event.availableBranches?.length > 0 && (
                        <span className="badge bg-info">
                          <i className="bi bi-building me-1"></i>
                          Available in {event.availableBranches.length} Branch{event.availableBranches.length !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      {new Date(event.date).toLocaleDateString()}
                    </small>
                  </div>                  <div className="col-md-6">
                    <small className="text-muted">
                      <i className="bi bi-geo-alt me-1"></i>
                      {event.creatorLevel === 'super_admin' && event.availableStates?.length > 0
                        ? event.availableStates.length === 1 
                          ? event.availableStates[0]?.name || `${event.availableStates.length} state selected`
                          : event.availableStates.length <= 6
                          ? event.availableStates.map(state => state?.name).filter(Boolean).join(', ')
                          : `${event.availableStates.map(state => state?.name).filter(Boolean).slice(0, 3).join(', ')} and ${event.availableStates.length - 3} more states`
                        : event.location || 'Location TBD'
                      }
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      {showSelectionModal && (
        <SelectionModal
          event={selectedEvent}
          userRole={userRole}
          onClose={() => {
            setShowSelectionModal(false);
            setSelectedEvent(null);
          }}
          onComplete={onDelegationComplete}
        />
      )}
    </>
  );
};

export default EventDelegation;
