import React from 'react';

const GuestRegistrationForm = ({
  guestForm,
  setGuestForm,
  handleGuestRegistration,
  loading,
  loadingPickupStations,
  pickupStations,
  setActiveTab
}) => (
  <form onSubmit={handleGuestRegistration}>
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label">Full Name *</label>
        <input
          type="text"
          className="form-control"
          value={guestForm.name}
          onChange={(e) => setGuestForm({...guestForm, name: e.target.value})}
          required
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Phone Number *</label>
        <input
          type="tel"
          className="form-control"
          value={guestForm.phone}
          onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
          required
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Email Address</label>
        <input
          type="email"
          className="form-control"
          value={guestForm.email}
          onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
        />
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">Transport Preference <span className="text-danger">*</span></label>
        <select
          className="form-select"
          value={guestForm.transportPreference}
          onChange={(e) => setGuestForm({...guestForm, transportPreference: e.target.value, pickupStation: ''})}
          required
        >
          <option value="private">Private Transport</option>
          <option value="church_bus">Church Bus</option>
        </select>
      </div>
      {guestForm.transportPreference === 'church_bus' && (
        <div className="col-md-6 mb-3">
          <label className="form-label">Pickup Station <span className="text-danger">*</span></label>
          {loadingPickupStations ? (
            <div className="form-control d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Loading pickup stations...
            </div>
          ) : (
            <select
              className="form-select"
              value={guestForm.pickupStation}
              onChange={(e) => setGuestForm({...guestForm, pickupStation: e.target.value})}
              required={guestForm.transportPreference === 'church_bus'}
            >
              <option value="">Select a pickup station</option>
              {pickupStations.map((station) => (
                <option key={station._id} value={station._id}>
                  {station.location} {station.departureTime && `(Departure: ${station.departureTime})`}
                </option>
              ))}
            </select>
          )}
          {guestForm.transportPreference === 'church_bus' && pickupStations.length === 0 && !loadingPickupStations && (
            <small className="text-muted">No pickup stations available for your branch yet.</small>
          )}
        </div>
      )}
      <div className="col-12 mb-3">
        <label className="form-label">Notes</label>
        <textarea
          className="form-control"
          rows="3"
          value={guestForm.notes}
          onChange={(e) => setGuestForm({...guestForm, notes: e.target.value})}
          placeholder="Any additional notes about the guest..."
        ></textarea>
      </div>
      <div className="col-12 mb-3">
        <label className="form-label">Comments</label>
        <textarea
          className="form-control"
          rows="2"
          value={guestForm.comments}
          onChange={(e) => setGuestForm({...guestForm, comments: e.target.value})}
          placeholder="Optional comments..."
        ></textarea>
      </div>
    </div>
    <div className="d-flex gap-2">
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Registering...
          </>
        ) : (
          <>
            <i className="bi bi-person-plus me-2"></i>
            Register Guest
          </>
        )}
      </button>
      <button 
        type="button" 
        className="btn btn-outline-secondary"
        onClick={() => setActiveTab('list')}
      >
        Cancel
      </button>
    </div>
  </form>
);

export default GuestRegistrationForm;
