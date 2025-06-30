import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import { analyticsService } from '../../services/analyticsService';

const WorkersManagement = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    branchFilter: 'all',
    statusFilter: 'all',
    stateFilter: 'all'
  });

  const { execute: fetchWorkers } = useApi(null, { immediate: false });

  useEffect(() => {
    loadWorkers();
  }, []);

  // Filter workers based on search and filter criteria
  useEffect(() => {
    let filtered = [...workers];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(worker =>
        worker.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (worker.branch?.name && worker.branch.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (worker.approvedBy?.name && worker.approvedBy.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Apply branch filter
    if (filters.branchFilter !== 'all') {
      filtered = filtered.filter(worker => worker.branch?._id === filters.branchFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(worker =>
        filters.statusFilter === 'approved' ? worker.isApproved : !worker.isApproved
      );
    }

    // Apply state filter
    if (filters.stateFilter !== 'all') {
      filtered = filtered.filter(worker => worker.state?._id === filters.stateFilter);
    }

    setFilteredWorkers(filtered);
  }, [workers, filters]);

  // Update filtered workers when workers data changes
  useEffect(() => {
    setFilteredWorkers(workers);
  }, [workers]);  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch workers and rankings in parallel
      const [workersResponse, rankingsResponse] = await Promise.all([
        fetchWorkers(API_ENDPOINTS.ADMIN.WORKERS),        analyticsService.getWorkerRankings(
          user?.role === ROLES.STATE_ADMIN && user?.state?._id ? { stateId: user.state._id } : {}
        ).catch((err) => {
          console.warn('Failed to fetch worker rankings:', err);
          return { data: [] };
        })
      ]);      const workersData = workersResponse?.data || workersResponse || [];
      const rankingsData = rankingsResponse?.data || rankingsResponse || [];
      
      // Create a map of rankings by worker ID
      const rankingsMap = new Map();
      rankingsData.forEach((ranking) => {
        rankingsMap.set(ranking._id || ranking.workerId, {
          rank: ranking.rank,
          medal: ranking.medal,
          totalScore: ranking.totalScore || 0,
          totalInvitedGuests: ranking.totalInvitedGuests || 0,
          totalCheckedInGuests: ranking.totalCheckedInGuests || 0
        });
      });
      
      // Merge ranking data with workers data
      const mergedWorkers = workersData.map(worker => ({
        ...worker,
        ...rankingsMap.get(worker._id)
      }));
      
      // Sort by rank (if available) or by name
      mergedWorkers.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      });
        setWorkers(mergedWorkers);
    } catch (error) {
      console.error('Error loading workers:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  // Filter helper functions
  const getUniqueBranches = () => {
    const branches = workers
      .filter(worker => worker.branch?.name)
      .map(worker => ({
        id: worker.branch._id,
        name: worker.branch.name
      }));
    return [...new Map(branches.map(branch => [branch.id, branch])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueStates = () => {
    const states = workers
      .filter(worker => worker.state?.name)
      .map(worker => ({
        id: worker.state._id,
        name: worker.state.name
      }));
    return [...new Map(states.map(state => [state.id, state])).values()]
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
      branchFilter: 'all',
      statusFilter: 'all',
      stateFilter: 'all'
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
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            Workers Management
          </h5>
          <span className="badge bg-primary rounded-pill">
            {workers.length} Total
          </span>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {workers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="text-muted mt-3">No Workers Found</h6>
              <p className="text-muted">No workers have been registered in your jurisdiction yet.</p>
            </div>
          ) : (
            <>
              {/* Filters Section */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search workers..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-2">
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
                
                <div className="col-md-2">
                  <select 
                    className="form-select"
                    value={filters.statusFilter}
                    onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div className="col-md-2">
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
                </div>
                
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                    title="Clear all filters"
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Clear
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  Showing {filteredWorkers.length} of {workers.length} workers
                </small>
                {(filters.search || filters.branchFilter !== 'all' || filters.statusFilter !== 'all' || filters.stateFilter !== 'all') && (
                  <small className="text-info">
                    <i className="bi bi-funnel-fill me-1"></i>
                    Filters applied
                  </small>
                )}
              </div>              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Worker Name</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Invited Guests</th>
                      <th>Checked-in Guests</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker, index) => (
                      <tr key={worker._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {worker.medal && worker.medal !== '' ? (
                              <i className={`bi bi-award-fill me-2 ${
                                worker.medal === 'gold' ? 'text-warning' :     // Gold
                                worker.medal === 'platinum' ? 'text-info' :    // Platinum (light blue)
                                worker.medal === 'silver' ? 'text-secondary' :  // Silver
                                ''
                              }`} title={
                                worker.medal.charAt(0).toUpperCase() + worker.medal.slice(1) + ' Medal'
                              }></i>
                            ) : null}
                            <span className="fw-bold">{worker.rank || index + 1}</span>
                            {worker.medal && worker.medal !== '' && (
                              <small className="text-muted ms-2">
                                {worker.medal.charAt(0).toUpperCase() + worker.medal.slice(1)}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person text-primary me-2"></i>
                            <div>
                              <strong>{worker.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {worker.branch?.name || 'Unknown'}
                          </span>                        </td>
                        <td>
                          <span className={`badge ${worker.isApproved ? 'bg-success' : 'bg-warning'}`}>
                            {worker.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {(worker.totalScore || 0)} pts
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {worker.totalInvited || 0}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {worker.totalCheckedIn || 0}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-info"
                              title="View details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className={`btn ${worker.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              title={worker.isActive ? 'Disable worker' : 'Enable worker'}
                            >
                              <i className={`bi ${worker.isActive ? 'bi-pause' : 'bi-play'}`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default WorkersManagement;