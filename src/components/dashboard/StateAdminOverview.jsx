import React from 'react';

const StateAdminOverview = ({ 
  stateStatistics, 
  dashboardData, 
  approvedBranchAdmins, 
  pendingBranchAdmins, 
  onManageBranchAdmins 
}) => {
  return (
    <div>
      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.totalBranches || dashboardData?.branches || 0}</h4>
                  <p className="mb-0">Total Branches</p>
                  <small className="opacity-75">In your state</small>
                </div>
                <i className="fas fa-building fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.totalZones || 0}</h4>
                  <p className="mb-0">Total Zones</p>
                  <small className="opacity-75">Across all branches</small>
                </div>
                <i className="fas fa-layer-group fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.activeEvents || dashboardData?.activeEvents || 0}</h4>
                  <p className="mb-0">Active Events</p>
                  <small className="opacity-75">Currently running</small>
                </div>
                <i className="fas fa-calendar fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card bg-purple text-white h-100" style={{backgroundColor: 'var(--primary-purple)'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{stateStatistics.totalGuests || dashboardData?.totalGuests || 0}</h4>
                  <p className="mb-0">Total Guests</p>
                  <small className="opacity-75">Registered in state</small>
                </div>
                <i className="fas fa-users fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State Management Overview */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                State Management Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Branch Admins</h6>
                      <h4 className="mb-0 text-success">{approvedBranchAdmins.length}</h4>
                    </div>
                    <i className="fas fa-user-tie fa-2x text-success"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Pending Approvals</h6>
                      <h4 className="mb-0 text-warning">{pendingBranchAdmins.length}</h4>
                    </div>
                    <i className="fas fa-clock fa-2x text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={onManageBranchAdmins}
                >
                  <i className="fas fa-user-check me-2"></i>
                  Manage Branch Admins
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Create State Event
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="fas fa-download me-2"></i>
                  Export State Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateAdminOverview;
