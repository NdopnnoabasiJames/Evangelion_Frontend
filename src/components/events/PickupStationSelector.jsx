import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const PickupStationSelector = ({ event, pickupStations, onAssignmentComplete }) => {
  const [selectedStations, setSelectedStations] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  const { execute: assignStations } = useApi(null, { immediate: false });

  const handleStationToggle = (stationId) => {
    setSelectedStations(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleAssignment = async () => {
    if (selectedStations.length === 0) {
      setError('Please select at least one pickup station');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await assignStations(`${API_ENDPOINTS.EVENTS.ASSIGN_PICKUP_STATIONS}/${event._id}/assign-pickup-stations`, {
        method: 'PATCH',
        body: { pickupStations: selectedStations }
      });

      onAssignmentComplete();
    } catch (error) {
      setError(error.message);
    } finally {
      setAssigning(false);
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
      </div>

      <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {pickupStations.map(station => (
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
                <strong>{station.name}</strong>
                <div className="small text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  {station.address}
                </div>
                {station.capacity && (
                  <div className="small text-muted">
                    <i className="bi bi-people me-1"></i>
                    Capacity: {station.capacity}
                  </div>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          {selectedStations.length} station(s) selected
        </small>
        <button 
          className="btn btn-primary"
          onClick={handleAssignment}
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
};

export default PickupStationSelector;
