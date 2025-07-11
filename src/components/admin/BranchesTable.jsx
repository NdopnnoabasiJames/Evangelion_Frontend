import React from 'react';

const BranchesTable = ({ branches, filters, handleFilterChange, clearFilters, getUniqueStates, error }) => (
  <>
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
                <option key={state.id} value={state.id}>{state.name}</option>
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
            Showing {branches.length} branches
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
            <thead>
              <tr>
                <th>Rank</th>
                <th>Branch Name</th>
                <th>Location</th>
                <th>Branch Admin</th>
                <th>Score</th>
                <th>Zones</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch, index) => (
                <tr key={branch._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      {branch.medal && branch.medal !== '' ? (
                        <>
                          <i className={`bi bi-award-fill me-2 ${
                            branch.medal === 'gold' ? 'text-warning' :
                            branch.medal === 'silver' ? 'text-secondary' :
                            branch.medal === 'bronze' ? 'text-orange' : ''
                          }`} title={
                            branch.medal.charAt(0).toUpperCase() + branch.medal.slice(1) + ' Medal'
                          }></i>
                          <span className="fw-bold">{branch.rank}</span>
                          <small className="text-muted ms-2">
                            {branch.medal.charAt(0).toUpperCase() + branch.medal.slice(1)}
                          </small>
                        </>
                      ) : (
                        <span className="fw-bold">{branch.rank || index + 1}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-building text-primary me-2"></i>
                      <div>
                        <strong>{branch.name}</strong>
                      </div>
                    </div>
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
                    <span className="badge bg-success">{branch.totalScore || 0} pts</span>
                  </td>
                  <td>
                    <span className="badge bg-info">{branch.zoneCount || 0}</span>
                  </td>
                  <td>
                    <span className={`badge ${branch.isActive ? 'bg-success' : 'bg-warning'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}
  </>
);

export default BranchesTable;
