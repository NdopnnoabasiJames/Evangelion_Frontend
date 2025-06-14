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
      <div className="row g-4 mb-4">        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-success-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-20 p-3 rounded">
                    <i className="bi bi-building fs-3 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Branches</h6>
                  <h3 className="mb-0 text-white">{stateStatistics.totalBranches || dashboardData?.branches || 0}</h3>
                  <small className="text-white-50">In your state</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-info-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-20 p-3 rounded">
                    <i className="bi bi-diagram-3 fs-3 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Zones</h6>
                  <h3 className="mb-0 text-white">{stateStatistics.totalZones || 0}</h3>
                  <small className="text-white-50">Across all branches</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-warning-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-20 p-3 rounded">
                    <i className="bi bi-calendar-event-fill fs-3 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Active Events</h6>
                  <h3 className="mb-0 text-white">{stateStatistics.activeEvents || dashboardData?.activeEvents || 0}</h3>
                  <small className="text-white-50">Currently running</small>
                </div>
              </div>
            </div>
          </div>
        </div>        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-purple-gradient text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">                <div className="flex-shrink-0">
                  <div className="bg-opacity-20 p-3 rounded">
                    <i className="bi bi-people-fill fs-3 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-white-50 mb-1">Total Guests</h6>
                  <h3 className="mb-0 text-white">{stateStatistics.totalGuests || dashboardData?.totalGuests || 0}</h3>
                  <small className="text-white-50">Registered in state</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State Management Overview */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">              <h5 className="mb-0">
                <i className="bi bi-diagram-3 me-2"></i>
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
                    <i className="bi bi-person-badge fs-2 text-success"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Pending Approvals</h6>
                      <h4 className="mb-0 text-warning">{pendingBranchAdmins.length}</h4>
                    </div>
                    <i className="bi bi-clock fs-2 text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">                <i className="bi bi-lightning-charge me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={onManageBranchAdmins}
                >
                  <i className="bi bi-person-check me-2"></i>
                  Manage Branch Admins
                </button>
                <button className="btn btn-outline-primary">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Create State Event
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-download me-2"></i>
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
