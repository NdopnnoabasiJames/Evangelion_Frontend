import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';

const HierarchicalEventCreation = ({ userRole, onEventCreated, editingEvent }) => {
  // Helper function to get minimum datetime (current time)
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to validate if date is in the future
  const isDateInFuture = (dateValue) => {
    if (!dateValue) return true; // Allow empty values for validation
    const selectedDate = new Date(dateValue);
    const now = new Date();
    return selectedDate > now;
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'single-day',
    date: '', // For single-day events
    startDate: '', // For multi-day consecutive events
    endDate: '', // For multi-day consecutive events
    specificDates: [], // For multi-day specific dates events
    location: '', // Used by other admin types
    selectedStates: [], // For super admin state selection
    selectedBranches: [], // For state admin branch selection
    selectedZones: [] // For branch admin zone selection
  });

  const [newSpecificDate, setNewSpecificDate] = useState('');

  // Populate form data when editing
  useEffect(() => {
    if (editingEvent) {
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const eventDate = new Date(dateString);
        if (isNaN(eventDate.getTime())) return '';
        
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const hours = String(eventDate.getHours()).padStart(2, '0');
        const minutes = String(eventDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Determine event type based on existing data
      const eventType = editingEvent.eventType || (editingEvent.specificDates?.length ? 'multi-day-specific' : 
                       (editingEvent.startDate && editingEvent.endDate ? 'multi-day' : 'single-day'));
      
      // Format dates based on event type
      let formattedDate = '';
      let formattedStartDate = '';
      let formattedEndDate = '';
      let formattedSpecificDates = [];
      
      if (eventType === 'multi-day-specific') {
        formattedSpecificDates = editingEvent.specificDates?.map(date => formatDateForInput(date)) || [];
      } else if (eventType === 'multi-day') {
        formattedStartDate = formatDateForInput(editingEvent.startDate);
        formattedEndDate = formatDateForInput(editingEvent.endDate);
      } else {
        formattedDate = formatDateForInput(editingEvent.date);
      }

      // Extract IDs from available objects for form population
      const selectedStateIds = editingEvent.availableStates?.map(state => state._id) || [];
      const selectedBranchIds = editingEvent.availableBranches?.map(branch => branch._id) || [];
      const selectedZoneIds = editingEvent.availableZones?.map(zone => zone._id) || [];

      setFormData({
        name: editingEvent.name || '',
        description: editingEvent.description || '',
        eventType,
        date: formattedDate,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        specificDates: formattedSpecificDates,
        location: editingEvent.location || '',
        selectedStates: selectedStateIds,
        selectedBranches: selectedBranchIds,
        selectedZones: selectedZoneIds
      });
    }
  }, [editingEvent]);const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const { execute: createEvent } = useApi(null, { immediate: false });  // Load states for super admin
  const { data: states, loading: statesLoading, error: statesError } = useApi('/api/states', { 
    immediate: userRole === 'super_admin' 
  });
  // Load branches for state admin
  const { data: branches, loading: branchesLoading, error: branchesError } = useApi('/api/branches/state-admin/my-branches', { 
    immediate: userRole === 'state_admin' 
  });
  // Load zones for branch admin
  const { data: zones, loading: zonesLoading, error: zonesError } = useApi('/api/zones/branch-admin/list', { 
    immediate: userRole === 'branch_admin' 
  });

  const getEventEndpoint = () => {
    if (editingEvent) {
      // For editing, use the appropriate update endpoint based on user role
      switch (userRole) {
        case 'super_admin':
          return `${API_ENDPOINTS.ADMIN.CREATE_SUPER_ADMIN_EVENT}/${editingEvent._id}`;
        case 'state_admin':
          return `${API_ENDPOINTS.ADMIN.CREATE_STATE_ADMIN_EVENT}/${editingEvent._id}`;
        case 'branch_admin':
          return `${API_ENDPOINTS.ADMIN.CREATE_BRANCH_ADMIN_EVENT}/${editingEvent._id}`;
        case 'zonal_admin':
          return `${API_ENDPOINTS.ADMIN.CREATE_ZONAL_ADMIN_EVENT}/${editingEvent._id}`;
        default:
          return `/api/events/${editingEvent._id}`;
      }
    }
    
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
  };  const getScopeOptions = () => {
    switch (userRole) {
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
    
    // Validate that all dates are in the future
    if (formData.eventType === 'single-day') {
      if (!isDateInFuture(formData.date)) {
        setError('Event date must be in the future');
        return;
      }
    } else if (formData.eventType === 'multi-day') {
      if (!isDateInFuture(formData.startDate)) {
        setError('Start date must be in the future');
        return;
      }
      if (!isDateInFuture(formData.endDate)) {
        setError('End date must be in the future');
        return;
      }
    } else if (formData.eventType === 'multi-day-specific') {
      const pastDates = formData.specificDates.filter(date => !isDateInFuture(date));
      if (pastDates.length > 0) {
        setError('All specific dates must be in the future');
        return;
      }
    }
    
    // Validate specific dates for multi-day-specific events
    if (formData.eventType === 'multi-day-specific' && formData.specificDates.length < 2) {
      setError('Please add at least 2 specific dates for a multi-day event');
      return;
    }

    // Validate state selection for super admin
    if (userRole === 'super_admin' && formData.selectedStates.length === 0) {
      setError('Please select at least one state');
      return;
    }    // Validate branch selection for state admin
    if (userRole === 'state_admin' && formData.selectedBranches.length === 0) {
      setError('Please select at least one branch');
      return;
    }

    // Validate zone selection for branch admin
    if (userRole === 'branch_admin' && formData.selectedZones.length === 0) {
      setError('Please select at least one zone');
      return;
    }
    
    setCreating(true);
    setError(null);

    try {      // Prepare form data based on user role and event type
      const baseEventData = {
        name: formData.name,
        description: formData.description,
        eventType: formData.eventType,
        location: formData.location
      };

      // Add date fields based on event type
      if (formData.eventType === 'multi-day') {
        baseEventData.startDate = formData.startDate;
        baseEventData.endDate = formData.endDate;
      } else if (formData.eventType === 'multi-day-specific') {
        baseEventData.specificDates = formData.specificDates;
      } else {
        baseEventData.date = formData.date;
      }

      const submitData = userRole === 'super_admin' 
        ? {
            ...baseEventData,
            states: formData.selectedStates, // Base DTO expects 'states'
            branches: [], // Required by base DTO
            selectedStates: formData.selectedStates // For hierarchical service
          }
        : userRole === 'state_admin'
        ? {
            ...baseEventData,
            states: [], // Required by base DTO even if empty
            branches: formData.selectedBranches, // Base DTO expects 'branches'
            selectedBranches: formData.selectedBranches // For hierarchical service
          }
        : userRole === 'branch_admin'
        ? {
            ...baseEventData,
            location: formData.location, // Include location for branch admin
            states: [], // Required by CreateEventDto
            branches: [], // Required by CreateEventDto
            selectedZones: formData.selectedZones, // For hierarchical DTO
          }
        : { ...baseEventData, ...formData };

      const result = await createEvent(getEventEndpoint(), {
        method: editingEvent ? 'PUT' : 'POST',
        body: submitData
      });
      
      onEventCreated();
    } catch (error) {
      console.error(`Failed to ${editingEvent ? 'update' : 'create'} event:`, error);
      setError(error.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-detect event type when start/end dates are set
    if (name === 'startDate' || name === 'endDate') {
      const updatedFormData = {
        ...formData,
        [name]: value
      };
      
      // Auto-switch to multi-day if both dates are set and different
      if (updatedFormData.startDate && updatedFormData.endDate) {
        const startDate = new Date(updatedFormData.startDate).toDateString();
        const endDate = new Date(updatedFormData.endDate).toDateString();
        if (startDate !== endDate && updatedFormData.eventType !== 'multi-day') {
          updatedFormData.eventType = 'multi-day';
        }
      }
      
      setFormData(updatedFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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

  const handleBranchSelection = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedBranches: isChecked 
        ? [...prev.selectedBranches, value]
        : prev.selectedBranches.filter(branch => branch !== value)
    }));
  };
  const handleSelectAllBranches = (e) => {
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedBranches: isChecked ? branches?.data?.map(branch => branch._id) || [] : []
    }));
  };

  const handleZoneSelection = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedZones: isChecked 
        ? [...prev.selectedZones, value]
        : prev.selectedZones.filter(zone => zone !== value)
    }));
  };

  const handleSelectAllZones = (e) => {
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      selectedZones: isChecked ? zones?.data?.map(zone => zone._id) || [] : []
    }));
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0">
            <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
              {editingEvent ? 'Edit Event' : 'Create New Event'} as {userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

              {/* Event Type Selection */}
              <div className="mb-3">
                <label htmlFor="eventType" className="form-label">Event Type</label>
                <select
                  className="form-select"
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                >
                  <option value="single-day">Single Day Event</option>
                  <option value="multi-day">Multi-Day Consecutive Event</option>
                  <option value="multi-day-specific">Multi-Day Specific Dates</option>
                </select>
              </div>

              {/* Date Selection based on Event Type */}
              <div className="row">
                {formData.eventType === 'single-day' ? (
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
                        min={getMinDateTime()}
                        required
                      />
                    </div>
                  </div>
                ) : formData.eventType === 'multi-day-specific' ? (
                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label">Specific Event Dates *</label>
                      <div className="d-flex mb-2">
                        <input
                          type="datetime-local"
                          className="form-control me-2"
                          value={newSpecificDate}
                          onChange={(e) => setNewSpecificDate(e.target.value)}
                          placeholder="Select date and time"
                          min={getMinDateTime()}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            if (newSpecificDate && !formData.specificDates.includes(newSpecificDate)) {
                              if (!isDateInFuture(newSpecificDate)) {
                                setError('Selected date must be in the future');
                                return;
                              }
                              setFormData(prev => ({
                                ...prev,
                                specificDates: [...prev.specificDates, newSpecificDate].sort()
                              }));
                              setNewSpecificDate('');
                              setError(null); // Clear any previous error
                            }
                          }}
                          disabled={!newSpecificDate || formData.specificDates.includes(newSpecificDate)}
                        >
                          Add Date
                        </button>
                      </div>
                      <div className="border p-3 rounded">
                        {formData.specificDates.length === 0 ? (
                          <p className="text-muted mb-0">No dates selected. Add at least 2 dates for a multi-day event.</p>
                        ) : (
                          <div>
                            <p className="mb-2">Selected Dates:</p>
                            {formData.specificDates.map((date, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                <span>{new Date(date).toLocaleString()}</span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      specificDates: prev.specificDates.filter((_, i) => i !== index)
                                    }));
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="startDate" className="form-label">Start Date *</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="endDate" className="form-label">End Date *</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          id="endDate"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          required
                          min={formData.startDate}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="col-md-6">
                  {userRole === 'super_admin' ? (
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
                    </div>                  ) : userRole === 'state_admin' ? (
                    <div className="mb-3">
                      <label className="form-label">Select Branches *</label>
                      <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {branchesLoading ? (
                          <div className="text-center">
                            <div className="spinner-border spinner-border-sm" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : branchesError ? (
                          <div className="text-danger">
                            <small>Error loading branches: {branchesError}</small>
                          </div>
                        ) : branches?.data?.length ? (
                          <>
                            <div className="form-check border-bottom pb-2 mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="select-all-branches"
                                checked={formData.selectedBranches.length === branches.data.length && branches.data.length > 0}
                                onChange={handleSelectAllBranches}
                              />
                              <label className="form-check-label fw-bold" htmlFor="select-all-branches">
                                Select All Branches
                              </label>
                            </div>
                            {branches.data.map(branch => (
                              <div key={branch._id} className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value={branch._id}
                                  id={`branch-${branch._id}`}
                                  checked={formData.selectedBranches.includes(branch._id)}
                                  onChange={handleBranchSelection}
                                />
                                <label className="form-check-label" htmlFor={`branch-${branch._id}`}>
                                  {branch.name}
                                  <small className="text-muted ms-2">({branch.location})</small>
                                </label>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-muted">No branches available</div>
                        )}
                      </div>
                      <div className="form-text">
                        Select the branches in your state that will participate in this event.
                      </div>                    </div>
                  ) : userRole === 'branch_admin' ? (
                    <div>
                      <div className="mb-3">
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          As a Branch Admin, you can create events for selected zones in your branch.
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="location" className="form-label">Event Venue *</label>
                        <input
                          type="text"
                          className="form-control"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Enter event venue/location"
                          required
                        />
                        <div className="form-text">
                          Specify the venue where the event will be held.
                        </div>
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
              </div>              {/* Zone Selection for Branch Admin */}
              {userRole === 'branch_admin' && (
                <div className="mb-3">
                  <label className="form-label">Zone Selection *</label>
                  <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="mb-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="selectAllZones"
                          checked={zones?.data?.length > 0 && formData.selectedZones.length === zones.data.length}
                          onChange={handleSelectAllZones}
                        />
                        <label className="form-check-label fw-bold" htmlFor="selectAllZones">
                          Select All Zones
                        </label>
                      </div>
                      <hr className="my-2" />
                    </div>
                    
                    {zonesLoading ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2">Loading zones...</span>
                      </div>
                    ) : zonesError ? (
                      <div className="text-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Error loading zones: {zonesError}
                      </div>
                    ) : zones?.data?.length > 0 ? (
                      <div className="row">
                        {zones.data.map((zone) => (
                          <div key={zone._id} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                value={zone._id}
                                id={`zone-${zone._id}`}
                                checked={formData.selectedZones.includes(zone._id)}
                                onChange={handleZoneSelection}
                              />
                              <label className="form-check-label" htmlFor={`zone-${zone._id}`}>
                                {zone.name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted">No zones available in your branch</div>
                    )}
                  </div>
                  <div className="form-text">
                    Select the zones in your branch that will participate in this event.
                  </div>
                </div>
              )}

              {/* Event Scope - only for zonal admins */}
              {userRole === 'zonal_admin' && (
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
                    <option value="">Select scope...</option>
                    {getScopeOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Zone events are managed within your zone.
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
                      {editingEvent ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingEvent ? 'Update Event' : 'Create Event'
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
