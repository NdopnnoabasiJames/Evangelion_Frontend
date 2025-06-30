import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import { analyticsService } from '../../services/analyticsService';
import adminManagementService from '../../services/adminManagement';
import BranchModal from './BranchModal';
import BranchesTable from './BranchesTable';

const BranchesManagement = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pendingBranches, setPendingBranches] = useState([]);
  const [rejectedBranches, setRejectedBranches] = useState([]);

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

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use appropriate endpoint based on user role
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.BRANCHES.ALL_WITH_ADMINS
        : API_ENDPOINTS.BRANCHES.STATE_ADMIN_LIST;
      // Fetch branches and rankings in parallel
      const [branchesResponse, rankingsResponse] = await Promise.all([
        fetchBranches(endpoint),
        analyticsService.getBranchRankings(
          user?.role === ROLES.STATE_ADMIN && user?.state?._id ? { stateId: user.state._id } : {}
        ).catch(() => ({ data: [] }))
      ]);
      const branchesData = branchesResponse?.data || branchesResponse || [];
      const rankingsData = rankingsResponse?.data || rankingsResponse || [];
      // Create a map of rankings by branch ID
      const rankingsMap = new Map();
      rankingsData.forEach((ranking) => {
        rankingsMap.set(ranking._id || ranking.branchId, {
          rank: ranking.rank,
          medal: ranking.medal,
          totalScore: ranking.totalScore || 0
        });
      });
      // Merge ranking data with branches data
      const mergedBranches = branchesData.map(branch => ({
        ...branch,
        ...rankingsMap.get(branch._id)
      }));
      // Sort by rank (if available) or by name
      mergedBranches.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      });
      setBranches(mergedBranches);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBranches = async () => {
    try {
      setLoading(true);
      let data;
      if (user?.role === 'state_admin' && user?.state?._id) {
        data = await adminManagementService.getPendingBranchesForStateAdmin();
      } else {
        data = await adminManagementService.getBranchesByStatus('pending');
      }
      // Fix: extract array from data property if present
      let filtered = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setPendingBranches(filtered);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load pending branches');
    } finally {
      setLoading(false);
    }
  };

  const loadRejectedBranches = async () => {
    try {
      setLoading(true);
      let data;
      if (user?.role === 'state_admin' && user?.state?._id) {
        // State admin: call state-admin-specific endpoint
        data = await adminManagementService.getRejectedBranchesForStateAdmin();
      } else {
        // Super admin: call super admin endpoint
        data = await adminManagementService.getBranchesByStatus('rejected');
      }
      setRejectedBranches(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load rejected branches');
    } finally {
      setLoading(false);
    }
  };

  // Load branches and pending/rejected branches based on user role
  useEffect(() => {
    loadBranches();
    if (user?.role === ROLES.SUPER_ADMIN) {
      loadPendingBranches();
      loadRejectedBranches();
    }
  }, []);

  // Fetch pending/rejected branches when activeTab changes
  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingBranches();
    }
    if (activeTab === 'rejected') {
      loadRejectedBranches();
    }
  }, [activeTab]);

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

  const handleApproveBranch = async (branchId) => {
    try {
      await adminManagementService.approveBranch(branchId);
      if (window.showNotification) {
        window.showNotification('Branch approved successfully!', 'success');
      }
      loadPendingBranches();
      loadRejectedBranches();
      loadBranches();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(
          error?.response?.data?.message || error?.message || 'Failed to approve branch',
          'error'
        );
      }
    }
  };
  const handleRejectBranch = async (branchId) => {
    try {
      await adminManagementService.rejectBranch(branchId);
      if (window.showNotification) {
        window.showNotification('Branch rejected.', 'success');
      }
      loadPendingBranches();
      loadRejectedBranches();
      loadBranches();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(
          error?.response?.data?.message || error?.message || 'Failed to reject branch',
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
          {/* Sub-tabs for Super Admin and State Admin: Pending Approval and Rejected */}
          {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.STATE_ADMIN) && (
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'pending' ? ' active' : ''}`} onClick={() => setActiveTab('pending')}>Pending Approval</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link${activeTab === 'rejected' ? ' active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
              </li>
            </ul>
          )}
          {/* Tab content */}
          {activeTab === 'all' && (
            <BranchesTable
              branches={filteredBranches}
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
              getUniqueStates={getUniqueStates}
              error={error}
              setEditingBranch={setEditingBranch}
              handleDeleteBranch={handleDeleteBranch}
            />
          )}
          {activeTab === 'pending' && (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th><i className="bi bi-building"></i> Branch Name</th>
                      <th><i className="bi bi-geo-alt"></i> Location</th>
                      <th><i className="bi bi-info-circle"></i> Status</th>
                      {user?.role === ROLES.SUPER_ADMIN && <th><i className="bi bi-flag"></i> State</th>}
                      <th><i className="bi bi-calendar"></i> Created</th>
                      {user?.role === ROLES.SUPER_ADMIN && <th><i className="bi bi-gear"></i> Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBranches.map(branch => (
                      <tr key={branch._id}>
                        <td><i className="bi bi-building text-primary me-1"></i> {branch.name}</td>
                        <td><i className="bi bi-geo-alt text-secondary me-1"></i> {branch.location}</td>
                        <td><span className={`badge bg-warning text-dark`}><i className="bi bi-hourglass-split me-1"></i> {branch.status}</span></td>
                        {user?.role === ROLES.SUPER_ADMIN && <td><i className="bi bi-flag text-info me-1"></i> {branch.stateId?.name}</td>}
                        <td><i className="bi bi-calendar text-muted me-1"></i> {formatDate(branch.createdAt)}</td>
                        {user?.role === ROLES.SUPER_ADMIN && (
                          <td>
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleApproveBranch(branch._id)}><i className="bi bi-check-circle me-1"></i>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRejectBranch(branch._id)}><i className="bi bi-x-circle me-1"></i>Reject</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingBranches.length === 0 && <div className="text-center text-muted py-4">No pending branches.</div>}
              </div>
            </>
          )}
          {activeTab === 'rejected' && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Location</th>
                    {user?.role === ROLES.SUPER_ADMIN && <th>State</th>}
                    <th>Created</th>
                    {user?.role === ROLES.SUPER_ADMIN && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rejectedBranches.map(branch => (
                    <tr key={branch._id}>
                      <td>{branch.name}</td>
                      <td>{branch.location}</td>
                      {user?.role === ROLES.SUPER_ADMIN && <td>{branch.stateId?.name}</td>}
                      <td>{formatDate(branch.createdAt)}</td>
                      {user?.role === ROLES.SUPER_ADMIN && (
                        <td>
                          <button className="btn btn-success btn-sm" onClick={() => handleApproveBranch(branch._id)}>Approve</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rejectedBranches.length === 0 && <div className="text-center text-muted py-4">No rejected branches.</div>}
            </div>
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

export default BranchesManagement;
