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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);

  const { execute: fetchStations } = useApi(null, { immediate: false });
  const { execute: assignStations } = useApi(null, { immediate: false });
  const { execute: unassignStation } = useApi(null, { immediate: false });
  const { execute: createStation } = useApi(null, { immediate: false });
  const { execute: updateStation } = useApi(null, { immediate: false });

  // Helper function to get the correct date for both single-day and multi-day events
  const getEventDate = (event) => {
    // For multi-day events, use startDate. For single-day events, use date
    const dateValue = event.eventType === 'multi-day' ? event.startDate : event.date;
    return dateValue ? new Date(dateValue) : null;
  };

  useEffect(() => {
    fetchAvailableStations();
  }, [event._id]);

  const fetchAvailableStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchStations('/api/events/available-pickup-stations');
      const stations = response?.data || response || [];
      setAvailableStations(stations);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load pickup stations');
    } finally {
      setLoading(false);
    }
  };

  // Check if a pickup station is already assigned to this event
  const isStationAssigned = (stationId) => {
    if (!event.pickupStations || event.pickupStations.length === 0) {
      return false;
    }
    
    const assigned = event.pickupStations.some(ps => {
      // Handle both populated object and direct string ID cases
      let psId;
      if (ps.pickupStationId && typeof ps.pickupStationId === 'object' && ps.pickupStationId._id) {
        psId = ps.pickupStationId._id.toString();
      } else {
        psId = ps.pickupStationId?.toString() || ps.pickupStationId;
      }
      
      const stId = stationId?.toString() || stationId;
      return psId === stId;
    });
    
    return assigned;
  };

  // Get assigned pickup station details
  const getAssignedStationDetails = (stationId) => {
    return event.pickupStations?.find(ps => {
      // Handle both populated object and direct string ID cases
      let psId;
      if (ps.pickupStationId && typeof ps.pickupStationId === 'object' && ps.pickupStationId._id) {
        psId = ps.pickupStationId._id.toString();
      } else {
        psId = ps.pickupStationId?.toString() || ps.pickupStationId;
      }
      
      const stId = stationId?.toString() || stationId;
      return psId === stId;
    });
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
          const eventDate = getEventDate(event);
          if (eventDate) {
            const [hours, minutes] = station.departureTime.split(':');
            const departureDateTime = new Date(eventDate);
            departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Check if the calculated departure time is in the future
            const now = new Date();
            if (departureDateTime > now) {
              // Use the calculated departure time if it's in the future
              assignmentData.departureTime = departureDateTime.toISOString();
            } else {
              // For past event dates or dates that would result in past departure times,
              // we need to set a future departure time. Use tomorrow at the same time.
              const futureDeparture = new Date();
              futureDeparture.setDate(futureDeparture.getDate() + 1);
              futureDeparture.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              assignmentData.departureTime = futureDeparture.toISOString();
              
              console.info(`Event date is in the past. Setting departure time to tomorrow at ${station.departureTime}`);
            }
          } else {
            // If we can't determine the event date, set departure time to tomorrow with the station's default time
            const [hours, minutes] = (station.departureTime || '08:00').split(':');
            const tomorrowDeparture = new Date();
            tomorrowDeparture.setDate(tomorrowDeparture.getDate() + 1);
            tomorrowDeparture.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            assignmentData.departureTime = tomorrowDeparture.toISOString();
            
            console.warn('Unable to determine event date. Setting departure time to tomorrow.');
          }
        }

        if (station.capacity || station.defaultCapacity) {
          assignmentData.maxCapacity = station.capacity || station.defaultCapacity;
        }

        if (station.notes) {
          assignmentData.notes = station.notes;
        }

        return assignmentData;
      });

      const result = await assignStations(API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS, {
        method: 'POST',
        body: { 
          eventId: event._id,
          pickupStations: pickupStationsData
        }
      });

      // Verify that the assignment was actually successful - check both direct and nested data structure
      if (result && (result.success || result.data?.success || result.pickupStations || result.data?.pickupStations || result.message?.includes('success') || result.data?.message?.includes('success'))) {
        // Show success notification
        if (window.showNotification) {
          window.showNotification(
            `Successfully assigned ${selectedStations.length} pickup station${selectedStations.length !== 1 ? 's' : ''} to "${event.name}"!`,
            'success'
          );
        }

        onComplete();
        onClose();
      } else {
        throw new Error('Assignment failed - no stations were saved. Please try again.');
      }
    } catch (error) {
      console.error('Assignment error:', error);
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

  const handleEditStation = async (station) => {
    // First, let's check the user's role and permissions
    const api = await import('../../services/api');
    
    try {
      const userInfo = await api.default.get('/api/pickup-stations/debug/user-info');
    } catch (error) {
      console.error('Error checking user info:', error);
    }
    
    setEditingStation(station);
    setShowEditModal(true);
  };

  const handleUpdateStation = async (formData) => {
    // Import API service directly to bypass useApi hook issues
    const api = await import('../../services/api');
    
    try {
      // Prepare comprehensive update data
      const updateDto = {
        location: formData.location.trim()
      };

      // Only add fields that have values
      if (formData.capacity && formData.capacity.trim()) {
        updateDto.capacity = parseInt(formData.capacity);
      }

      if (formData.departureTime) {
        updateDto.departureTime = formData.departureTime;
      }

      // Handle contact info
      if (formData.contactPhone || formData.contactEmail) {
        updateDto.contactInfo = {};
        if (formData.contactPhone) updateDto.contactInfo.phone = formData.contactPhone;
        if (formData.contactEmail) updateDto.contactInfo.email = formData.contactEmail;
      }

      // Handle facilities
      if (formData.facilities && formData.facilities.trim()) {
        updateDto.facilities = formData.facilities.split(',').map(f => f.trim()).filter(f => f);
      }

      // Handle notes
      if (formData.notes && formData.notes.trim()) {
        updateDto.notes = formData.notes.trim();
      }
      
      const response = await api.default.patch(`/api/pickup-stations/${editingStation._id}`, updateDto);
      // Show success notification
      if (window.showNotification) {
        window.showNotification('Pickup station updated successfully!', 'success');
      }

      setShowEditModal(false);
      setEditingStation(null);
      
      // Force refresh the list with a slight delay to ensure backend has processed the update
      setTimeout(async () => {
        await fetchAvailableStations();
      }, 500);
    } catch (error) {
      console.error('Error updating pickup station:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error headers:', error.response?.headers);
      console.error('Error config:', error.config);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update pickup station';
      throw new Error(errorMessage);
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
                              className={`card h-100 ${
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
                                transition: 'all 0.2s ease-in-out',
                                minHeight: '140px'
                              }}
                            >
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <h6 className={`mb-0 ${isAssigned ? 'text-muted' : ''}`}>
                                        {station.location}
                                      </h6>
                                      <button
                                        className="btn btn-sm btn-outline-secondary p-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditStation(station);
                                        }}
                                        title="Edit pickup station"
                                        style={{ fontSize: '0.75rem', lineHeight: 1 }}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    </div>
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
                                        {(station.capacity || station.defaultCapacity) && ` | Max: ${station.capacity || station.defaultCapacity}`}
                                      </div>
                                    )}
                                  </div>
                                  <div className="ms-2">
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

      {/* Edit Pickup Station Modal */}
      {showEditModal && editingStation && (
        <EditPickupStationModal 
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setEditingStation(null);
          }}
          onStationUpdated={handleUpdateStation}
          station={editingStation}
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

// Edit Pickup Station Modal Component
const EditPickupStationModal = ({ show, onHide, onStationUpdated, station, userZone }) => {
  const [formData, setFormData] = useState({
    location: '',
    capacity: '',
    departureTime: '08:00',
    contactPhone: '',
    contactEmail: '',
    facilities: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form data with station details when station changes
  useEffect(() => {
    if (station) {
      setFormData({
        location: station.location || '',
        capacity: station.capacity || station.defaultCapacity || '',
        departureTime: station.departureTime || '08:00',
        contactPhone: station.contactInfo?.phone || '',
        contactEmail: station.contactInfo?.email || '',
        facilities: Array.isArray(station.facilities) ? station.facilities.join(', ') : (station.facilities || ''),
        notes: station.notes || ''
      });
    }
  }, [station]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onStationUpdated(formData);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update pickup station');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-pencil me-2"></i>
              Edit Pickup Station
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
                    Station Location <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., University Road Junction"
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

              <div className="row">
                <div className="col-md-6 mb-3">
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
                    placeholder="e.g., station@church.org"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-wrench me-1"></i>
                    Facilities
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="facilities"
                    value={formData.facilities}
                    onChange={handleChange}
                    placeholder="e.g., Parking, Restrooms, Security"
                  />
                  <div className="form-text">Separate multiple facilities with commas</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-journal-text me-1"></i>
                  Notes
                </label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional information about this pickup station..."
                ></textarea>
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Zone:</strong> {userZone?.name || 'Current Zone'}
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>
                    Update Station
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
