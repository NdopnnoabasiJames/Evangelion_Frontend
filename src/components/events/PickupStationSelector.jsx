import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

const PickupStationSelector = ({ event, pickupStations, onAssignmentComplete, onStationsUpdate }) => {
  console.log('PickupStationSelector rendered with:', { event, pickupStations: pickupStations?.length });
  
  const { user } = useAuth();
  const [selectedStations, setSelectedStations] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { execute: assignStations, error: apiError } = useApi(null, { immediate: false });
  const handleStationToggle = (stationId) => {
    setSelectedStations(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleStationCreated = (newStation) => {
    // Refresh the pickup stations list
    if (onStationsUpdate) {
      onStationsUpdate();
    }
    setShowCreateModal(false);
  };const handleAssignment = async () => {
    console.log('=== PICKUP STATION ASSIGNMENT STARTED ===');
    console.log('Selected stations:', selectedStations);
    console.log('Event:', event);
    
    if (selectedStations.length === 0) {
      console.log('No stations selected, showing error');
      setError('Please select at least one pickup station');
      return;
    }

    console.log('Setting assigning to true');
    setAssigning(true);
    setError(null);

    try {
      // Format the pickup stations for the backend API
      const pickupStationsData = selectedStations.map(stationId => ({
        pickupStationId: stationId,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
        maxCapacity: 50, // Default capacity
        notes: ''
      }));

      console.log('Attempting to assign pickup stations:', {
        url: API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS,
        method: 'POST',
        eventId: event._id,
        pickupStationsData
      });

      const result = await assignStations(API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS, {
        method: 'POST',
        body: { 
          eventId: event._id,
          pickupStations: pickupStationsData 
        }
      });

      console.log('API call completed. Result:', result);
      console.log('API Error:', apiError);

      if (result) {
        console.log('Assignment successful:', result);
        onAssignmentComplete();
      } else {
        console.log('No result returned from API call');
        if (apiError) {
          console.error('Assignment failed with API error:', apiError);
          setError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
        } else {
          console.error('Assignment failed - no result and no error');
          setError('Failed to assign pickup stations. Please try again.');
        }
      }
    } catch (error) {
      console.error('Exception in handleAssignment:', error);
      setError(`Error: ${error.message}`);
    } finally {
      console.log('Setting assigning to false');
      setAssigning(false);
      console.log('=== PICKUP STATION ASSIGNMENT ENDED ===');
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="mb-3">
        <h6>Assigning to: {event.name}</h6>
        <small className="text-muted">Select pickup stations for this event</small>
      </div>      <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
          pickupStations.map(station => (
            <div key={station._id} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={`station-${station._id}`}
                checked={selectedStations.includes(station._id)}
                onChange={() => handleStationToggle(station._id)}
              />
              <label className="form-check-label" htmlFor={`station-${station._id}`}>
                <div>
                  <strong>{station.location}</strong>
                  <div className="small text-muted">
                    <i className="bi bi-geo-alt me-1"></i>
                    {station.zoneId?.name || 'Unknown Zone'}
                  </div>
                  {(station.defaultCapacity || station.capacity) && (
                    <div className="small text-muted">
                      <i className="bi bi-people me-1"></i>
                      Capacity: {station.defaultCapacity || station.capacity}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          {selectedStations.length} station(s) selected
        </small>        <button 
          className="btn btn-primary"
          onClick={() => {
            console.log('Button clicked!');
            handleAssignment();
          }}
          disabled={assigning || selectedStations.length === 0}
        >
          {assigning ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Assigning...
            </>
          ) : (
            'Assign Pickup Stations'
          )}
        </button>
      </div>
    </>
  );
}


export default PickupStationSelector;
