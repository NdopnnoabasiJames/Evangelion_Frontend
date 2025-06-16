import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { EmptyState } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';
import PickupStationSelectorEnhanced from './PickupStationSelectorEnhanced';
import PickupStationsViewer from './PickupStationsViewer';
import { useAuth } from '../../hooks/useAuth';

const PickupStationAssignment = ({ zonalAdminId, userRole, onAssignmentComplete }) => {
  const { user } = useAuth();

  // If super admin, show the viewer component
  if (user?.role === 'super_admin') {
    return <PickupStationsViewer userRole={user.role} />;
  }

  // Rest of the component for zonal admins
  const [eventsForAssignment, setEventsForAssignment] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pickupStations, setPickupStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { execute: fetchEvents } = useApi(null, { immediate: false });
  const { execute: fetchStations } = useApi(null, { immediate: false });

  // Safety check: only zonal admins should access the assignment functionality
  if (user?.role !== 'zonal_admin') {
    return (
      <div className="alert alert-warning" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Pickup station assignment is only available for Zonal Admins.
      </div>
    );
  }

  useEffect(() => {
    fetchEventsForAssignment();
    fetchZonePickupStations();
  }, []);
  const fetchEventsForAssignment = async () => {
    try {
      setError(null);
      const events = await fetchEvents('/api/events/for-pickup-assignment');
      // Ensure we have an array
      const eventsArray = Array.isArray(events) ? events : (events?.data || []);
      setEventsForAssignment(eventsArray);
    } catch (error) {
      console.error('Failed to fetch events for assignment:', error);
      setError('Failed to load events for pickup assignment');
      setEventsForAssignment([]);
    }
  };
  const fetchZonePickupStations = async () => {
    try {
      const stations = await fetchStations('/api/events/available-pickup-stations');
      // Ensure we have an array
      const stationsArray = Array.isArray(stations) ? stations : (stations?.data || []);
      setPickupStations(stationsArray);
    } catch (error) {
      console.error('Failed to fetch pickup stations:', error);
      setPickupStations([]);
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

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
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
          </div>          <div className="card-body">
            {!Array.isArray(eventsForAssignment) || eventsForAssignment.length === 0 ? (
              <EmptyState 
                icon="bi-check-circle"
                title="No Events Pending"
                description="All events have pickup stations assigned."
                size="sm"
              />
            ) : (
              <div className="list-group list-group-flush">
                {eventsForAssignment.map(event => (                  <div 
                    key={event._id}
                    className={`list-group-item list-group-item-action ${selectedEvent?._id === event._id ? 'active' : ''}`}
                    onClick={() => {
                      console.log('Event selected:', event);
                      setSelectedEvent(event);
                    }}
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
          </div>          <div className="card-body">
            {selectedEvent ? (
              <>
                <div className="mb-2">
                  <small className="text-muted">Debug: Selected event: {selectedEvent.name}</small>
                  <br />
                  <small className="text-muted">Debug: Available stations: {pickupStations.length}</small>
                </div>                <PickupStationSelectorEnhanced 
                  event={selectedEvent}
                  pickupStations={pickupStations}
                  onAssignmentComplete={onAssignmentComplete}
                  onStationsUpdate={fetchZonePickupStations}
                />
              </>
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
