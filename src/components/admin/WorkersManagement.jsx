import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import { analyticsService } from '../../services/analyticsService';
import { exportToExcel } from '../../utils/exportUtils';

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
    stateFilter: 'all',
    scoreValue: '',
    scoreOperator: 'greater'
  });

  // Modal states
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  const { execute: fetchWorkers } = useApi(null, { immediate: false });
  const { execute: updateWorkerStatus } = useApi(null, { immediate: false });

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

    // Apply score filter
    if (filters.scoreValue !== '' && !isNaN(filters.scoreValue)) {
      const scoreThreshold = parseFloat(filters.scoreValue);
      filtered = filtered.filter(worker => {
        const workerScore = worker.totalScore || 0;
        switch (filters.scoreOperator) {
          case 'greater':
            return workerScore > scoreThreshold;
          case 'less':
            return workerScore < scoreThreshold;
          case 'equal':
            return workerScore === scoreThreshold;
          default:
            return true;
        }
      });
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
          totalInvited: ranking.totalInvited || 0,
          totalCheckedIn: ranking.totalCheckedIn || 0
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

  // Handler functions for action buttons
  const handleViewWorker = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  const handleToggleWorkerStatus = async (worker) => {
    try {
      const newStatus = !worker.isActive;
      
      await updateWorkerStatus(
        `${API_ENDPOINTS.ADMIN.WORKERS}/${worker._id}/status`,
        {
          method: 'PUT',
          body: {
            isActive: newStatus,
            status: newStatus ? 'active' : 'disabled'
          }
        }
      );

      // Update the worker in the local state
      setWorkers(prevWorkers =>
        prevWorkers.map(w =>
          w._id === worker._id
            ? { ...w, isActive: newStatus, status: newStatus ? 'active' : 'disabled' }
            : w
        )
      );

      console.log(`Worker ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating worker status:', error);
      alert(`Failed to ${worker.isActive ? 'disable' : 'enable'} worker: ${error.message}`);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export function for workers
  const handleExportWorkers = () => {
    const columns = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Worker Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'branch', label: 'Branch' },
      { key: 'state', label: 'State' },
      { key: 'status', label: 'Status' },
      { key: 'totalScore', label: 'Score' },
      { key: 'totalInvited', label: 'Invited Guests' },
      { key: 'totalCheckedIn', label: 'Checked-in Guests' },
      { key: 'medal', label: 'Medal' },
      { key: 'approvedBy', label: 'Approved By' },
      { key: 'approvedAt', label: 'Approved Date' }
    ];

    const exportData = filteredWorkers.map(worker => ({
      rank: worker.rank || '',
      name: worker.name,
      email: worker.email || '',
      phone: worker.phone || '',
      branch: worker.branch?.name || 'Unknown',
      state: worker.state?.name || '',
      status: worker.isApproved ? 'Approved' : 'Pending',
      totalScore: worker.totalScore || 0,
      totalInvited: worker.totalInvited || 0,
      totalCheckedIn: worker.totalCheckedIn || 0,
      medal: worker.medal ? worker.medal.charAt(0).toUpperCase() + worker.medal.slice(1) : '',
      approvedBy: worker.approvedBy?.name || '',
      approvedAt: worker.approvedAt ? formatDate(worker.approvedAt) : ''
    }));

    const filename = `Workers_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
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
      stateFilter: 'all',
      scoreValue: '',
      scoreOperator: 'greater'
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
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
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
                <div className="col-md-3">
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
                
                <div className="col-md-1">
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
                
                {/* Score Filter */}
                <div className="col-md-1">
                  <select 
                    className="form-select"
                    value={filters.scoreOperator}
                    onChange={(e) => handleFilterChange('scoreOperator', e.target.value)}
                    title="Score comparison"
                  >
                    <option value="greater">&gt;</option>
                    <option value="less">&lt;</option>
                    <option value="equal">=</option>
                  </select>
                </div>
                
                <div className="col-md-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Score filter..."
                    value={filters.scoreValue}
                    onChange={(e) => handleFilterChange('scoreValue', e.target.value)}
                    min="0"
                  />
                </div>
                
                <div className="col-md-1">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                    title="Clear all filters"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  Showing {filteredWorkers.length} of {workers.length} workers
                </small>
                <div className="d-flex align-items-center gap-2">
                  {(filters.search || filters.branchFilter !== 'all' || filters.statusFilter !== 'all' || filters.stateFilter !== 'all' || filters.scoreValue !== '') && (
                    <small className="text-info">
                      <i className="bi bi-funnel-fill me-1"></i>
                      Filters applied
                    </small>
                  )}
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={handleExportWorkers}
                    title="Export to Excel"
                  >
                    <i className="bi bi-file-earmark-excel me-1"></i>
                    Export
                  </button>
                </div>
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
                              onClick={() => handleViewWorker(worker)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className={`btn ${worker.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              title={worker.isActive ? 'Disable worker' : 'Enable worker'}
                              onClick={() => handleToggleWorkerStatus(worker)}
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
        </div>
      </div>

      {/* Worker Details Modal */}
      {showWorkerModal && selectedWorker && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Worker Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWorkerModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Personal Information</h6>
                    <p><strong>Name:</strong> {selectedWorker.name}</p>
                    <p><strong>Email:</strong> {selectedWorker.email}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${selectedWorker.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {selectedWorker.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Branch & Location</h6>
                    <p><strong>Branch:</strong> {selectedWorker.branch?.name || 'N/A'}</p>
                    <p><strong>State:</strong> {selectedWorker.state?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-12">
                    <h6>Performance Metrics</h6>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-primary">{selectedWorker.rank || 'N/A'}</h5>
                            <p className="card-text">Rank</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-success">{selectedWorker.totalScore || 0}</h5>
                            <p className="card-text">Total Score</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-info">{selectedWorker.totalInvited || 0}</h5>
                            <p className="card-text">Invited</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-warning">{selectedWorker.totalCheckedIn || 0}</h5>
                            <p className="card-text">Checked In</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedWorker.medal && (
                  <div className="row mt-3">
                    <div className="col-md-12 text-center">
                      <h6>Achievement</h6>
                      <span className={`badge fs-6 ${
                        selectedWorker.medal === 'gold' ? 'bg-warning' :
                        selectedWorker.medal === 'silver' ? 'bg-secondary' :
                        selectedWorker.medal === 'bronze' ? 'bg-dark' : 'bg-primary'
                      }`}>
                        {selectedWorker.medal.charAt(0).toUpperCase() + selectedWorker.medal.slice(1)} Medal
                      </span>
                    </div>
                  </div>
                )}
                <div className="row mt-3">
                  <div className="col-md-12">
                    <h6>Account Information</h6>
                    <p><strong>Created:</strong> {formatDate(selectedWorker.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(selectedWorker.updatedAt)}</p>
                    {selectedWorker.approvedBy && (
                      <p><strong>Approved By:</strong> {selectedWorker.approvedBy.name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWorkerModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={`btn ${selectedWorker.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => {
                    handleToggleWorkerStatus(selectedWorker);
                    setShowWorkerModal(false);
                  }}
                >
                  {selectedWorker.isActive ? 'Disable Worker' : 'Enable Worker'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersManagement;