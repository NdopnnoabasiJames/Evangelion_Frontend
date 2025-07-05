import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { toast } from 'react-toastify';
import { exportToExcel } from '../../utils/exportUtils';

const RegistrarsManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [registrars, setRegistrars] = useState([]);
  const [pendingRegistrars, setPendingRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    stateFilter: '',
    branchFilter: ''
  });
  
  // Dropdown data
  const [states, setStates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);

  const { execute: fetchRegistrars } = useApi(null, { immediate: false });
  const { execute: fetchPendingRegistrars } = useApi(null, { immediate: false });
  const { execute: fetchStates } = useApi(null, { immediate: false });
  const { execute: fetchBranches } = useApi(null, { immediate: false });
  const { execute: approveRegistrar } = useApi(null, { immediate: false });
  const { execute: rejectRegistrar } = useApi(null, { immediate: false });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllRegistrars();
    } else {
      loadPendingRegistrars();
    }
  }, [activeTab, filters]);

  // Filter branches when state changes - fetch branches by state from backend
  useEffect(() => {
    if (filters.stateFilter) {
      loadBranchesByState(filters.stateFilter);
      // Reset branch filter when state changes
      if (filters.branchFilter) {
        setFilters(prev => ({ ...prev, branchFilter: '' }));
      }
    } else {
      setFilteredBranches(branches);
    }
  }, [filters.stateFilter]);

  const loadBranchesByState = async (stateId) => {
    try {
      const response = await fetchBranches(`/api/branches/by-state/${stateId}`);
      setFilteredBranches(response?.data || response || []);
    } catch (error) {
      console.error('Error loading branches for state:', error);
      setFilteredBranches([]);
    }
  };

  const loadInitialData = async () => {
    try {
      const [statesResponse, branchesResponse] = await Promise.all([
        fetchStates(API_ENDPOINTS.STATES.LIST),
        fetchBranches(API_ENDPOINTS.BRANCHES.LIST)
      ]);

      setStates(statesResponse?.data || []);
      setBranches(branchesResponse?.data || []);
      setFilteredBranches(branchesResponse?.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.stateFilter) params.append('stateId', filters.stateFilter);
    if (filters.branchFilter) params.append('branchId', filters.branchFilter);
    return params.toString();
  };

  const loadAllRegistrars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const url = `${API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_ALL}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetchRegistrars(url);
      setRegistrars(response?.data || response || []);
    } catch (error) {
      console.error('Error loading registrars:', error);
      setError(error.message || 'Failed to load registrars');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRegistrars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams();
      const url = `${API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_PENDING}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetchPendingRegistrars(url);
      setPendingRegistrars(response?.data || response || []);
    } catch (error) {
      console.error('Error loading pending registrars:', error);
      setError(error.message || 'Failed to load pending registrars');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrarId) => {
    setActionLoading(prev => ({ ...prev, [registrarId]: 'approving' }));
    
    try {
      await approveRegistrar(API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_APPROVE, {
        method: 'POST',
        body: JSON.stringify({ registrarId }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      toast.success('Registrar approved successfully!');
      
      // Refresh data
      if (activeTab === 'all') {
        loadAllRegistrars();
      } else {
        loadPendingRegistrars();
      }
    } catch (error) {
      console.error('Error approving registrar:', error);
      toast.error(error.message || 'Failed to approve registrar');
    } finally {
      setActionLoading(prev => ({ ...prev, [registrarId]: null }));
    }
  };

  const handleReject = async (registrarId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(prev => ({ ...prev, [registrarId]: 'rejecting' }));
    
    try {
      await rejectRegistrar(API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_REJECT, {
        method: 'POST',
        body: JSON.stringify({ registrarId, reason }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      toast.success('Registrar rejected successfully!');
      
      // Refresh data
      if (activeTab === 'all') {
        loadAllRegistrars();
      } else {
        loadPendingRegistrars();
      }
    } catch (error) {
      console.error('Error rejecting registrar:', error);
      toast.error(error.message || 'Failed to reject registrar');
    } finally {
      setActionLoading(prev => ({ ...prev, [registrarId]: null }));
    }
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
      stateFilter: '',
      branchFilter: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export functions for registrars
  const handleExportRegistrars = () => {
    const columns = [
      { key: 'name', label: 'Registrar Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'state', label: 'State' },
      { key: 'branch', label: 'Branch' },
      { key: 'assignedZones', label: 'Assigned Zones' },
      { key: 'status', label: 'Status' },
      { key: 'approvedBy', label: 'Approved By' },
      { key: 'approvedAt', label: 'Approved Date' },
      { key: 'createdAt', label: 'Created Date' }
    ];

    const exportData = registrars.map(registrar => ({
      name: registrar.name,
      email: registrar.email || '',
      phone: registrar.phone || '',
      state: registrar.state?.name || '',
      branch: registrar.branch?.name || '',
      assignedZones: registrar.assignedZones?.length || 0,
      status: registrar.isApproved ? 'Approved' : 'Pending',
      approvedBy: registrar.approvedBy?.name || '',
      approvedAt: registrar.approvedAt ? formatDate(registrar.approvedAt) : '',
      createdAt: formatDate(registrar.createdAt)
    }));

    const filename = `Registrars_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const handleExportPendingRegistrars = () => {
    const columns = [
      { key: 'name', label: 'Registrar Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'state', label: 'State' },
      { key: 'branch', label: 'Branch' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created Date' }
    ];

    const exportData = pendingRegistrars.map(registrar => ({
      name: registrar.name,
      email: registrar.email || '',
      phone: registrar.phone || '',
      state: registrar.state?.name || '',
      branch: registrar.branch?.name || '',
      status: 'Pending',
      createdAt: formatDate(registrar.createdAt)
    }));

    const filename = `Pending_Registrars_Export_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, columns, filename);
  };

  const currentData = activeTab === 'all' ? registrars : pendingRegistrars;
  const pendingCount = pendingRegistrars.length;

  if (loading && currentData.length === 0) {
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
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-people-fill me-2"></i>
          Registrars Management
        </h5>
      </div>
      <div className="card-body">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="bi bi-list-ul me-2"></i>
              All Registrars
              <span className="badge bg-primary ms-2">{registrars.length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <i className="bi bi-clock me-2"></i>
              Pending Approval
              {pendingCount > 0 && (
                <span className="badge bg-warning ms-2">{pendingCount}</span>
              )}
            </button>
          </li>
        </ul>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

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
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-md-3">
            <select 
              className="form-select"
              value={filters.stateFilter}
              onChange={(e) => handleFilterChange('stateFilter', e.target.value)}
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state._id} value={state._id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-3">
            <select 
              className="form-select"
              value={filters.branchFilter}
              onChange={(e) => handleFilterChange('branchFilter', e.target.value)}
              disabled={!filters.stateFilter}
            >
              <option value="">All Branches</option>
              {filteredBranches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
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

        {/* Results */}
        {currentData.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
            <h6 className="text-muted mt-3">
              {activeTab === 'all' ? 'No Registrars Found' : 'No Pending Registrars'}
            </h6>
            <p className="text-muted">
              {activeTab === 'all' 
                ? 'No registrars match your current filters.' 
                : 'All registrars have been processed.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                {activeTab === 'all' ? 'All Registrars' : 'Pending Approval'}
              </h6>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={activeTab === 'all' ? handleExportRegistrars : handleExportPendingRegistrars}
                title="Export to Excel"
              >
                <i className="bi bi-file-earmark-excel me-1"></i>
                Export
              </button>
            </div>
            <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>State</th>
                  <th>Branch</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  {activeTab === 'all' && <th>Checked-in Guests</th>}
                  {activeTab === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentData.map((registrar) => (
                  <tr key={registrar._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person text-primary me-2"></i>
                        <strong>{registrar.name}</strong>
                      </div>
                    </td>
                    <td>{registrar.email}</td>
                    <td>
                      <span className="badge bg-info">
                        {registrar.state?.name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {registrar.branch?.name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {new Date(registrar.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${registrar.isApproved ? 'bg-success' : 'bg-warning'}`}>
                        {registrar.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    {activeTab === 'all' && (
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-check text-success me-2"></i>
                          <span className="fw-bold">
                            {registrar.checkedInGuests || registrar.totalCheckedIn || 0}
                          </span>
                        </div>
                      </td>
                    )}
                    {activeTab === 'pending' && (
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(registrar._id)}
                            disabled={actionLoading[registrar._id]}
                            title="Approve registrar"
                          >
                            {actionLoading[registrar._id] === 'approving' ? (
                              <span className="spinner-border spinner-border-sm me-1"></span>
                            ) : (
                              <i className="bi bi-check-lg me-1"></i>
                            )}
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleReject(registrar._id)}
                            disabled={actionLoading[registrar._id]}
                            title="Reject registrar"
                          >
                            {actionLoading[registrar._id] === 'rejecting' ? (
                              <span className="spinner-border spinner-border-sm me-1"></span>
                            ) : (
                              <i className="bi bi-x-lg me-1"></i>
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegistrarsManagement;
