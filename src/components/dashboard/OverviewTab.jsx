import React from 'react';

const OverviewTab = ({ user, overviewStats }) => (
  <div>
    {/* Worker Information Card */}
    <div className="row mb-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <i className="bi bi-person-circle text-primary fs-4"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-1">Welcome, {user?.name || 'Worker'}</h5>
                <div className="text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  {user?.state?.name ? `${user.state.name} State` : 'State not assigned'}
                  {user?.branch?.name ? `, ${user.branch.name} Branch` : ''}
                  {!user?.state?.name && !user?.branch?.name && 'Location not assigned'}
                </div>
                <small className="text-muted">
                  <i className="bi bi-envelope me-1"></i>
                  {user?.email || 'Email not available'}
                </small>
              </div>
              <div className="text-end">
                <span className="badge bg-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Active Worker
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Stats Cards */}
    <div className="row">
      <div className="col-md-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <div className="display-6 text-primary mb-2">
              <i className="bi bi-calendar-event"></i>
            </div>
            <h3 className="mb-1">{overviewStats.totalEvents}</h3>
            <p className="text-muted mb-0">Total Events Participated</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <div className="display-6 text-success mb-2">
              <i className="bi bi-person-plus"></i>
            </div>
            <h3 className="mb-1">{overviewStats.totalRegisteredGuests}</h3>
            <p className="text-muted mb-0">Total Registered Guests</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <div className="display-6 text-info mb-2">
              <i className="bi bi-check-circle"></i>
            </div>
            <h3 className="mb-1">{overviewStats.totalCheckedInGuests}</h3>
            <p className="text-muted mb-0">Total Checked-in Guests</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OverviewTab;
