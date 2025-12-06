import React from 'react';
import RoleSwitchingSection from './RoleSwitchingSection';

const OverviewTab = ({ user, overviewStats }) => (
  <>
    {/* Top Row - Role Management and Welcome Cards Side by Side */}
    <div className="row mb-4">
      <RoleSwitchingSection user={user} />
      <div className="col-md-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-start">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3 flex-shrink-0 d-none d-md-flex">
                <i className="bi bi-person-circle text-primary fs-5"></i>
              </div>
              <div className="flex-grow-1 min-w-0">
                <h6 className="mb-2 text-truncate">Welcome, {user?.name || 'Worker'}</h6>
                <div className="text-muted small mb-1">
                  <i className="bi bi-geo-alt me-1 d-none d-md-inline"></i>
                  <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                    {user?.state?.name ? `${user.state.name} State` : 'State not assigned'}
                    {user?.branch?.name ? `, ${user.branch.name} Branch` : ''}
                    {!user?.state?.name && !user?.branch?.name && 'Location not assigned'}
                  </span>
                </div>
                <div className="text-muted small mb-2">
                  <i className="bi bi-envelope me-1"></i>
                  <span className="text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                    {user?.email || 'Email not available'}
                  </span>
                </div>
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
        <div className="card border-0 shadow-lg card-hover-lift" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div className="card-body text-center text-white">
            <div className="display-6 mb-3">
              <i className="bi bi-calendar-event"></i>
            </div>
            <h3 className="mb-2 fw-bold">{overviewStats.totalEvents}</h3>
            <p className="mb-0 opacity-90">Total Services/Programs Participated</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-lg card-hover-lift" style={{
          background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)'
        }}>
          <div className="card-body text-center text-white">
            <div className="display-6 mb-3">
              <i className="bi bi-person-plus"></i>
            </div>
            <h3 className="mb-2 fw-bold">{overviewStats.totalRegisteredGuests}</h3>
            <p className="mb-0 opacity-90">Total Registered Guests</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card border-0 shadow-lg card-hover-lift" style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        }}>
          <div className="card-body text-center text-white">
            <div className="display-6 mb-3">
              <i className="bi bi-check-circle"></i>
            </div>
            <h3 className="mb-2 fw-bold">{overviewStats.totalCheckedInGuests}</h3>
            <p className="mb-0 opacity-90">Total Checked-in Guests</p>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default OverviewTab;