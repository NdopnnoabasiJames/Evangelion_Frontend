import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const HierarchicalEventCreation = ({ userRole, onEventCreated }) => {
    const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    selectedStates: [] // For super admin state selection
  });const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const { execute: createEvent } = useApi(null, { immediate: false });
  // Load states for super admin
  const { data: states, loading: statesLoading, error: statesError } = useApi('/api/states', { 
    immediate: userRole === 'super_admin' 
  });

  const getEventEndpoint = () => {
    const endpoint = (() => {
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
    })();
    return endpoint;
  };
  const getScopeOptions = () => {
    switch (userRole) {
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
  };  const handleSubmit = async (e) => {
    e.preventDefault();    
    // Validate state selection for super admin
    if (userRole === 'super_admin' && formData.selectedStates.length === 0) {
      setError('Please select at least one state');
      return;
    }
    
    setCreating(true);
    setError(null);

    try {      // Prepare form data based on user role
      const submitData = userRole === 'super_admin' 
        ? {
            name: formData.name,
            description: formData.description,
            date: formData.date,
            states: formData.selectedStates, // Base DTO expects 'states'
            branches: [], // Required by base DTO
            selectedStates: formData.selectedStates // For hierarchical service
          }
        : formData;

      await createEvent(getEventEndpoint(), {
        method: 'POST',
        body: submitData
      });
      
      onEventCreated();
    } catch (error) {
      console.error('Failed to create event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStateSelection = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedStates: isChecked 
        ? [...prev.selectedStates, value]
        : prev.selectedStates.filter(state => state !== value)
    }));
  };

  const handleSelectAllStates = (e) => {
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedStates: isChecked ? states?.data?.map(state => state._id) || [] : []
    }));
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
                </div>                <div className="col-md-6">                  {userRole === 'super_admin' ? (
                    <div className="mb-3">
                      <label className="form-label">
                        Select States *
                        {formData.selectedStates.length > 0 && (
                          <span className="badge bg-primary ms-2">
                            {formData.selectedStates.length} selected
                          </span>
                        )}
                      </label>
                      <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {statesLoading ? (
                          <div className="text-center">
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Loading states...
                          </div>
                        ) : statesError ? (
                          <div className="text-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Error loading states
                          </div>
                        ) : states?.data?.length ? (
                          <>
                            <div className="form-check border-bottom pb-2 mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="select-all-states"
                                checked={formData.selectedStates.length === states.data.length && states.data.length > 0}
                                onChange={handleSelectAllStates}
                              />
                              <label className="form-check-label fw-bold" htmlFor="select-all-states">
                                Select All States
                              </label>
                            </div>
                            {states.data.map(state => (
                              <div key={state._id} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value={state._id}
                                  id={`state-${state._id}`}
                                  checked={formData.selectedStates.includes(state._id)}
                                  onChange={handleStateSelection}
                                />
                                <label className="form-check-label" htmlFor={`state-${state._id}`}>
                                  {state.name}
                                </label>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-muted">No states available</div>
                        )}
                      </div>
                      <div className="form-text">
                        Select the states where this event will be held.
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>              {/* Event Scope - only for non-super admins */}
              {userRole !== 'super_admin' && (
                <div className="mb-3">
                  <label htmlFor="scope" className="form-label">Event Scope *</label>
                  <select
                    className="form-select"
                    id="scope"
                    name="scope"
                    value={formData.scope || ''}
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
                    {userRole === 'state_admin' && 'State-wide events will be delegated to Branch Admins for zone selection.'}
                    {userRole === 'branch_admin' && 'Branch-wide events will be delegated to Zonal Admins for pickup station assignment.'}
                  </div>
                </div>
              )}

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
