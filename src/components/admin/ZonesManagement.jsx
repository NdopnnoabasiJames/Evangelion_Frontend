import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';
import ZonesTable from './ZonesTable';
import PendingZonesTable from './PendingZonesTable';
import adminManagementService from '../../services/adminManagement';
import { exportToExcel } from '../../utils/exportUtils';

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
  const [activeTab, setActiveTab] = useState('all');
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    pickupStationsFilter: 'all',
    branchFilter: 'all',
    statusFilter: 'all',
    adminFilter: 'all'
  });

  const { execute: fetchZones } = useApi(null, { immediate: false });
  const { execute: createZone, error: createError } = useApi(null, { immediate: false });
  const { execute: updateZone, error: updateError } = useApi(null, { immediate: false });
  const { execute: deleteZone } = useApi(null, { immediate: false });
  const { execute: approveZone, error: approveError } = useApi(null, { immediate: false });
  const { execute: rejectZone, error: rejectError } = useApi(null, { immediate: false });

  useEffect(() => {
    loadZones();
  }, []);

  // Filter zones based on search and filter criteria
  useEffect(() => {
    let filtered = [...zones];    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(zone =>
        zone.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (zone.branchId?.name && zone.branchId.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (zone.zonalAdmin?.name && zone.zonalAdmin.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (zone.zonalAdmin?.email && zone.zonalAdmin.email.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }// Apply pickup stations filter
    if (filters.pickupStationsFilter !== 'all') {
      if (filters.pickupStationsFilter === 'has-stations') {
        filtered = filtered.filter(zone => zone.pickupStationCount > 0);
      } else if (filters.pickupStationsFilter === 'no-stations') {
        filtered = filtered.filter(zone => zone.pickupStationCount === 0);
      }
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
      let endpoint;
      if (user?.role === ROLES.SUPER_ADMIN) {
        endpoint = API_ENDPOINTS.ZONES.ALL_WITH_ADMINS;
      } else if (user?.role === ROLES.STATE_ADMIN) {
        endpoint = API_ENDPOINTS.ZONES.STATE_ADMIN_LIST;
      } else {
        endpoint = API_ENDPOINTS.ZONES.BRANCH_ADMIN_LIST;
      }
      const response = await fetchZones(endpoint);
      setZones(response?.data || response || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };
  // Filter helper functions
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
      pickupStationsFilter: 'all',
      branchFilter: 'all',
      statusFilter: 'all',
      adminFilter: 'all'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export functions for different tabs
  const handleExportZones = () => {
    const columns = [
      { key: 'name', label: 'Zone Name' },
      { key: 'branch', label: 'Branch' },
      { key: 'state', label: 'State' },
      { key: 'zonalAdmin', label: 'Zonal Admin' },
      { key: 'adminEmail', label: 'Admin Email' },
      { key: 'pickupStations', label: 'Pickup Stations' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created Date' }
    ];

    const exportData = filteredZones.map(zone => ({
      name: zone.name,
      branch: zone.branchId?.name || '',
      state: zone.branchId?.stateId?.name || '',
      zonalAdmin: zone.zonalAdmin?.name || 'No admin assigned',
      adminEmail: zone.zonalAdmin?.email || '',
      pickupStations: zone.pickupStations?.length || 0,
      status: zone.isActive ? 'Active' : 'Inactive',
      createdAt: formatDate(zone.createdAt)
    }));

    const filename = `Zones_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const handleExportPendingZones = () => {
    const columns = [
      { key: 'name', label: 'Zone Name' },
      { key: 'branch', label: 'Branch' },
      { key: 'state', label: 'State' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created Date' }
    ];

    const exportData = pendingZones.map(zone => ({
      name: zone.name,
      branch: zone.branchId?.name || '',
      state: zone.branchId?.stateId?.name || '',
      status: zone.status || 'pending',
      createdAt: formatDate(zone.createdAt)
    }));

    const filename = `Pending_Zones_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const handleExportRejectedZones = () => {
    const columns = [
      { key: 'name', label: 'Zone Name' },
      { key: 'branch', label: 'Branch' },
      { key: 'state', label: 'State' },
      { key: 'createdAt', label: 'Created Date' }
    ];

    const exportData = rejectedZones.map(zone => ({
      name: zone.name,
      branch: zone.branchId?.name || '',
      state: zone.branchId?.stateId?.name || '',
      createdAt: formatDate(zone.createdAt)
    }));

    const filename = `Rejected_Zones_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      // Always set isActive to false for branch admins
      let zoneData = { ...formData };
      if (user?.role === ROLES.BRANCH_ADMIN) {
        zoneData.isActive = false;
      }
      const endpoint = user?.role === ROLES.SUPER_ADMIN 
        ? API_ENDPOINTS.ZONES.CREATE
        : API_ENDPOINTS.ZONES.BRANCH_ADMIN_CREATE;
      const result = await createZone(endpoint, {
        method: 'POST',
        body: zoneData
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

  // Approve zone handler
  const handleApproveZone = async (zone) => {
    try {
      await adminManagementService.approveZone(zone._id);
      if (window.showNotification) {
        window.showNotification('Zone approved successfully!', 'success');
      }
      loadZones();
      // Refresh pending zones after approval
      if (activeTab === 'pending') {
        // Re-run the pending zones fetch logic
        let response;
        if (user?.role === ROLES.BRANCH_ADMIN) {
          response = await fetchZones(API_ENDPOINTS.ZONES.BRANCH_ADMIN_PENDING || '/api/zones/branch-admin/pending');
        } else if (user?.role === ROLES.SUPER_ADMIN) {
          response = await fetchZones('/api/zones/status/pending');
        } else if (user?.role === ROLES.STATE_ADMIN) {
          response = await fetchZones('/api/zones/status/pending');
        }
        let arr = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        setPendingZones(arr);
      }
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(
          'Failed to approve zone: ' + (error?.message || approveError || 'Unknown error'),
          'error'
        );
      } else {
        alert('Failed to approve zone: ' + (error?.message || approveError || 'Unknown error'));
      }
    }
  };

  // Reject zone handler
  const handleRejectZone = async (zone) => {
    try {
      let endpoint = `${API_ENDPOINTS.ZONES.REJECT}/${zone._id}`;
      await rejectZone(endpoint, { method: 'PATCH' });
      if (window.showNotification) {
        window.showNotification('Zone rejected.', 'success');
      }
      loadZones();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(
          'Failed to reject zone: ' + (error?.message || rejectError || 'Unknown error'),
          'error'
        );
      } else {
        alert('Failed to reject zone: ' + (error?.message || rejectError || 'Unknown error'));
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

  // Helper: filter zones by status for subtabs
  const [pendingZones, setPendingZones] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Fetch pending zones for the correct role when pending tab is active
  useEffect(() => {
    const fetchPendingZones = async () => {
      if (activeTab !== 'pending') return;
      setPendingLoading(true);
      try {
        let response;
        if (user?.role === ROLES.BRANCH_ADMIN) {
          response = await fetchZones(API_ENDPOINTS.ZONES.BRANCH_ADMIN_PENDING || '/api/zones/branch-admin/pending');
        } else if (user?.role === ROLES.SUPER_ADMIN) {
          response = await fetchZones('/api/zones/status/pending');
        } else if (user?.role === ROLES.STATE_ADMIN) {
          response = await fetchZones('/api/zones/status/pending');
        }
        // Always extract array from response
        let arr = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        setPendingZones(arr);
      } catch (err) {
        setPendingZones([]);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingZones();
    // Only depend on user and activeTab to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  // Add rejectedZones state and fetch logic
  const [rejectedZones, setRejectedZones] = useState([]);
  const [rejectedLoading, setRejectedLoading] = useState(false);

  // Fetch rejected zones for the correct role when rejected tab is active
  useEffect(() => {
    const fetchRejectedZones = async () => {
      if (activeTab !== 'rejected') return;
      setRejectedLoading(true);
      try {
        let response;
        if (user?.role === ROLES.BRANCH_ADMIN) {
          response = await fetchZones(API_ENDPOINTS.ZONES.BRANCH_ADMIN_REJECTED || '/api/zones/branch-admin/rejected');
        } else if (user?.role === ROLES.SUPER_ADMIN) {
          response = await fetchZones('/api/zones/status/rejected');
        } else if (user?.role === ROLES.STATE_ADMIN) {
          response = await fetchZones('/api/zones/status/rejected');
        }
        let arr = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        setRejectedZones(arr);
      } catch (err) {
        setRejectedZones([]);
      } finally {
        setRejectedLoading(false);
      }
    };
    fetchRejectedZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

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
        {/* Subtabs */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>
              All
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link${activeTab === 'pending' ? ' active' : ''}`} onClick={() => setActiveTab('pending')}>
              Pending Approval
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link${activeTab === 'rejected' ? ' active' : ''}`} onClick={() => setActiveTab('rejected')}>
              Rejected
            </button>
          </li>
        </ul>
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
                placeholder="Search by zone name, branch, or admin..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
            <div className="col-md-2">
            <select 
              className="form-select"
              value={filters.pickupStationsFilter}
              onChange={(e) => handleFilterChange('pickupStationsFilter', e.target.value)}
            >
              <option value="all">All Zones</option>
              <option value="has-stations">Has Pickup Stations</option>
              <option value="no-stations">No Pickup Stations</option>
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
            {activeTab === 'all' && (
              <>Showing {filteredZones.length} of {zones.length} zofnes</>
            )}
            {activeTab === 'pending' && (
              <>Showing {pendingZones.length} pending zone{pendingZones.length !== 1 ? 's' : ''}</>
            )}
            {activeTab === 'rejected' && (
              <>Showing {rejectedZones.length} rejected zone{rejectedZones.length !== 1 ? 's' : ''}</>
            )}
          </small>
          {(filters.search || filters.stateFilter !== 'all' || filters.branchFilter !== 'all' || filters.statusFilter !== 'all' || filters.adminFilter !== 'all') && (
            <small className="text-info">
              <i className="bi bi-funnel-fill me-1"></i>
              Filters applied
            </small>
          )}
        </div>
        {activeTab === 'all' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">All Zones</h6>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleExportZones}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i>
                Export
              </button>
            </div>
            {filteredZones.length > 0 ? (
              <ZonesTable
                zones={filteredZones}
                onEdit={openEditModal}
                onDelete={handleDeleteZone}
              />
            ) : (
              <div className="text-center text-muted py-5">No zones found.</div>
            )}
          </>
        )}
        {activeTab === 'pending' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Pending Approval</h6>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleExportPendingZones}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i>
                Export
              </button>
            </div>
            {user?.role === ROLES.BRANCH_ADMIN ? (
              pendingLoading ? (
                <div className="text-center text-muted py-5">Loading pending zones...</div>
              ) : pendingZones.length > 0 ? (
                <PendingZonesTable
                  zones={pendingZones}
                  onEdit={openEditModal}
                  onDelete={handleDeleteZone}
                  onApprove={handleApproveZone}
                  onReject={handleRejectZone}
                  user={user}
                />
              ) : (
                <div className="text-center text-muted py-5">No pending zones.</div>
              )
            ) : (
              pendingZones.length > 0 ? (
                <PendingZonesTable
                  zones={pendingZones}
                  onEdit={openEditModal}
                  onDelete={handleDeleteZone}
                  onApprove={handleApproveZone}
                  onReject={handleRejectZone}
                  user={user}
                />
              ) : (
                <div className="text-center text-muted py-5">No pending zones.</div>
              )
            )}
          </>
        )}
        {activeTab === 'rejected' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Rejected Zones</h6>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleExportRejectedZones}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i>
                Export
              </button>
            </div>
            {rejectedZones.length > 0 ? (
              <ZonesTable
                zones={rejectedZones}
                onEdit={openEditModal}
                onDelete={handleDeleteZone}
              />
            ) : (
              <div className="text-center text-muted py-5">No rejected zones.</div>
            )}
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
                    {/* Only show Active Zone checkbox for super admins */}
                    {user?.role === ROLES.SUPER_ADMIN && (
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
                    )}
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
