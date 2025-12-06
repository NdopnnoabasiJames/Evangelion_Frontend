import React, { useState, useEffect } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { formatEventLocation, formatEventDateTime } from '../../helpers/workerTabs.helpers';
import { getRegistrationTypeBadge } from '../../helpers/guests.helpers.jsx';
import EditGuestModal from './EditGuestModal';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { isEventUpcoming } from '../../utils/dateUtils';

const RegisteredGuestsTab = ({ registeredGuests, loading, error, setShowGuestModal, userRole, onGuestUpdate }) => {
  const [editingGuest, setEditingGuest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('upcoming'); // 'upcoming', 'expired', 'all'
  const [workerEvents, setWorkerEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Helper function to check if event is upcoming (not expired) - using utility function

  // Load worker's events for filter dropdown
  useEffect(() => {
    const loadWorkerEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.WORKERS.MY_EVENTS);
        const events = Array.isArray(response.data) ? response.data : response.data.data || [];
        setWorkerEvents(events);
      } catch (err) {
        console.error('Error loading worker events for filter:', err);
        setWorkerEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadWorkerEvents();
  }, []);

  // Filter registered guests based on selected event and event status
  const filteredGuests = registeredGuests.filter(guest => {
    // First filter by specific event (if selected)
    const matchesEventFilter = selectedEventFilter === 'all' || guest.event?._id === selectedEventFilter;
    
    // Then filter by event status (upcoming/expired)
    let matchesStatusFilter = true;
    if (eventStatusFilter === 'upcoming') {
      matchesStatusFilter = isEventUpcoming(guest.event);
    } else if (eventStatusFilter === 'expired') {
      matchesStatusFilter = !isEventUpcoming(guest.event);
    }
    // 'all' status doesn't filter
    
    return matchesEventFilter && matchesStatusFilter;
  });

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setEditingGuest(null);
    setShowEditModal(false);
  };

  const handleGuestUpdated = (updatedGuest) => {
    if (onGuestUpdate) {
      onGuestUpdate(updatedGuest);
    }
    handleCloseEditModal();
  };

  return (
  <div>
    <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
      <div className="d-flex flex-column">
        <h5 className="mb-0">My Registered Guests</h5>
        {!loading && Array.isArray(registeredGuests) && (
          <small className="text-muted mt-1">
            Showing {filteredGuests.length} of {registeredGuests.length} guest{registeredGuests.length !== 1 ? 's' : ''}
            {eventStatusFilter !== 'all' && ` (${eventStatusFilter} events)`}
            {selectedEventFilter !== 'all' && ' for selected event'}
          </small>
        )}
      </div>
      <div className="d-flex gap-3 align-items-center flex-wrap">
        {/* Event Status Filter Buttons */}
        <div className="btn-group flex-wrap" role="group">
          <button
            type="button"
            className={`btn btn-sm ${eventStatusFilter === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setEventStatusFilter('upcoming')}
          >
            <i className="bi bi-calendar-check me-1"></i>
            Upcoming Events
          </button>
          <button
            type="button"
            className={`btn btn-sm ${eventStatusFilter === 'expired' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setEventStatusFilter('expired')}
          >
            <i className="bi bi-calendar-x me-1"></i>
            Expired Events
          </button>
          <button
            type="button"
            className={`btn btn-sm ${eventStatusFilter === 'all' ? 'btn-info' : 'btn-outline-info'}`}
            onClick={() => setEventStatusFilter('all')}
          >
            <i className="bi bi-calendar3 me-1"></i>
            All Events
          </button>
        </div>

        {/* Event Filter Dropdown */}
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="eventFilter" className="form-label mb-0 text-muted small">
            Specific Event:
          </label>
          <select
            id="eventFilter"
            className="form-select form-select-sm"
            style={{ minWidth: '180px' }}
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            disabled={eventsLoading}
          >
            <option value="all">All Events</option>
            {workerEvents.map(event => (
              <option key={event._id} value={event._id}>
                {event.name || event.title}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowGuestModal(true)}
        >
          <i className="bi bi-person-plus me-2"></i>
          Register New Guest
        </button>
      </div>
    </div>
    {loading ? (
      <LoadingCard />
    ) : error ? (
      <ErrorDisplay message={error} />
    ) : !Array.isArray(registeredGuests) ? (
      <ErrorDisplay message="Error loading guests data" />
    ) : filteredGuests.length === 0 ? (
      <EmptyState 
        message={selectedEventFilter === 'all' 
          ? "No guests registered yet" 
          : "No guests found for the selected event"
        } 
      />
    ) : (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ minWidth: '180px' }}>Guest Info</th>
                  <th scope="col" style={{ minWidth: '140px' }}>Contact</th>
                  <th scope="col" style={{ minWidth: '120px' }}>Type</th>
                  <th scope="col" style={{ minWidth: '220px' }}>Event Details</th>
                  <th scope="col" style={{ minWidth: '150px' }}>Comments</th>
                  <th scope="col" style={{ minWidth: '160px' }}>Date & Time</th>
                  <th scope="col" style={{ minWidth: '120px' }}>Status</th>
                  <th scope="col" style={{ minWidth: '140px' }}>Registered</th>
                  <th scope="col" style={{ minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map(guest => {
                  const eventLocation = guest.event ? formatEventLocation(guest.event) : 'No Event';
                  const eventDateTime = guest.event ? formatEventDateTime(guest.event) : { date: 'N/A', time: 'N/A' };
                  const registeredAt = guest.createdAt ? new Date(guest.createdAt) : null;
                  const isExpiredEvent = !isEventUpcoming(guest.event);
                  const canEdit = !guest.checkedIn && !isExpiredEvent;
                  
                  return (
                    <tr key={guest._id} className={isExpiredEvent ? 'table-secondary opacity-75' : ''}>
                      <td style={{ minWidth: '180px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-semibold text-truncate" style={{ maxWidth: '160px' }} title={guest.name}>
                            {guest.name}
                          </div>
                          <small className="text-muted text-truncate" style={{ maxWidth: '160px' }} title={guest.email}>
                            {guest.email}
                          </small>
                        </div>
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div className="fw-medium">{guest.phone}</div>
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        {getRegistrationTypeBadge(guest.registrationType)}
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-medium text-truncate d-flex align-items-center" style={{ maxWidth: '200px' }} title={guest.event?.name || guest.event?.title || 'N/A'}>
                            {guest.event?.name || guest.event?.title || 'N/A'}
                            {isExpiredEvent && (
                              <span className="badge bg-secondary ms-2" style={{ fontSize: '0.6em' }}>
                                Expired
                              </span>
                            )}
                          </div>
                          <small className="text-muted text-truncate" style={{ maxWidth: '200px' }} title={eventLocation}>
                            <i className="bi bi-geo-alt me-1"></i>{eventLocation}
                          </small>
                        </div>
                      </td>
                      <td className="text-muted" style={{ minWidth: '150px' }}>
                        <div className="text-truncate" style={{ maxWidth: '130px' }} title={guest.comments || '-'}>
                          {guest.comments || '-'}
                        </div>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div className="d-flex flex-column">
                          <div className="fw-medium">{eventDateTime.date}</div>
                          <small className="text-muted">{eventDateTime.time}</small>
                        </div>
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        <span className={`badge ${guest.isCheckedIn ? 'bg-success' : 'bg-warning'} px-2 py-1`}>
                          {guest.isCheckedIn ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div className="d-flex flex-column">
                          {registeredAt ? (
                            <>
                              <div className="fw-medium">{registeredAt.toLocaleDateString()}</div>
                              <small className="text-muted">
                                {registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            </>
                          ) : (
                            <small className="text-muted">Unknown</small>
                          )}
                        </div>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div className="d-flex gap-1">
                          <button
                            className={`btn btn-sm px-2 py-1 ${canEdit ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                            onClick={() => handleEditGuest(guest)}
                            title={isExpiredEvent ? 'Cannot edit - Event has expired' : guest.checkedIn ? 'Cannot edit - Guest checked in' : 'Edit Guest'}
                            disabled={!canEdit}
                          >
                            <i className={`bi ${canEdit ? 'bi-pencil-square' : 'bi-eye'}`}></i>
                          </button>
                          {(userRole === 'branch_admin' || userRole === 'zonal_admin') && (
                            <button
                              className="btn btn-sm btn-outline-success px-2 py-1"
                              onClick={() => window.open(`mailto:${guest.email}`, '_blank')}
                              title="Send Email"
                            >
                              <i className="bi bi-envelope"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    
    {/* Edit Guest Modal */}
    {showEditModal && editingGuest && (
      <EditGuestModal
        guest={editingGuest}
        show={showEditModal}
        onClose={handleCloseEditModal}
        onGuestUpdated={handleGuestUpdated}
      />
    )}
  </div>
);
};

export default RegisteredGuestsTab;
