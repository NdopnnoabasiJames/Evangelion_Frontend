import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

const PickupStationAssignmentModal = ({ event, onClose, onComplete }) => {
  const { user } = useAuth();
  const [selectedStations, setSelectedStations] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { execute: fetchStations } = useApi(null, { immediate: false });
  const { execute: assignStations } = useApi(null, { immediate: false });
  const { execute: unassignStation } = useApi(null, { immediate: false });
  const { execute: createStation } = useApi(null, { immediate: false });

  useEffect(() => {
    fetchAvailableStations();
  }, [event._id]);

  const fetchAvailableStations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchStations('/api/events/available-pickup-stations');
      setAvailableStations(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load pickup stations');
    } finally {
      setLoading(false);
    }
  };

  // Check if a pickup station is already assigned to this event
  const isStationAssigned = (stationId) => {
    return event.pickupStations?.some(ps => ps.pickupStationId === stationId);
  };

  // Get assigned pickup station details
  const getAssignedStationDetails = (stationId) => {
    return event.pickupStations?.find(ps => ps.pickupStationId === stationId);
  };

  const handleStationToggle = (stationId) => {
    // Don't allow toggling if station is already assigned
    if (isStationAssigned(stationId)) return;

    setSelectedStations(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleUnassignStation = async (stationId) => {
    try {
      setError(null);

      await unassignStation('/api/events/remove-pickup-station-assignment', {
        method: 'DELETE',
        body: {
          eventId: event._id,
          pickupStationId: stationId
        }
      });

      // Show success notification
      if (window.showNotification) {
        window.showNotification('Pickup station unassigned successfully!', 'success');
      }

      // Refresh and call completion callback
      onComplete();
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
  };

  const handleAssignStations = async () => {
    if (selectedStations.length === 0) {
      setError('Please select at least one pickup station');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Format the pickup stations for the backend API
      const pickupStationsData = selectedStations.map(stationId => {
        const station = availableStations.find(s => s._id === stationId);
        if (!station) {
          throw new Error(`Station with ID ${stationId} not found`);
        }
        
        const assignmentData = {
          pickupStationId: stationId
        };

        // Add station details if available
        if (station.departureTime) {
          const eventDate = new Date(event.date);
          const [hours, minutes] = station.departureTime.split(':');
          eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          assignmentData.departureTime = eventDate.toISOString();
        }

        if (station.capacity || station.defaultCapacity) {
          assignmentData.maxCapacity = station.capacity || station.defaultCapacity;
        }

        if (station.notes) {
          assignmentData.notes = station.notes;
        }

        return assignmentData;
      });

      await assignStations(API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS, {
        method: 'POST',
        body: { 
          eventId: event._id,
          pickupStations: pickupStationsData
        }
      });

      // Show success notification
      if (window.showNotification) {
        window.showNotification(
          `Successfully assigned ${selectedStations.length} pickup station${selectedStations.length !== 1 ? 's' : ''} to "${event.name}"!`,
          'success'
        );
      }

      onComplete();
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to assign pickup stations');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStation = async (formData) => {
    try {
      const zoneId = typeof user.zone === 'string' ? user.zone : (user.zone?._id || user.zone?.id);
      
      if (!zoneId) {
        throw new Error('Zone ID not found');
      }

      const createDto = {
        location: formData.location.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        departureTime: formData.departureTime,
        contactInfo: {
          phone: formData.contactPhone,
          email: formData.contactEmail
        },
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(f => f),
        notes: formData.notes
      };

      await createStation(`/api/pickup-stations/zone/${zoneId}/create`, {
        method: 'POST',
        body: createDto
      });

      setShowCreateModal(false);
      fetchAvailableStations(); // Refresh the list
    } catch (error) {
      throw error;
    }
  };

  // Get available stations (not yet assigned)
  const getAvailableStations = () => {
    return availableStations.filter(station => !isStationAssigned(station._id));
  };

  // Get assigned stations
  const getAssignedStations = () => {
    return availableStations.filter(station => isStationAssigned(station._id));
  };

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-geo-alt me-2"></i>
                Assign Pickup Stations to "{event.name}"
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3">
                    <h6 className="mb-2">
                      <i className="bi bi-list-ul me-2"></i>
                      Available Pickup Stations
                      <small className="text-muted ms-2">
                        ({getAvailableStations().length} available, {getAssignedStations().length} assigned)
                      </small>
                    </h6>
                  </div>
                  
                  {availableStations.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
                      <h6 className="text-muted mt-3">No Pickup Stations Found</h6>
                      <p className="text-muted">No pickup stations have been created in your zone yet.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Create Pickup Station
                      </button>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {availableStations.map(station => {
                        const isAssigned = isStationAssigned(station._id);
                        const assignedDetails = getAssignedStationDetails(station._id);
                        
                        return (
                          <div key={station._id} className="col-md-6">
                            <div 
                              className={`card ${
                                isAssigned 
                                  ? 'border-secondary bg-light' 
                                  : selectedStations.includes(station._id) 
                                    ? 'border-primary bg-primary bg-opacity-10 cursor-pointer' 
                                    : 'border-success cursor-pointer'
                              }`}
                              onClick={() => !isAssigned && handleStationToggle(station._id)}
                              style={{ 
                                cursor: isAssigned ? 'default' : 'pointer',
                                opacity: isAssigned ? '0.7' : '1',
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
                                    </div>
                                    {(station.capacity || station.defaultCapacity) && (
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
                                        <small className="d-block text-success">Assigned </small>
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
                                      </div>
                                    ) : (
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={selectedStations.includes(station._id)}
                                          onChange={() => handleStationToggle(station._id)}
                                        />
                                      </div>
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
                </div>
              )}
            </div>
              
            <div className="modal-footer">
              <div className="me-auto">
                <div className="d-flex flex-column">
                  <small className="text-muted">
                    {selectedStations.length} station{selectedStations.length !== 1 ? 's' : ''} selected • {getAvailableStations().length} available
                  </small>
                  {getAssignedStations().length > 0 && (
                    <small className="text-success">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      {getAssignedStations().length} already assigned
                    </small>
                  )}
                </div>
              </div>
              
              {availableStations.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Station
                </button>
              )}
              
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleAssignStations}
                disabled={submitting || selectedStations.length === 0}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>
                    Assign {selectedStations.length} Station{selectedStations.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Pickup Station Modal */}
      {showCreateModal && (
        <CreatePickupStationModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onStationCreated={handleCreateStation}
          userZone={user?.zone}
        />
      )}
    </>
  );
};

// Create Pickup Station Modal Component (reused from existing)
const CreatePickupStationModal = ({ show, onHide, onStationCreated, userZone }) => {
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await onStationCreated(formData);
      
      // Reset form
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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
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
                </div>

                <div className="col-md-4 mb-3">
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
                    Create Station
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

export default PickupStationAssignmentModal;
