import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { ROLES, API_ENDPOINTS } from '../constants';
import { adminManagementService } from '../services/adminManagementService';
import { analyticsService } from '../services/analyticsService';
import { exportToExcel } from '../utils/exportUtils';
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

  // ...existing code...

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
    <div className="responsive-container">
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
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">All Branches</h6>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={handleExportBranches}
                  title="Export to Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Export
                </button>
              </div>
              <BranchesTable
                branches={filteredBranches}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                getUniqueStates={getUniqueStates}
                error={error}
              />
            </>
          )}
          {activeTab === 'pending' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Pending Approval</h6>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={handleExportPendingBranches}
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
                      <th><i className="bi bi-building"></i> Branch Name</th>
                      <th><i className="bi bi-geo-alt"></i> Location</th>
                      <th><i className="bi bi-info-circle"></i> Status</th>
                      {user?.role === ROLES.SUPER_ADMIN && <th><i className="bi bi-flag"></i> State</th>}
                      <th><i className="bi bi-calendar"></i> Created</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingBranches.length === 0 && <div className="text-center text-muted py-4">No pending branches.</div>}
              </div>
            </>
          )}
          {activeTab === 'rejected' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Rejected Branches</h6>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={handleExportRejectedBranches}
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
                      <th>Branch Name</th>
                      <th>Location</th>
                      {user?.role === ROLES.SUPER_ADMIN && <th>State</th>}
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedBranches.map(branch => (
                      <tr key={branch._id}>
                        <td>{branch.name}</td>
                        <td>{branch.location}</td>
                        {user?.role === ROLES.SUPER_ADMIN && <td>{branch.stateId?.name}</td>}
                        <td>{formatDate(branch.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rejectedBranches.length === 0 && <div className="text-center text-muted py-4">No rejected branches.</div>}
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
    </div>
  );
};

export default BranchesManagement;