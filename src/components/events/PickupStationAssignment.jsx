import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { EmptyState } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';
import PickupStationSelector from './PickupStationSelector';

const PickupStationAssignment = ({ zonalAdminId, onAssignmentComplete }) => {
  const [eventsForAssignment, setEventsForAssignment] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pickupStations, setPickupStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { execute: fetchEvents } = useApi(null, { immediate: false });
  const { execute: fetchStations } = useApi(null, { immediate: false });

  useEffect(() => {
    fetchEventsForAssignment();
    fetchZonePickupStations();
  }, []);

  const fetchEventsForAssignment = async () => {
    try {
      const events = await fetchEvents('/api/events/for-pickup-assignment');
      setEventsForAssignment(events);
    } catch (error) {
      console.error('Failed to fetch events for assignment:', error);
    }
  };

  const fetchZonePickupStations = async () => {
    try {
      const stations = await fetchStations(API_ENDPOINTS.PICKUP_STATIONS.ZONE_STATIONS);
      setPickupStations(stations);
    } catch (error) {
      console.error('Failed to fetch pickup stations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-calendar-event me-2"></i>
              Events Needing Pickup Assignment
            </h5>
          </div>
          <div className="card-body">
            {eventsForAssignment.length === 0 ? (
              <EmptyState 
                icon="bi-check-circle"
                title="No Events Pending"
                description="All events have pickup stations assigned."
                size="sm"
              />
            ) : (
              <div className="list-group list-group-flush">
                {eventsForAssignment.map(event => (
                  <div 
                    key={event._id}
                    className={`list-group-item list-group-item-action ${selectedEvent?._id === event._id ? 'active' : ''}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{event.name}</h6>
                      <small>{new Date(event.date).toLocaleDateString()}</small>
                    </div>
                    <p className="mb-1 text-truncate">{event.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-geo-alt me-2"></i>
              Available Pickup Stations
            </h5>
          </div>
          <div className="card-body">
            {selectedEvent ? (
              <PickupStationSelector 
                event={selectedEvent}
                pickupStations={pickupStations}
                onAssignmentComplete={onAssignmentComplete}
              />
            ) : (
              <div className="text-center text-muted py-4">
                <i className="bi bi-arrow-left-circle fs-1 mb-3"></i>
                <p>Select an event to assign pickup stations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupStationAssignment;
