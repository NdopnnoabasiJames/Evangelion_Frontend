import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay } from '../common/Loading';

const PickupStationManagement = () => {
  const { user } = useAuth();
  const [pickupStations, setPickupStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { execute: fetchStations } = useApi(null, { immediate: false });
  const { execute: createStation } = useApi(null, { immediate: false });
  const { execute: updateStation } = useApi(null, { immediate: false });
  const { execute: deleteStation } = useApi(null, { immediate: false });

  useEffect(() => {
    fetchPickupStations();
  }, []);

  const fetchPickupStations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stations for the zonal admin's zone
      const response = await fetchStations('/api/events/available-pickup-stations');
      setPickupStations(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load pickup stations');
    } finally {
      setLoading(false);
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
      fetchPickupStations(); // Refresh the list
      
      if (window.showNotification) {
        window.showNotification('Pickup station created successfully!', 'success');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (!window.confirm('Are you sure you want to delete this pickup station?')) {
      return;
    }

    try {
      await deleteStation(`/api/pickup-stations/${stationId}`, {
        method: 'DELETE'
      });

      fetchPickupStations(); // Refresh the list
      
      if (window.showNotification) {
        window.showNotification('Pickup station deleted successfully!', 'success');
      }
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`Failed to delete pickup station: ${error.message}`, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <LoadingCard height="200px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error}
        onRetry={fetchPickupStations}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Pickup Station Management</h4>
          <p className="text-muted mb-0">
            Manage pickup stations for {user?.zone?.name || 'your zone'}
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create New Station
        </button>
      </div>

      {/* Pickup Stations List */}
      {pickupStations.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Pickup Stations</h4>
            <p className="text-muted">
              No pickup stations have been created in your zone yet.<br/>
              Create your first pickup station to get started.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create Pickup Station
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {pickupStations.map(station => (
            <div key={station._id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-header bg-primary bg-opacity-10">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="bi bi-geo-alt me-2"></i>
                      {station.location}
                    </h6>
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <i className="bi bi-three-dots"></i>
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button className="dropdown-item">
                            <i className="bi bi-pencil me-2"></i>
                            Edit
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item text-danger"
                            onClick={() => handleDeleteStation(station._id)}
                          >
                            <i className="bi bi-trash me-2"></i>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="mb-3">
                    <div className="small text-muted mb-1">
                      <i className="bi bi-building me-1"></i>
                      Zone: {station.zoneId?.name || 'Unknown Zone'}
                    </div>
                    
                    {(station.capacity || station.defaultCapacity) && (
                      <div className="small text-muted mb-1">
                        <i className="bi bi-people me-1"></i>
                        Capacity: {station.capacity || station.defaultCapacity}
                      </div>
                    )}
                    
                    {station.departureTime && (
                      <div className="small text-muted mb-1">
                        <i className="bi bi-clock me-1"></i>
                        Default Departure: {station.departureTime}
                      </div>
                    )}
                  </div>

                  {station.contactInfo && (
                    <div className="mb-3">
                      <h6 className="small mb-1">Contact Information:</h6>
                      {station.contactInfo.phone && (
                        <div className="small text-muted">
                          <i className="bi bi-telephone me-1"></i>
                          {station.contactInfo.phone}
                        </div>
                      )}
                      {station.contactInfo.email && (
                        <div className="small text-muted">
                          <i className="bi bi-envelope me-1"></i>
                          {station.contactInfo.email}
                        </div>
                      )}
                    </div>
                  )}

                  {station.facilities && station.facilities.length > 0 && (
                    <div className="mb-3">
                      <h6 className="small mb-1">Facilities:</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {station.facilities.map((facility, index) => (
                          <span key={index} className="badge bg-secondary small">
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {station.notes && (
                    <div className="mb-3">
                      <h6 className="small mb-1">Notes:</h6>
                      <p className="small text-muted mb-0">{station.notes}</p>
                    </div>
                  )}

                  <div className="small text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    Created: {new Date(station.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Pickup Station Modal */}
      {showCreateModal && (
        <CreatePickupStationModal 
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onStationCreated={handleCreateStation}
          userZone={user?.zone}
        />
      )}
    </div>
  );
};

// Create Pickup Station Modal Component 
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

export default PickupStationManagement;
