import React from 'react';

const AdminOverviewTab = ({ dashboardData, setActiveTab }) => {
  return (
    <div>
      {/* Primary Metrics Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-primary bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-people-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Total Users</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalUsers || 0}</h3>
                  {dashboardData?.recentRegistrations > 0 && (
                    <small className="text-white-75">+{dashboardData.recentRegistrations} today</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-success bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-geo-alt-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">States</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalStates || 0}</h3>
                  <small className="text-white-75">{dashboardData?.totalBranches || 0} branches</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-calendar-event-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Services/Programs</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalEvents || 0}</h3>
                  <small className="text-white-75">{dashboardData?.totalGuests || 0} guests</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm bg-info bg-gradient text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-opacity-25 backdrop-blur p-3 rounded">
                    <i className="bi bi-geo-alt-fill fs-2 text-white fw-bold"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">Zones</h6>
                  <h3 className="mb-0 text-white">{dashboardData?.totalZones || 0}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Hierarchy Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-sitemap me-2"></i>
                Admin Hierarchy Overview
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">State Admins</h6>
                      <h4 className="mb-0 text-primary">{dashboardData?.adminsByRole?.stateAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-map fa-2x text-primary"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Branch Admins</h6>
                      <h4 className="mb-0 text-success">{dashboardData?.adminsByRole?.branchAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-building fa-2x text-success"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Zonal Admins</h6>
                      <h4 className="mb-0 text-info">{dashboardData?.adminsByRole?.zonalAdmins || 0}</h4>
                    </div>
                    <i className="fas fa-layer-group fa-2x text-info"></i>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <div>
                      <h6 className="mb-1">Workers</h6>
                      <h4 className="mb-0 text-secondary">{dashboardData?.adminsByRole?.workers || 0}</h4>
                    </div>
                    <i className="fas fa-users fa-2x text-secondary"></i>
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
                <i className="fas fa-chart-pie me-2"></i>
                System Statistics
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Pickup Stations</span>
                  <strong>{dashboardData?.totalPickupStations || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-info" 
                    style={{width: `${Math.min(100, (dashboardData?.totalPickupStations || 0) * 2)}%`}}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Services/Programs</span>
                  <strong>{dashboardData?.totalEvents || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${Math.min(100, (dashboardData?.totalEvents || 0) * 5)}%`}}
                  ></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Registered Guests</span>
                  <strong>{dashboardData?.totalGuests || 0}</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div 
                    className="progress-bar bg-primary" 
                    style={{width: `${Math.min(100, (dashboardData?.totalGuests || 0) / 10)}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2 d-md-flex">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('admin-management')}
                >
                  <i className="fas fa-user-check me-2"></i>
                  Manage Admins
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    setActiveTab('events');
                  }}
                >
                  <i className="fas fa-calendar me-2"></i>
                  Manage Events
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-download me-2"></i>
                  Export System Report
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setActiveTab('states')}
                >
                  <i className="fas fa-map me-2"></i>
                  Manage States
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => setActiveTab('branches')}
                >
                  <i className="fas fa-building me-2"></i>
                  Manage Branches
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
