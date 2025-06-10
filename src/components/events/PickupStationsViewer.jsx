import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { EmptyState, LoadingCard } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';

const PickupStationsViewer = ({ userRole }) => {
  const [pickupStations, setPickupStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [states, setStates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { execute: fetchStations } = useApi(null, { immediate: false });
  const { execute: fetchStates } = useApi(null, { immediate: false });
  const { execute: fetchBranches } = useApi(null, { immediate: false });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStations();
  }, [pickupStations, selectedState, selectedBranch]);

  useEffect(() => {
    if (selectedState) {
      loadBranches();
      setSelectedBranch(''); // Reset branch selection when state changes
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedState]);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Load pickup stations
      const stationsResponse = await fetchStations('/api/pickup-stations');
      const stationsArray = Array.isArray(stationsResponse) ? stationsResponse : (stationsResponse?.data || []);
      setPickupStations(stationsArray);

      // Load states for filtering
      const statesResponse = await fetchStates('/api/states');
      const statesArray = Array.isArray(statesResponse) ? statesResponse : (statesResponse?.data || []);
      setStates(statesArray);

    } catch (error) {
      console.error('Failed to load pickup stations data:', error);
      setError('Failed to load pickup stations data');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!selectedState) return;
    
    try {
      const branchesResponse = await fetchBranches(`/api/branches/by-state/${selectedState}`);
      const branchesArray = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse?.data || []);
      setBranches(branchesArray);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setBranches([]);
    }
  };

  const filterStations = () => {
    let filtered = [...pickupStations];

    if (selectedState) {
      filtered = filtered.filter(station => 
        station.zone?.branch?.state?._id === selectedState || 
        station.zone?.branch?.state === selectedState
      );
    }

    if (selectedBranch) {
      filtered = filtered.filter(station => 
        station.zone?.branch?._id === selectedBranch || 
        station.zone?.branch === selectedBranch
      );
    }

    setFilteredStations(filtered);
  };

  const clearFilters = () => {
    setSelectedState('');
    setSelectedBranch('');
  };

  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="col-12 col-md-6 col-lg-4">
            <LoadingCard loading className="h-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button className="btn btn-outline-danger btn-sm ms-2" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Pickup Stations Overview</h4>
          <p className="text-muted mb-0">
            {userRole === 'super_admin' ? 'View all pickup stations across states and branches' : 'Manage pickup stations for events'}
          </p>
        </div>
        <div className="text-muted">
          Total: <span className="fw-bold text-primary">{filteredStations.length}</span> stations
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="stateFilter" className="form-label">Filter by State</label>
              <select
                id="stateFilter"
                className="form-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state._id} value={state._id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="branchFilter" className="form-label">Filter by Branch</label>
              <select
                id="branchFilter"
                className="form-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!selectedState}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary"
                onClick={clearFilters}
                disabled={!selectedState && !selectedBranch}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Stations Grid */}
      {filteredStations.length === 0 ? (
        <EmptyState 
          icon="bi-geo-alt"
          title="No Pickup Stations Found"
          description={
            selectedState || selectedBranch 
              ? "No pickup stations match the selected filters."
              : "No pickup stations have been created yet."
          }
        />
      ) : (
        <div className="row g-4">
          {filteredStations.map(station => (
            <div key={station._id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0 text-primary">
                      <i className="bi bi-geo-alt me-2"></i>
                      {station.name}
                    </h5>
                    <span className={`badge ${station.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {station.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted d-block">
                      <i className="bi bi-building me-1"></i>
                      <strong>Zone:</strong> {station.zone?.name || 'N/A'}
                    </small>
                    <small className="text-muted d-block">
                      <i className="bi bi-diagram-3 me-1"></i>
                      <strong>Branch:</strong> {station.zone?.branch?.name || 'N/A'}
                    </small>
                    <small className="text-muted d-block">
                      <i className="bi bi-map me-1"></i>
                      <strong>State:</strong> {station.zone?.branch?.state?.name || 'N/A'}
                    </small>
                  </div>

                  {station.address && (
                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-pin-map me-1"></i>
                        {station.address}
                      </small>
                    </div>
                  )}

                  {station.contactNumber && (
                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-telephone me-1"></i>
                        {station.contactNumber}
                      </small>
                    </div>
                  )}

                  <div className="text-muted small">
                    <i className="bi bi-calendar me-1"></i>
                    Created: {new Date(station.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PickupStationsViewer;
