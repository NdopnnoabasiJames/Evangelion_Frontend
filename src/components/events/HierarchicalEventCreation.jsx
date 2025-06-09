import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const HierarchicalEventCreation = ({ userRole, onEventCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    scope: 'national' // Default scope
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const { execute: createEvent } = useApi(null, { immediate: false });

  const getEventEndpoint = () => {
    switch (userRole) {
      case 'super_admin':
        return API_ENDPOINTS.ADMIN.CREATE_SUPER_ADMIN_EVENT;
      case 'state_admin':
        return API_ENDPOINTS.ADMIN.CREATE_STATE_ADMIN_EVENT;
      case 'branch_admin':
        return API_ENDPOINTS.ADMIN.CREATE_BRANCH_ADMIN_EVENT;
      case 'zonal_admin':
        return API_ENDPOINTS.ADMIN.CREATE_ZONAL_ADMIN_EVENT;
      default:
        return API_ENDPOINTS.EVENTS.HIERARCHICAL;
    }
  };

  const getScopeOptions = () => {
    switch (userRole) {
      case 'super_admin':
        return [
          { value: 'national', label: 'National Event (All States)' },
          { value: 'regional', label: 'Regional Event (Selected States)' }
        ];
      case 'state_admin':
        return [
          { value: 'state', label: 'State-wide Event (All Branches)' },
          { value: 'branch', label: 'Branch-specific Event (Selected Branches)' }
        ];
      case 'branch_admin':
        return [
          { value: 'branch', label: 'Branch-wide Event (All Zones)' },
          { value: 'zone', label: 'Zone-specific Event (Selected Zones)' }
        ];
      case 'zonal_admin':
        return [
          { value: 'zone', label: 'Zone Event' }
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await createEvent(getEventEndpoint(), {
        method: 'POST',
        body: formData
      });
      
      onEventCreated();
    } catch (error) {
      console.error('Failed to create event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0">
            <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
              Create New Event as {userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h5>
          </div>
          
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Event Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter event name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter event description"
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Event Date *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="location" className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Event location"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="scope" className="form-label">Event Scope *</label>
                <select
                  className="form-select"
                  id="scope"
                  name="scope"
                  value={formData.scope}
                  onChange={handleChange}
                  required
                >
                  {getScopeOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  {userRole === 'super_admin' && 'National events will be delegated to State Admins for branch selection.'}
                  {userRole === 'state_admin' && 'State-wide events will be delegated to Branch Admins for zone selection.'}
                  {userRole === 'branch_admin' && 'Branch-wide events will be delegated to Zonal Admins for pickup station assignment.'}
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onEventCreated()}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  style={{ backgroundColor: 'var(--primary-purple)', borderColor: 'var(--primary-purple)' }}
                >
                  {creating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalEventCreation;
