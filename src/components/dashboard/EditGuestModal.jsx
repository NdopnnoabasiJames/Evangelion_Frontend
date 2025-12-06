import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const EditGuestModal = ({ guest, show, onClose, onGuestUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    transportPreference: 'private',
    comments: '',
    isNewConvert: false,
    isElderly: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { execute: updateGuest } = useApi(null, { immediate: false });

  // Initialize form data when guest prop changes
  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        transportPreference: guest.transportPreference || 'private',
        comments: guest.comments || '',
        isNewConvert: guest.isNewConvert || false,
        isElderly: guest.isElderly || false
      });
    }
  }, [guest]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await updateGuest(
        `${API_ENDPOINTS.GUESTS.BASE}/${guest._id}`,
        {
          method: 'PATCH',
          body: formData
        }
      );

      if (response) {
        onGuestUpdated({ ...guest, ...formData });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update guest');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-pencil-square me-2"></i>
              Edit Guest Information
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <div className="row g-3">
                {/* Guest Name */}
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label fw-bold">
                    <i className="bi bi-person me-1"></i>
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="Enter guest name"
                  />
                </div>

                {/* Phone Number */}
                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label fw-bold">
                    <i className="bi bi-phone me-1"></i>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label fw-bold">
                    <i className="bi bi-envelope me-1"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Enter email address (optional)"
                  />
                </div>

                {/* Transport Preference */}
                <div className="col-md-6">
                  <label htmlFor="transportPreference" className="form-label fw-bold">
                    <i className="bi bi-bus-front me-1"></i>
                    Transport Preference
                  </label>
                  <select
                    className="form-select"
                    id="transportPreference"
                    name="transportPreference"
                    value={formData.transportPreference}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="private">Private Transport</option>
                    <option value="church_bus">Church Bus</option>
                  </select>
                </div>

                {/* Comments */}
                <div className="col-12">
                  <label htmlFor="comments" className="form-label fw-bold">
                    <i className="bi bi-chat-left-text me-1"></i>
                    Comments
                  </label>
                  <textarea
                    className="form-control"
                    id="comments"
                    name="comments"
                    rows="3"
                    value={formData.comments}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Any additional comments (optional)"
                  ></textarea>
                </div>

                {/* Guest Categories */}
                <div className="col-12">
                  <label className="form-label fw-bold">
                    <i className="bi bi-tags me-1"></i>
                    Guest Categories
                  </label>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isNewConvert"
                          name="isNewConvert"
                          checked={formData.isNewConvert}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="isNewConvert">
                          <i className="bi bi-star me-1"></i>
                          New Convert
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isElderly"
                          name="isElderly"
                          checked={formData.isElderly}
                          onChange={handleInputChange}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="isElderly">
                          <i className="bi bi-person-walking me-1"></i>
                          Elderly
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Notice */}
              <div className="alert alert-info mt-3" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> You can only edit guests that you have registered and haven't been checked in yet.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Update Guest
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

export default EditGuestModal;