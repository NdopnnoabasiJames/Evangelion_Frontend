import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/constants';

const GuestRegistrationModal = ({ onClose, onSuccess }) => {
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
    comments: '',
    transportPreference: '',
    pickupStation: ''
  });
  const [events, setEvents] = useState([]);
  const [pickupStations, setPickupStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPickupStations, setLoadingPickupStations] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKERS.MY_EVENTS}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (response.ok) {
          const eventsData = await response.json();
          const eventsArray = Array.isArray(eventsData) ? eventsData : eventsData.data || [];
          setEvents(eventsArray);
        }
      } catch {}
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const loadPickupStations = async () => {
      if (guestForm.transportPreference === 'church_bus' && guestForm.eventId) {
        setLoadingPickupStations(true);
        try {
          // Use event-specific pickup stations endpoint
          const eventPickupStationsUrl = `${API_BASE_URL}${API_ENDPOINTS.WORKERS.EVENT_PICKUP_STATIONS.replace(':eventId', guestForm.eventId)}`;
          
          const response = await fetch(eventPickupStationsUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          
          if (response.ok) {
            const stations = await response.json();
            
            // Handle the response - it should be an array of pickup stations
            let stationsArray = [];
            if (Array.isArray(stations)) {
              stationsArray = stations;
            } else if (stations && Array.isArray(stations.data)) {
              stationsArray = stations.data;
            } else if (stations && Array.isArray(stations.pickupStations)) {
              stationsArray = stations.pickupStations;
            }
            
            setPickupStations(stationsArray);
          } else {
            console.error('Failed to load pickup stations:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error loading pickup stations:', error);
        }
        setLoadingPickupStations(false);
      } else {
        // Clear pickup stations if not using church bus or no event selected
        setPickupStations([]);
      }
    };
    loadPickupStations();
  }, [guestForm.transportPreference, guestForm.eventId]);

  const handleGuestRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requestBody = {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        eventId: guestForm.eventId,
        comments: guestForm.comments,
        transportPreference: guestForm.transportPreference
      };
      if (guestForm.transportPreference === 'church_bus' && guestForm.pickupStation) {
        requestBody.pickupStation = guestForm.pickupStation;
      }
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKERS.BASE}/events/register-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        alert('Guest registered successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Failed to register guest: ${error.message}`);
      }
    } catch {
      alert('Failed to register guest');
    }
    setLoading(false);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Register New Guest</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleGuestRegistration}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    placeholder="+234 806 123 4567"
                    pattern="^\+?[\d\s\-\(\)]{10,15}$"
                    title="Please enter a valid phone number (10-15 digits, can include +, spaces, hyphens, parentheses)"
                    required
                  />
                  <div className="form-text">
                    📱 Include country code (e.g., +234 for Nigeria) for SMS notifications
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Event *</label>
                  <select
                    className="form-select"
                    value={guestForm.eventId}
                    onChange={(e) => setGuestForm({ ...guestForm, eventId: e.target.value })}
                    required
                  >
                    <option value="">Select an event</option>
                    {events.map(event => (
                      <option key={event._id} value={event._id}>
                        {event.name || event.title || 'Unnamed Event'} - {new Date(event.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Transport Preference Section */}
                <div className="col-12 mb-3">
                  <label className="form-label">Transport Preference <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={guestForm.transportPreference}
                    onChange={(e) => setGuestForm({...guestForm, transportPreference: e.target.value, pickupStation: ''})}
                    required
                  >
                    <option value="">Select transport option</option>
                    <option value="private">Private Transport</option>
                    <option value="church_bus">Church Bus</option>
                  </select>
                </div>
                {/* Pickup Station for Church Bus */}
                {guestForm.transportPreference === 'church_bus' && (
                  <div className="col-12 mb-3">
                    <label className="form-label">Pickup Station <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      value={guestForm.pickupStation}
                      onChange={(e) => setGuestForm({...guestForm, pickupStation: e.target.value})}
                      required
                      disabled={loadingPickupStations}
                    >
                      <option value="">Select pickup station</option>
                      {pickupStations.map((station) => {
                        return (
                          <option key={station._id} value={station._id}>
                            {station.location || station.name || 'Unknown Location'}
                          </option>
                        );
                      })}
                    </select>
                    {loadingPickupStations && (
                      <div className="form-text">Loading pickup stations...</div>
                    )}
                  </div>
                )}
                <div className="col-12 mb-3">
                  <label className="form-label">Comments</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={guestForm.comments}
                    onChange={(e) => setGuestForm({ ...guestForm, comments: e.target.value })}
                    placeholder="Optional comments..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuestRegistrationModal;
