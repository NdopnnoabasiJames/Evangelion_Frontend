import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';

const BranchesManagement = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    stateFilter: 'all',
    statusFilter: 'all',
    adminFilter: 'all'
  });

  const { execute: fetchBranches } = useApi(null, { immediate: false });
  const { execute: createBranch, error: createError } = useApi(null, { immediate: false });
  const { execute: updateBranch, error: updateError } = useApi(null, { immediate: false });
  const { execute: deleteBranch } = useApi(null, { immediate: false });

  useEffect(() => {
    loadBranches();
  }, []);
  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
        // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.BRANCHES.ALL_WITH_ADMINS
        : API_ENDPOINTS.BRANCHES.STATE_ADMIN_LIST;
      
      const response = await fetchBranches(endpoint);
      setBranches(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }  };

  // Filter branches based on search and filter criteria
  useEffect(() => {
    let filtered = [...branches];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(branch =>
        branch.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (branch.location && branch.location.toLowerCase().includes(filters.search.toLowerCase())) ||
        (branch.stateId?.name && branch.stateId.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (branch.branchAdmin?.name && branch.branchAdmin.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (branch.branchAdmin?.email && branch.branchAdmin.email.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Apply state filter
    if (filters.stateFilter !== 'all') {
      filtered = filtered.filter(branch => branch.stateId?._id === filters.stateFilter);
    }

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(branch =>
        filters.statusFilter === 'active' ? branch.isActive : !branch.isActive
      );
    }

    // Apply admin filter
    if (filters.adminFilter !== 'all') {
      if (filters.adminFilter === 'has-admin') {
        filtered = filtered.filter(branch => branch.branchAdmin);
      } else if (filters.adminFilter === 'no-admin') {
        filtered = filtered.filter(branch => !branch.branchAdmin);
      }
    }

    setFilteredBranches(filtered);
  }, [branches, filters]);

  // Update filtered branches when branches data changes
  useEffect(() => {
    setFilteredBranches(branches);
  }, [branches]);

  // Filter helper functions
  const getUniqueStates = () => {
    const states = branches
      .filter(branch => branch.stateId?.name)
      .map(branch => ({
        id: branch.stateId._id,
        name: branch.stateId.name
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
      stateFilter: 'all',
      statusFilter: 'all',
      adminFilter: 'all'
    });
  };

  const handleCreateBranch = async (formData) => {
    try {      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.BRANCHES.CREATE
        : API_ENDPOINTS.BRANCHES.STATE_ADMIN_CREATE;
        
      const result = await createBranch(endpoint, {
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
          throw new Error('Failed to create branch');
        }
      }

      if (window.showNotification) {
        window.showNotification('Branch created successfully!', 'success');
      }

      setShowCreateModal(false);
      loadBranches(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };
  const handleUpdateBranch = async (formData) => {
    try {      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? `${API_ENDPOINTS.BRANCHES.UPDATE}/${editingBranch._id}`
        : `${API_ENDPOINTS.BRANCHES.STATE_ADMIN_UPDATE}/${editingBranch._id}`;
        
      const result = await updateBranch(endpoint, {
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
          throw new Error('Failed to update branch');
        }
      }

      if (window.showNotification) {
        window.showNotification('Branch updated successfully!', 'success');
      }

      setEditingBranch(null);
      loadBranches(); // Refresh the list
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };
  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? `${API_ENDPOINTS.BRANCHES.DELETE}/${branchId}`
        : `${API_ENDPOINTS.BRANCHES.STATE_ADMIN_DELETE}/${branchId}`;
        
      await deleteBranch(endpoint, {
        method: 'DELETE'
      });

      if (window.showNotification) {
        window.showNotification('Branch deleted successfully!', 'success');
      }

      loadBranches(); // Refresh the list
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.message || error.message || 'Failed to delete branch',
          'error'
        );
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-building me-2"></i>
              Branches Management
            </h5>
            <small className="text-muted">Manage branches in {user?.state?.name || 'your state'}</small>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Branch
          </button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {branches.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-building text-muted" style={{ fontSize: '3rem' }}></i>
              <h6 className="text-muted mt-3">No Branches Found</h6>
              <p className="text-muted">No branches have been created in your state yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create First Branch
              </button>
            </div>          ) : (
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
                      placeholder="Search branches..."
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
                    <option value="all">All Branches</option>
                    <option value="has-admin">Has Admin</option>
                    <option value="no-admin">No Admin</option>
                  </select>
                </div>
                
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Clear
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  Showing {filteredBranches.length} of {branches.length} branches
                </small>
                {(filters.search || filters.stateFilter !== 'all' || filters.statusFilter !== 'all' || filters.adminFilter !== 'all') && (
                  <small className="text-info">
                    <i className="bi bi-funnel-fill me-1"></i>
                    Filters applied
                  </small>
                )}
              </div>

            <div className="table-responsive">
              <table className="table table-hover">
                <thead>                  <tr>
                    <th>Branch Name</th>
                    <th>State</th>
                    <th>Location</th>
                    <th>Branch Admin</th>
                    <th>Zones</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>                  {filteredBranches.map(branch => (
                    <tr key={branch._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-building text-primary me-2"></i>
                          <div>
                            <strong>{branch.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {branch.stateId?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {branch.location}
                        </small>
                      </td>
                      <td>
                        {branch.branchAdmin ? (
                          <div>
                            <div className="fw-bold">{branch.branchAdmin.name}</div>
                            <small className="text-muted">{branch.branchAdmin.email}</small>
                          </div>
                        ) : (
                          <span className="text-muted">No admin assigned</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-info">{branch.zoneCount || 0}</span>
                      </td>
                      <td>
                        <span className={`badge ${branch.isActive ? 'bg-success' : 'bg-warning'}`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setEditingBranch(branch)}
                            title="Edit branch"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteBranch(branch._id)}
                            title="Delete branch"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          <button
                            className="btn btn-outline-info"
                            title="View details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Branch Modal */}
      {(showCreateModal || editingBranch) && (
        <BranchModal
          branch={editingBranch}
          onHide={() => {
            setShowCreateModal(false);
            setEditingBranch(null);
          }}
          onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch}
        />
      )}
    </>
  );
};

// Branch Modal Component
const BranchModal = ({ branch, onHide, onSubmit }) => {  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!branch;
  // Reset form data when branch changes (for editing)
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        location: branch.location || '',
        phone: branch.phone || '',
        email: branch.email || '',
        isActive: branch.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        location: '',
        phone: '',
        email: '',
        isActive: true
      });
    }
  }, [branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);    try {
      const submitData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        isActive: formData.isActive
      };

      await onSubmit(submitData);
      onHide();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save branch');
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
              <i className="bi bi-building me-2"></i>
              {isEditing ? `Edit ${branch.name}` : 'Create New Branch'}
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
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-building me-1"></i>
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lagos Central Branch"
                    required
                  />
                  <div className="form-text">Enter a unique name for this branch within your state</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-1"></i>
                    Location/Address *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Victoria Island, Lagos"
                    required
                  />
                  <div className="form-text">Enter the branch location or address</div>
                </div>              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-telephone me-1"></i>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +234 xxx xxx xxxx"
                    required
                  />
                  <div className="form-text">Enter the branch contact phone number</div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <i className="bi bi-envelope me-1"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., branch@example.com"
                  />
                  <div className="form-text">Optional: Branch email address</div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
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
                      Active Branch
                    </label>
                  </div>
                  <div className="form-text">Active branches can accept new members and events</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !formData.name.trim() || !formData.location.trim() || !formData.phone.trim()}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check me-2"></i>
                    {isEditing ? 'Update Branch' : 'Create Branch'}
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

export default BranchesManagement;
