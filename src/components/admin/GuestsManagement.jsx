import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import { exportToExcel } from '../../utils/exportUtils';

const GuestsManagement = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Filter states
  const [filters, setFilters] = useState({
    search: '',
    eventFilter: 'all',
    statusFilter: 'all',
    transportFilter: 'all',
    branchFilter: 'all',
    stateFilter: 'all'
  });

  const { execute: fetchGuests } = useApi(null, { immediate: false });

  useEffect(() => {
    loadGuests();
  }, []);
  // Filter guests based on search and filter criteria
  useEffect(() => {
    let filtered = [...guests];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (guest.email && guest.email.toLowerCase().includes(filters.search.toLowerCase())) ||
        guest.phone.includes(filters.search)
      );
    }

    // Apply event filter
    if (filters.eventFilter !== 'all') {
      filtered = filtered.filter(guest => guest.event?._id === filters.eventFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.status === filters.statusFilter);
    }

    // Apply transport filter
    if (filters.transportFilter !== 'all') {
      filtered = filtered.filter(guest => guest.transportPreference === filters.transportFilter);
    }

    // Apply branch filter
    if (filters.branchFilter !== 'all') {
      filtered = filtered.filter(guest => guest.branch?._id === filters.branchFilter);
    }    // Apply state filter
    if (filters.stateFilter !== 'all') {
      filtered = filtered.filter(guest => guest.state?._id === filters.stateFilter);
    }

    setFilteredGuests(filtered);
  }, [guests, filters]);
  // Update filtered guests when guests data changes
  useEffect(() => {
    setFilteredGuests(guests);
  }, [guests]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError(null);
        const response = await fetchGuests(API_ENDPOINTS.ADMIN.GUESTS);
      
      const guestsData = response?.data || response || [];
      
      setGuests(guestsData);
    } catch (error) {
      console.error('Error loading guests:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  // Filter helper functions
  const getUniqueEvents = () => {
    const events = guests
      .filter(guest => guest.event?.name)
      .map(guest => ({
        id: guest.event._id,
        name: guest.event.name
      }));
    return [...new Map(events.map(event => [event.id, event])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueBranches = () => {
    const branches = guests
      .filter(guest => guest.branch?.name)
      .map(guest => ({
        id: guest.branch._id,
        name: guest.branch.name
      }));
    return [...new Map(branches.map(branch => [branch.id, branch])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueStates = () => {
    const states = guests
      .filter(guest => guest.state?.name)
      .map(guest => ({
        id: guest.state._id,
        name: guest.state.name
      }));
    return [...new Map(states.map(state => [state.id, state])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  const clearFilters = () => {
    setFilters({
      search: '',
      eventFilter: 'all',
      statusFilter: 'all',
      transportFilter: 'all',
      branchFilter: 'all',
      stateFilter: 'all'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export function for guests
  const handleExportGuests = () => {
    const columns = [
      { key: 'name', label: 'Guest Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'event', label: 'Event' },
      { key: 'status', label: 'Status' },
      { key: 'transport', label: 'Transport' },
      { key: 'checkedIn', label: 'Checked In' },
      { key: 'registeredBy', label: 'Registered By' },
      { key: 'branch', label: 'Branch' },
      { key: 'state', label: 'State' },
      { key: 'registrationDate', label: 'Registration Date' },
      { key: 'checkedInTime', label: 'Check-in Time' }
    ];

    const exportData = filteredGuests.map(guest => ({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      event: guest.event?.name || '',
      status: formatStatusText(guest.status),
      transport: guest.transportPreference || '',
      checkedIn: guest.checkedIn ? 'Yes' : 'No',
      registeredBy: guest.registeredBy?.name || '',
      branch: guest.branch?.name || '',
      state: guest.state?.name || '',
      registrationDate: formatDate(guest.createdAt),
      checkedInTime: guest.checkedInTime ? formatDate(guest.checkedInTime) : ''
    }));

    const filename = `Guests_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'checked_in': return 'bg-success';
      case 'confirmed': return 'bg-info';
      case 'invited': return 'bg-secondary';
      case 'no_show': return 'bg-danger';
      case 'cancelled': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const formatStatusText = (status) => {
    switch (status) {
      case 'checked_in': return 'Checked In';
      case 'no_show': return 'No Show';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-person-check-fill me-2"></i>
          Guests Management
        </h5>
        <span className="badge bg-primary rounded-pill">
          {guests.length} Total
        </span>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 bg-light">
              <div className="card-body">
                <div className="row g-3">
                  {/* Search Bar */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <i className="bi bi-search me-1"></i>
                      Search Guests
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, email, or phone..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>

                  {/* Event Filter */}
                  <div className="col-md-2">
                    <label className="form-label fw-bold">
                      <i className="bi bi-calendar-event me-1"></i>
                      Event
                    </label>
                    <select
                      className="form-select"
                      value={filters.eventFilter}
                      onChange={(e) => handleFilterChange('eventFilter', e.target.value)}
                    >
                      <option value="all">All Events</option>
                      {getUniqueEvents().map(event => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="col-md-2">
                    <label className="form-label fw-bold">
                      <i className="bi bi-check-circle me-1"></i>
                      Status
                    </label>
                    <select
                      className="form-select"
                      value={filters.statusFilter}
                      onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="invited">Invited</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked_in">Checked In</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Transport Filter */}
                  <div className="col-md-2">
                    <label className="form-label fw-bold">
                      <i className="bi bi-bus-front me-1"></i>
                      Transport
                    </label>
                    <select
                      className="form-select"
                      value={filters.transportFilter}
                      onChange={(e) => handleFilterChange('transportFilter', e.target.value)}
                    >
                      <option value="all">All Transport</option>
                      <option value="church_bus">Church Bus</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="col-md-2">
                    <label className="form-label fw-bold text-transparent">Clear</label>
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={clearFilters}
                      title="Clear all filters"
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  {/* Branch Filter */}
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-building me-1"></i>
                      Branch
                    </label>
                    <select
                      className="form-select"
                      value={filters.branchFilter}
                      onChange={(e) => handleFilterChange('branchFilter', e.target.value)}
                    >
                      <option value="all">All Branches</option>
                      {getUniqueBranches().map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>                  {/* State Filter */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-geo-alt me-1"></i>
                      State
                    </label>
                    <select
                      className="form-select"
                      value={filters.stateFilter}
                      onChange={(e) => handleFilterChange('stateFilter', e.target.value)}
                    >
                      <option value="all">All States</option>
                      {getUniqueStates().map(state => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>                  {/* Filter Results Summary */}
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-funnel me-1"></i>
                      Results
                    </label>
                    <div className="form-control-plaintext">
                      <span className="badge bg-info fs-6">
                        {filteredGuests.length} of {guests.length} guests
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {guests.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-check text-muted" style={{ fontSize: '3rem' }}></i>
            <h6 className="text-muted mt-3">No Guests Found</h6>
            <p className="text-muted">No guests have been registered yet.</p>
          </div>
        ) : (
          <div>
            {/* Results Summary and Export Button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <small className="text-muted">
                Showing {filteredGuests.length} of {guests.length} guests
              </small>
              <div className="d-flex align-items-center gap-2">
                {(filters.search || filters.eventFilter !== 'all' || filters.statusFilter !== 'all' || filters.transportFilter !== 'all' || filters.branchFilter !== 'all' || filters.stateFilter !== 'all') && (
                  <small className="text-info">
                    <i className="bi bi-funnel-fill me-1"></i>
                    Filters applied
                  </small>
                )}
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={handleExportGuests}
                  title="Export to Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Export
                </button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Phone</th>
                    <th>Event</th>
                    <th>Registered By</th>
                    <th>Branch</th>
                    <th>State</th>
                    <th>Transport</th>
                    <th>Status</th>
                  </tr>                </thead>
                <tbody>
                  {filteredGuests.map(guest => {
                    return (
                      <tr key={guest._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person text-primary me-2"></i>
                            <div>
                              <strong>{guest.name}</strong>
                              {guest.email && (
                                <div>
                                  <small className="text-muted">{guest.email}</small>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{guest.phone}</small>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {guest.event?.name || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {guest.registeredBy?.name || 'Unknown'}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {guest.branch?.name || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {guest.state?.name || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${guest.transportPreference === 'church_bus' ? 'bg-warning' : 'bg-success'}`}>
                            {guest.transportPreference === 'church_bus' ? 'Church Bus' : 'Private'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(guest.status)}`}>
                            {formatStatusText(guest.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestsManagement;
