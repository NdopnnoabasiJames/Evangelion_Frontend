import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';

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
    stateFilter: 'all',
    registeredByFilter: 'all'
  });

  const { execute: fetchGuests } = useApi(null, { immediate: false });

  useEffect(() => {
    loadGuests();
  }, []);

  // Filter guests based on search and filter criteria
  useEffect(() => {
    let filtered = [...guests];
    console.log('Filtering guests. Original count:', guests.length);

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(guest =>
        guest.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (guest.email && guest.email.toLowerCase().includes(filters.search.toLowerCase())) ||
        guest.phone.includes(filters.search)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply event filter
    if (filters.eventFilter !== 'all') {
      filtered = filtered.filter(guest => guest.event?._id === filters.eventFilter);
      console.log('After event filter:', filtered.length);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.status === filters.statusFilter);
      console.log('After status filter:', filtered.length);
    }

    // Apply transport filter
    if (filters.transportFilter !== 'all') {
      filtered = filtered.filter(guest => guest.transportPreference === filters.transportFilter);
      console.log('After transport filter:', filtered.length);
    }

    // Apply branch filter
    if (filters.branchFilter !== 'all') {
      filtered = filtered.filter(guest => guest.branch?._id === filters.branchFilter);
      console.log('After branch filter:', filtered.length);
    }

    // Apply state filter
    if (filters.stateFilter !== 'all') {
      filtered = filtered.filter(guest => guest.state?._id === filters.stateFilter);
      console.log('After state filter:', filtered.length);
    }

    // Apply registered by filter
    if (filters.registeredByFilter !== 'all') {
      filtered = filtered.filter(guest => guest.registeredBy?._id === filters.registeredByFilter);
      console.log('After registered by filter:', filtered.length);
    }

    console.log('Final filtered count:', filtered.length);
    console.log('Setting filteredGuests to:', filtered);
    setFilteredGuests(filtered);
  }, [guests, filters]);

  // Update filtered guests when guests data changes
  useEffect(() => {
    console.log('Guests data changed. Setting filteredGuests to guests directly:', guests.length);
    setFilteredGuests(guests);
  }, [guests]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchGuests(API_ENDPOINTS.ADMIN.GUESTS);
      console.log('Guests API Response:', response);
      
      const guestsData = response?.data || response || [];
      console.log('Processed guests data:', guestsData);
      
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
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueWorkers = () => {
    const workers = guests
      .filter(guest => guest.registeredBy?.name)
      .map(guest => ({
        id: guest.registeredBy._id,
        name: guest.registeredBy.name
      }));
    return [...new Map(workers.map(worker => [worker.id, worker])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

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
      stateFilter: 'all',
      registeredByFilter: 'all'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'checked_in': return 'bg-success';
      case 'invited': return 'bg-secondary';
      case 'no_show': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const formatStatusText = (status) => {
    switch (status) {
      case 'checked_in': return 'Checked In';
      case 'no_show': return 'No Show';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  console.log('Current state - guests:', guests.length, 'filteredGuests:', filteredGuests.length);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  console.log('Render condition - guests.length === 0:', guests.length === 0);

  if (loading) {
    console.log('Rendering loading spinner');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  console.log('About to render main component');

  return (
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

        {guests.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-person-check text-muted" style={{ fontSize: '3rem' }}></i>
            <h6 className="text-muted mt-3">No Guests Found</h6>
            <p className="text-muted">No guests have been registered yet.</p>
          </div>
        ) : (
          <div>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map(guest => {
                    console.log('Rendering guest:', guest.name);
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
                          <span className={`badge ${guest.transportPreference === 'bus' ? 'bg-warning' : 'bg-success'}`}>
                            {guest.transportPreference === 'bus' ? 'Bus' : 'Private'}
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
  );
};

export default GuestsManagement;
