import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS } from '../../utils/constants';

const PickupStationsManagement = () => {
  const { user } = useAuth();
  const [pickupStations, setPickupStations] = useState([]);
  const [filteredPickupStations, setFilteredPickupStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    zoneFilter: 'all',
    branchFilter: 'all',
    statusFilter: 'all'
  });

  const { execute: fetchPickupStations } = useApi(null, { immediate: false });

  useEffect(() => {
    loadPickupStations();
  }, []);

  // Filter pickup stations based on search and filter criteria
  useEffect(() => {
    let filtered = [...pickupStations];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(station =>
        station.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        (station.branchId?.name && station.branchId.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (station.zoneId?.name && station.zoneId.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Apply zone filter
    if (filters.zoneFilter !== 'all') {
      filtered = filtered.filter(station => station.zoneId?._id === filters.zoneFilter);
    }

    // Apply branch filter
    if (filters.branchFilter !== 'all') {
      filtered = filtered.filter(station => station.branchId?._id === filters.branchFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(station =>
        filters.statusFilter === 'active' ? station.isActive : !station.isActive
      );
    }

    setFilteredPickupStations(filtered);
  }, [pickupStations, filters]);

  // Update filtered pickup stations when data changes
  useEffect(() => {
    setFilteredPickupStations(pickupStations);
  }, [pickupStations]);

  const loadPickupStations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchPickupStations(API_ENDPOINTS.PICKUP_STATIONS.STATE_ADMIN_LIST);
      const stationsData = response?.data || response || [];
      
      setPickupStations(stationsData);
    } catch (error) {
      console.error('Error loading pickup stations:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load pickup stations');
    } finally {
      setLoading(false);
    }
  };

  // Filter helper functions
  const getUniqueZones = () => {
    const zones = pickupStations
      .filter(station => station.zoneId?.name)
      .map(station => ({
        id: station.zoneId._id,
        name: station.zoneId.name
      }));
    return [...new Map(zones.map(zone => [zone.id, zone])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueBranches = () => {
    const branches = pickupStations
      .filter(station => station.branchId?.name)
      .map(station => ({
        id: station.branchId._id,
        name: station.branchId.name
      }));
    return [...new Map(branches.map(branch => [branch.id, branch])).values()]
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
      zoneFilter: 'all',
      branchFilter: 'all',
      statusFilter: 'all'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-pin-map-fill me-2"></i>
          Pickup Stations Management
        </h5>
        <span className="badge bg-primary rounded-pill">
          {pickupStations.length} Total
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
                      Search Stations
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by location, zone, or branch..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>

                  {/* Zone Filter */}
                  <div className="col-md-2">
                    <label className="form-label fw-bold">
                      <i className="bi bi-geo-alt me-1"></i>
                      Zone
                    </label>
                    <select
                      className="form-select"
                      value={filters.zoneFilter}
                      onChange={(e) => handleFilterChange('zoneFilter', e.target.value)}
                    >
                      <option value="all">All Zones</option>
                      {getUniqueZones().map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Filter */}
                  <div className="col-md-2">
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                  {/* Results Summary */}
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-funnel me-1"></i>
                      Results
                    </label>
                    <div className="form-control-plaintext">
                      <span className="badge bg-info fs-6">
                        {filteredPickupStations.length} of {pickupStations.length} stations
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {pickupStations.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-pin-map text-muted" style={{ fontSize: '3rem' }}></i>
            <h6 className="text-muted mt-3">No Pickup Stations Found</h6>
            <p className="text-muted">No pickup stations have been created in your state yet.</p>
          </div>
        ) : (
          <div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Station Location</th>
                    <th>Zone</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPickupStations.map(station => (
                    <tr key={station._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-pin-map text-primary me-2"></i>
                          <div>
                            <strong>{station.location}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {station.zoneId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{station.branchId?.name || 'Unknown'}</strong>
                          {station.branchId?.location && (
                            <div>
                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i>
                                {station.branchId.location}
                              </small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${station.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {station.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupStationsManagement;
