import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';

const ZonesManagement = () => {
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    stateFilter: 'all',
    branchFilter: 'all',
    statusFilter: 'all',
    adminFilter: 'all'
  });

  const { execute: fetchZones } = useApi(null, { immediate: false });
  const { execute: createZone, error: createError } = useApi(null, { immediate: false });
  const { execute: updateZone, error: updateError } = useApi(null, { immediate: false });
  const { execute: deleteZone } = useApi(null, { immediate: false });
  useEffect(() => {
    loadZones();
  }, []);

  // Filter zones based on search and filter criteria
  useEffect(() => {
    let filtered = [...zones];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(zone =>
        zone.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (zone.branchId?.name && zone.branchId.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (zone.branchId?.stateId?.name && zone.branchId.stateId.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (zone.zonalAdmin?.name && zone.zonalAdmin.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (zone.zonalAdmin?.email && zone.zonalAdmin.email.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Apply state filter
    if (filters.stateFilter !== 'all') {
      filtered = filtered.filter(zone => zone.branchId?.stateId?._id === filters.stateFilter);
    }

    // Apply branch filter
    if (filters.branchFilter !== 'all') {
      filtered = filtered.filter(zone => zone.branchId?._id === filters.branchFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(zone =>
        filters.statusFilter === 'active' ? zone.isActive : !zone.isActive
      );
    }

    // Apply admin filter
    if (filters.adminFilter !== 'all') {
      if (filters.adminFilter === 'has-admin') {
        filtered = filtered.filter(zone => zone.zonalAdmin);
      } else if (filters.adminFilter === 'no-admin') {
        filtered = filtered.filter(zone => !zone.zonalAdmin);
      }
    }

    setFilteredZones(filtered);
  }, [zones, filters]);

  // Update filtered zones when zones data changes
  useEffect(() => {
    setFilteredZones(zones);
  }, [zones]);

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
        // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.ZONES.ALL_WITH_ADMINS
        : API_ENDPOINTS.ZONES.BRANCH_ADMIN_LIST;
      
      const response = await fetchZones(endpoint);
      setZones(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }  };

  // Filter helper functions
  const getUniqueStates = () => {
    const states = zones
      .filter(zone => zone.branchId?.stateId?.name)
      .map(zone => ({
        id: zone.branchId.stateId._id,
        name: zone.branchId.stateId.name
      }));
    return [...new Map(states.map(state => [state.id, state])).values()]
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getUniqueBranches = () => {
    const branches = zones
      .filter(zone => zone.branchId?.name)
      .map(zone => ({
        id: zone.branchId._id,
        name: zone.branchId.name,
        stateName: zone.branchId.stateId?.name
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
      stateFilter: 'all',
      branchFilter: 'all',
      statusFilter: 'all',
      adminFilter: 'all'
    });
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.ZONES.CREATE
        : API_ENDPOINTS.ZONES.BRANCH_ADMIN_CREATE;
        
      const result = await createZone(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!result) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (createError) {
          throw new Error(createError);
        } else {
          throw new Error('Failed to create zone');
        }
      }

      setShowCreateModal(false);
      resetForm();
      loadZones();
    } catch (error) {
      console.error('Create zone error:', error);
    }
  };
  const handleUpdateZone = async (e) => {
    e.preventDefault();
    try {      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? `${API_ENDPOINTS.ZONES.UPDATE}/${editingZone._id}`
        : `${API_ENDPOINTS.ZONES.BRANCH_ADMIN_UPDATE}/${editingZone._id}`;
        
      const result = await updateZone(endpoint, {
        method: 'PATCH',
        body: formData
      });

      if (!result) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (updateError) {
          throw new Error(updateError);
        } else {
          throw new Error('Failed to update zone');
        }
      }

      setEditingZone(null);
      resetForm();
      loadZones();
    } catch (error) {
      console.error('Update zone error:', error);
    }
  };
  const handleDeleteZone = async (zone) => {
    if (window.confirm(`Are you sure you want to delete the zone "${zone.name}"?`)) {
      try {        // Use appropriate endpoint based on user role
        const endpoint = user?.role === ROLES.SUPER_ADMIN 
          ? `${API_ENDPOINTS.ZONES.DELETE}/${zone._id}`
          : `${API_ENDPOINTS.ZONES.BRANCH_ADMIN_DELETE}/${zone._id}`;
          
        await deleteZone(endpoint, {
          method: 'DELETE'
        });
        loadZones();
      } catch (error) {
        console.error('Delete zone error:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (zone) => {
    setFormData({
      name: zone.name,
      isActive: zone.isActive
    });
    setEditingZone(zone);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingZone(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-outline-danger btn-sm ms-3" 
          onClick={loadZones}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-geo-alt me-2"></i>
          Zones Management
        </h5>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Zone
        </button>
      </div>
      <div className="card-body">
        {zones.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-geo-alt text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No Zones Found</h4>
            <p className="text-muted">Click "Add Zone" to create your first zone.</p>
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create First Zone
            </button>
          </div>        ) : (
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
                    placeholder="Search zones..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
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
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              
              <div className="col-md-2">
                <select 
                  className="form-select"
                  value={filters.adminFilter}
                  onChange={(e) => handleFilterChange('adminFilter', e.target.value)}
                >
                  <option value="all">All Zones</option>
                  <option value="has-admin">Has Admin</option>
                  <option value="no-admin">No Admin</option>
                </select>
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
                Showing {filteredZones.length} of {zones.length} zones
              </small>
              {(filters.search || filters.stateFilter !== 'all' || filters.branchFilter !== 'all' || filters.statusFilter !== 'all' || filters.adminFilter !== 'all') && (
                <small className="text-info">
                  <i className="bi bi-funnel-fill me-1"></i>
                  Filters applied
                </small>
              )}
            </div>

          <div className="table-responsive">
            <table className="table table-hover">              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Branch</th>
                  <th>State</th>
                  <th>Zonal Admin</th>
                  <th>Pickup Stations</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>                {filteredZones.map(zone => (
                  <tr key={zone._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-geo-alt text-primary me-2"></i>
                        <div>
                          <strong>{zone.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {zone.branchId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {zone.branchId?.stateId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      {zone.zonalAdmin ? (
                        <div>
                          <div className="fw-bold">{zone.zonalAdmin.name}</div>
                          <small className="text-muted">{zone.zonalAdmin.email}</small>
                        </div>
                      ) : (
                        <span className="text-muted">No admin assigned</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {zone.pickupStationCount || 0} stations
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${zone.isActive ? 'bg-success' : 'bg-warning'}`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {zone.createdAt ? new Date(zone.createdAt).toLocaleDateString() : 'N/A'}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(zone)}
                          title="Edit zone"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteZone(zone)}
                          title="Delete zone"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>                  </tr>                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingZone) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingZone ? 'Edit Zone' : 'Create New Zone'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModals}
                ></button>
              </div>
              <form onSubmit={editingZone ? handleUpdateZone : handleCreateZone}>
                <div className="modal-body">
                  {(createError || updateError) && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {createError || updateError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="zoneName" className="form-label">
                      Zone Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="zoneName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter zone name"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active Zone
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!formData.name.trim()}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesManagement;
