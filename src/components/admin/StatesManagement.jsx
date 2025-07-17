import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { showReadOnlyAlert } from '../../utils/readOnlyHelpers';
import { analyticsService } from '../../services/analyticsService';
import { exportToExcel } from '../../utils/exportUtils';

const StatesManagement = ({ isReadOnly = false }) => {  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingState, setEditingState] = useState(null);
  // State filters
  const [stateFilters, setStateFilters] = useState({
    adminFilter: 'all',
    statusFilter: 'all',
    activityFilter: 'all'
  });
  const { execute: fetchStates } = useApi(null, { immediate: false });
  const { execute: createState, error: createError } = useApi(null, { immediate: false });
  const { execute: updateState, error: updateError } = useApi(null, { immediate: false });

  useEffect(() => {
    loadStates();
  }, []);
  const loadStates = async () => {    try {
      setLoading(true);
      setError(null);
      
      // Fetch states and rankings in parallel
      const [statesResponse, rankingsResponse] = await Promise.all([
        fetchStates(API_ENDPOINTS.STATES.LIST),
        analyticsService.getStateRankings().catch(() => ({ data: [] }))
      ]);
      
      const statesData = statesResponse?.data || statesResponse || [];
      const rankingsData = rankingsResponse?.data || rankingsResponse || [];
      
      // Create a map of rankings by state ID
      const rankingsMap = new Map();
      rankingsData.forEach((ranking) => {
        rankingsMap.set(ranking._id || ranking.stateId, {
          rank: ranking.rank,
          medal: ranking.medal,
          totalScore: ranking.totalScore || 0
        });
      });
      
      // Merge ranking data with states data
      const mergedStates = statesData.map(state => ({
        ...state,
        ...rankingsMap.get(state._id)
      }));
      
      // Sort by rank (if available) or by name
      mergedStates.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      });
      
      setStates(mergedStates);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load states');
    } finally {
      setLoading(false);
    }
  };  // Helper functions for state filtering
  const getFilteredStates = () => {
    return states.filter(state => {
      // Admin filter
      if (stateFilters.adminFilter !== 'all') {
        if (stateFilters.adminFilter === 'has-admin' && !state.stateAdmin) {
          return false;
        }
        if (stateFilters.adminFilter === 'no-admin' && state.stateAdmin) {
          return false;
        }
      }

      // Status filter
      if (stateFilters.statusFilter !== 'all') {
        if (stateFilters.statusFilter === 'active' && !state.isActive) {
          return false;
        }
        if (stateFilters.statusFilter === 'inactive' && state.isActive) {
          return false;
        }
      }

      // Activity filter
      if (stateFilters.activityFilter !== 'all') {
        if (stateFilters.activityFilter === 'has-branches' && (state.branchCount || 0) === 0) {
          return false;
        }
        if (stateFilters.activityFilter === 'no-branches' && (state.branchCount || 0) > 0) {
          return false;
        }
        if (stateFilters.activityFilter === 'has-zones' && (state.zoneCount || 0) === 0) {
          return false;
        }
        if (stateFilters.activityFilter === 'no-zones' && (state.zoneCount || 0) > 0) {
          return false;
        }
      }

      return true;
    });
  };

  const handleFilterChange = (filterType, value) => {
    setStateFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setStateFilters({
      adminFilter: 'all',
      statusFilter: 'all',
      activityFilter: 'all'
    });
  };

  const handleCreateState = async (formData) => {
    try {
      const result = await createState(API_ENDPOINTS.STATES.CREATE, {
        method: 'POST',
        body: formData
      });

      // If result is null/undefined, it means there was an error
      if (!result) {
        // Wait a bit for error state to update, then check
        await new Promise(resolve => setTimeout(resolve, 100));
        if (createError) {
          throw new Error(createError);
        } else {
          throw new Error('Failed to create state');
        }
      }

      if (window.showNotification) {
        window.showNotification('State created successfully!', 'success');
      }

      setShowCreateModal(false);
      loadStates(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };  const handleUpdateState = async (formData) => {
    try {
      const result = await updateState(`${API_ENDPOINTS.STATES.UPDATE}/${editingState._id}`, {
        method: 'PATCH',
        body: formData
      });

      // If result is null/undefined, it means there was an error
      if (!result) {
        // Wait a bit for error state to update, then check
        await new Promise(resolve => setTimeout(resolve, 100));
        if (updateError) {
          throw new Error(updateError);
        } else {
          throw new Error('Failed to update state');
        }
      }

      if (window.showNotification) {
        window.showNotification('State updated successfully!', 'success');
      }

      setEditingState(null);
      loadStates(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportStates = () => {
    const columns = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'State Name' },
      { key: 'stateAdminName', label: 'State Admin Name' },
      { key: 'stateAdminEmail', label: 'State Admin Email' },
      { key: 'score', label: 'Score' },
      { key: 'branchCount', label: 'Branches Count' },
      { key: 'zoneCount', label: 'Zones Count' },
      { key: 'createdAt', label: 'Created Date' },
      { key: 'status', label: 'Status' },
      { key: 'medal', label: 'Medal' }
    ];

    const exportData = filteredStates.map(state => ({
      rank: state.rank || '',
      name: state.name,
      stateAdminName: state.stateAdmin?.name || 'No admin assigned',
      stateAdminEmail: state.stateAdmin?.email || '',
      score: state.totalScore || 0,
      branchCount: state.branchCount || 0,
      zoneCount: state.zoneCount || 0,
      createdAt: formatDate(state.createdAt),
      status: state.isActive ? 'Active' : 'Inactive',
      medal: state.medal ? state.medal.charAt(0).toUpperCase() + state.medal.slice(1) : ''
    }));

    const filename = `States_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading states...</p>
        </div>
      </div>
    );
  }

  const filteredStates = getFilteredStates();

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-map me-2"></i>
              States Management
            </h5>
            <small className="text-muted">Manage all states in the system</small>
          </div>
          <button 
            className={`btn btn-primary ${isReadOnly ? 'disabled' : ''}`}
            onClick={() => {
              if (isReadOnly) {
                showReadOnlyAlert('create new states');
                return;
              }
              setShowCreateModal(true);
            }}
            disabled={isReadOnly}
            title={isReadOnly ? 'Read-only mode - Cannot create states' : 'Add new state'}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New State {isReadOnly && <i className="bi bi-lock-fill ms-1"></i>}
          </button>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          
          {/* Read-only indicator for M&E roles */}
          {isReadOnly && (
            <div className="alert alert-info mb-3" role="alert">
              <i className="bi bi-eye me-2"></i>
              <strong>Monitoring & Evaluation Mode:</strong> You are viewing in read-only mode. Data modification is not permitted for M&E roles.
            </div>
          )}
          
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted mb-0">
                Filters
                {(stateFilters.adminFilter !== 'all' || 
                  stateFilters.statusFilter !== 'all' || 
                  stateFilters.activityFilter !== 'all') && (
                  <span className="badge bg-info ms-2">
                    <i className="fas fa-filter me-1"></i>
                    Active
                  </span>
                )}
              </h6>
              <small className="text-muted">
                Showing {filteredStates.length} of {states.length} states
              </small>
            </div>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-bold">Admin Assignment</label>
                <select
                  className="form-select"
                  value={stateFilters.adminFilter}
                  onChange={e => handleFilterChange('adminFilter', e.target.value)}
                >
                  <option value="all">All States</option>
                  <option value="has-admin">Has Admin</option>
                  <option value="no-admin">No Admin Assigned</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Status</label>
                <select
                  className="form-select"
                  value={stateFilters.statusFilter}
                  onChange={e => handleFilterChange('statusFilter', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Activity Level</label>
                <select
                  className="form-select"
                  value={stateFilters.activityFilter}
                  onChange={e => handleFilterChange('activityFilter', e.target.value)}
                >
                  <option value="all">All States</option>
                  <option value="has-branches">Has Branches</option>
                  <option value="no-branches">No Branches</option>
                  <option value="has-zones">Has Zones</option>
                  <option value="no-zones">No Zones</option>
                </select>
              </div>
              <div className="col-md-3">
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={clearFilters}
                    disabled={stateFilters.adminFilter === 'all' && 
                             stateFilters.statusFilter === 'all' && 
                             stateFilters.activityFilter === 'all'}
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>          {states.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-map text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="text-muted mt-3">No States Found</h6>
              <p className="text-muted">No states have been created yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create First State
              </button>
            </div>
          ) : filteredStates.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-filter text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="text-muted mt-3">No States Match Your Filters</h6>
              <p className="text-muted">Try adjusting your filter criteria or clear all filters to see all states.</p>
              <button 
                className="btn btn-outline-primary"
                onClick={clearFilters}
              >
                <i className="fas fa-times me-2"></i>
                Clear All Filters
              </button>
            </div>) : (
            <>
              {/* Export Button */}
              <div className="d-flex justify-content-end mb-3">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={handleExportStates}
                  disabled={filteredStates.length === 0}
                >
                  <i className="bi bi-download me-2"></i>
                  Export to Excel ({filteredStates.length} states)
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>State Name</th>
                      <th>State Admin</th>
                      <th>Score</th>
                      <th>Branches</th>
                      <th>Zones</th>
                      <th>Created</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStates.map((state, index) => (
                      <tr key={state._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {state.medal && state.medal !== '' ? (
                              <i className={`bi bi-award-fill me-2 ${
                                state.medal === 'gold' ? 'text-warning' :     // Gold
                                state.medal === 'silver' ? 'text-secondary' :  // Silver
                                state.medal === 'bronze' ? 'text-orange' : ''  // Bronze
                              }`} title={
                                state.medal.charAt(0).toUpperCase() + state.medal.slice(1) + ' Medal'
                              }></i>
                            ) : null}
                            <span className="fw-bold">{state.rank || index + 1}</span>
                            {state.medal && state.medal !== '' && (
                              <small className="text-muted ms-2">
                                {state.medal.charAt(0).toUpperCase() + state.medal.slice(1)}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-geo-alt text-primary me-2"></i>
                            <div>
                              <strong>{state.name}</strong>                          </div>
                          </div>
                        </td>
                        <td>
                          {state.stateAdmin ? (
                            <div>
                              <div className="fw-bold">{state.stateAdmin.name}</div>
                              <small className="text-muted">{state.stateAdmin.email}</small>
                            </div>
                          ) : (
                            <span className="text-muted">No admin assigned</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {state.totalScore || 0} pts
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">{state.branchCount || 0}</span>
                        </td><td>
                          <span className="badge bg-success">{state.zoneCount || 0}</span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(state.createdAt)}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${state.isActive ? 'bg-success' : 'bg-warning'}`}>
                            {state.isActive ? 'Active' : 'Inactive'}
                          </span>
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

      {/* Create/Edit Modal */}
      {(showCreateModal || editingState) && (
        <StateFormModal
          state={editingState}
          onHide={() => {
            setShowCreateModal(false);
            setEditingState(null);
          }}
          onSubmit={editingState ? handleUpdateState : handleCreateState}
        />
      )}
    </>
  );
};

// State Form Modal Component
const StateFormModal = ({ state, onHide, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!state;

  // Reset form data when state changes (for editing)
  useEffect(() => {
    if (state) {
      setFormData({
        name: state.name || '',
        isActive: state.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        isActive: true
      });
    }
  }, [state]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        isActive: formData.isActive
      };

      await onSubmit(submitData);
      onHide();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-map me-2"></i>
              {isEditing ? `Edit ${state.name}` : 'Create New State'}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-1"></i>
                    State Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lagos, Abuja, Kano"
                    required
                  />
                  <div className="form-text">Enter the full name of the state</div>
                </div>              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    <i className="bi bi-check-circle me-1"></i>
                    Active State
                  </label>
                  <div className="form-text">
                    Inactive states won't be available for admin registration
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || !formData.name.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-2"></i>
                    {isEditing ? 'Update State' : 'Create State'}
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

export default StatesManagement;
