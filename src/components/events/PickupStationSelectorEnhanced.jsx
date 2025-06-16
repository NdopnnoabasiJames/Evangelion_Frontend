import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

// Create Pickup Station Modal Component
const CreatePickupStationModal = ({ show, onHide, onStationCreated, userZone }) => {  const [formData, setFormData] = useState({
    location: '',
    capacity: '',
    departureTime: '08:00',
    contactPhone: '',
    contactEmail: '',
    facilities: '',
    notes: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const { execute: createStation } = useApi(null, { immediate: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {      const createDto = {
        location: formData.location.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        departureTime: formData.departureTime,
        contactInfo: {
          phone: formData.contactPhone,
          email: formData.contactEmail
        },
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f),
        notes: formData.notes
      };// Extract zone ID properly - handle both string and object formats      const zoneId = typeof userZone === 'string' ? userZone : (userZone?._id || userZone?.id);
      
      if (!zoneId) {
        throw new Error('Zone ID not found. Please ensure you are logged in as a zonal admin.');
      }
      
      const result = await createStation(`/api/pickup-stations/zone/${zoneId}/create`, {
        method: 'POST',
        body: createDto
      });

      if (result) {
        onStationCreated(result);        // Reset form
        setFormData({
          location: '',
          capacity: '',
          departureTime: '08:00',
          contactPhone: '',
          contactEmail: '',
          facilities: '',
          notes: ''
        });
        onHide();
      }
    } catch (error) {
      setError(error.message || 'Failed to create pickup station');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle me-2"></i>
              Create New Pickup Station
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-1"></i>
                    Location Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Central Bus Park, Mall Entrance"
                    required
                  />
                  <div className="form-text">Enter a descriptive name for the pickup location</div>
                </div>                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    <i className="bi bi-people me-1"></i>
                    Default Capacity
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="200"
                    placeholder="Optional"
                  />
                  <div className="form-text">Leave empty if not applicable</div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-clock me-1"></i>
                    Default Departure Time
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-telephone me-1"></i>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="e.g., +234 800 123 4567"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-envelope me-1"></i>
                  Contact Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="e.g., pickup@church.org"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-building me-1"></i>
                  Available Facilities
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="facilities"
                  value={formData.facilities}
                  onChange={handleChange}
                  placeholder="e.g., Restrooms, Parking, Waiting Area (comma-separated)"
                />
                <div className="form-text">Enter facilities available at this location (optional)</div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-chat-text me-1"></i>
                  Additional Notes
                </label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Any additional information about this pickup station..."
                ></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating || !formData.location.trim()}>
                {creating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-2"></i>
                    Create Pickup Station
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PickupStationSelectorEnhanced = ({ event, pickupStations, onAssignmentComplete, onStationsUpdate }) => {
  const { user } = useAuth();const [selectedStations, setSelectedStations] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { execute: assignStations, error: apiError } = useApi(null, { immediate: false });
  const { execute: unassignStation } = useApi(null, { immediate: false });
  // Check if a pickup station is already assigned to this event
  const isStationAssigned = (stationId) => {
    return event.pickupStations?.some(ps => ps.pickupStationId === stationId);
  };

  // Get assigned pickup station details
  const getAssignedStationDetails = (stationId) => {
    return event.pickupStations?.find(ps => ps.pickupStationId === stationId);
  };
  const handleStationToggle = (stationId) => {
    console.log('🔄 handleStationToggle called with stationId:', stationId);
    console.log('📝 Current selectedStations before toggle:', selectedStations);
    
    // Don't allow toggling if station is already assigned
    if (isStationAssigned(stationId)) {
      console.log('❌ Station is already assigned, ignoring toggle');
      return;
    }
    
    setSelectedStations(prev => {
      const newSelection = prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId];
      console.log('✅ New selectedStations after toggle:', newSelection);
      return newSelection;
    });
  };
  const handleStationCreated = (newStation) => {
    // Refresh the pickup stations list
    if (onStationsUpdate) {
      onStationsUpdate();
    }
    setShowCreateModal(false);
  };

  const handleUnassignStation = async (stationId) => {
    try {
      setError(null);
      setSuccess(null);

      const result = await unassignStation('/api/events/remove-pickup-station-assignment', {
        method: 'DELETE',
        body: {
          eventId: event._id,
          pickupStationId: stationId
        }
      });

      if (!apiError) {
        setSuccess('Pickup station unassigned successfully!');
        // Update event in parent component
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      } else {
        setError('Failed to unassign pickup station');
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
  };
  const handleAssignment = async () => {
    if (selectedStations.length === 0) {
      setError('Please select at least one pickup station');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);try {
      // Format the pickup stations for the backend API using actual station data
      const pickupStationsData = selectedStations.map(stationId => {
        const station = pickupStations.find(s => s._id === stationId);
        if (!station) {
          throw new Error(`Station with ID ${stationId} not found`);
        }
        
        // Use the actual station data - no hard-coded values
        const assignmentData = {
          pickupStationId: stationId
        };

        // Only include fields that have actual values from the station
        if (station.departureTime) {
          // Use the station's default departure time, but set it for the event date
          const eventDate = new Date(event.date);
          const [hours, minutes] = station.departureTime.split(':');
          eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          assignmentData.departureTime = eventDate.toISOString();
        }        if (station.capacity || station.defaultCapacity) {
          assignmentData.maxCapacity = station.capacity || station.defaultCapacity;
          console.log('📊 Setting maxCapacity:', assignmentData.maxCapacity, 'from station:', {
            capacity: station.capacity,
            defaultCapacity: station.defaultCapacity
          });
        }

        if (station.notes) {
          assignmentData.notes = station.notes;
        }        return assignmentData;
      });

      const result = await assignStations(API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS, {
        method: 'POST',
        body: { 
          eventId: event._id,
          pickupStations: pickupStationsData        }
      });      // Check if there was an API error first
      if (apiError) {
        setError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
        return;
      }

      // If no error, consider it successful (even if result is null/undefined)
      setSuccess('Pickup stations assigned successfully! The event has been published.');
      setSelectedStations([]); // Clear selection
      
      // Call completion callback
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  return (    <>
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}

      <div className="mb-3">
        <h6>Assigning to: {event.name}</h6>
        <small className="text-muted">Select pickup stations for this event</small>
      </div>

      <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {pickupStations.length === 0 ? (
          <div className="text-center py-4">
            <div className="mb-3">
              <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
            </div>
            <h6 className="text-muted">No Pickup Stations Found</h6>
            <p className="text-muted small mb-3">
              No pickup stations have been created in your zone yet. Create your first pickup station to assign to events.
            </p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Pickup Station
            </button>
          </div>        ) : (
          pickupStations.map(station => {
            const isAssigned = isStationAssigned(station._id);
            const assignedDetails = getAssignedStationDetails(station._id);
            
            return (              <div key={station._id} className="mb-2">
                <div 
                  className={`card ${
                    isAssigned 
                      ? 'border-secondary bg-light' 
                      : selectedStations.includes(station._id) 
                        ? 'border-primary bg-primary bg-opacity-10' 
                        : 'border-secondary'
                  }`}
                  style={{ 
                    cursor: isAssigned ? 'not-allowed' : 'default',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className={`mb-1 ${isAssigned ? 'text-muted' : ''}`}>
                          {station.location}
                        </h6>
                        <div className="small text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {station.zoneId?.name || 'Unknown Zone'}
                        </div>                        {(station.capacity || station.defaultCapacity) && (
                          <div className="small text-muted">
                            <i className="bi bi-people me-1"></i>
                            Capacity: {station.capacity || station.defaultCapacity}
                          </div>
                        )}
                        {isAssigned && assignedDetails && (
                          <div className="small text-info">
                            <i className="bi bi-clock me-1"></i>
                            Departure: {new Date(assignedDetails.departureTime).toLocaleString()}
                            {assignedDetails.maxCapacity && ` | Max: ${assignedDetails.maxCapacity}`}
                          </div>
                        )}
                      </div>
                      <div>
                        {isAssigned ? (
                          <div className="text-center">
                            <i className="bi bi-check-circle-fill text-success"></i>
                            <small className="d-block text-success">Assigned</small>
                            <button
                              className="btn btn-sm btn-outline-danger mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignStation(station._id);
                              }}
                              title="Remove assignment"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>                        ) : (
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedStations.includes(station._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                console.log('📋 Checkbox onChange triggered for station:', station._id);
                                console.log('📋 Current checked state:', e.target.checked);
                                console.log('📋 Current selectedStations:', selectedStations);
                                handleStationToggle(station._id);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('📋 Checkbox onClick triggered for station:', station._id);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pickupStations.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">
              {selectedStations.length} station(s) selected
            </small>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add New Station
            </button>
          </div>

          <button 
            className="btn btn-primary w-100" 
            onClick={handleAssignment}
            disabled={assigning || selectedStations.length === 0}
          >
            {assigning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Assigning...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-2"></i>
                Assign Selected Stations
              </>
            )}
          </button>
        </>
      )}

      {/* Create Pickup Station Modal */}      <CreatePickupStationModal 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onStationCreated={handleStationCreated}
        userZone={user?.zone}
      />
    </>
  );
};

export default PickupStationSelectorEnhanced;
