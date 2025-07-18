import React from 'react';

const ApprovedAdminCard = ({ admin }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'state_admin':
        return 'primary';
      case 'branch_admin':
      case 'branch_me':
        return 'success';
      case 'zonal_admin':
        return 'info';
      case 'worker':
        return 'warning';
      case 'registrar':
        return 'secondary';
      default:
        return 'dark';
    }
  };

  const formatRoleName = (role) => {
    if (!role) return 'Unknown Role';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="card mb-3 border-success">
      <div className="card-body">
        <div className="row align-items-center">
          {/* Admin Info */}          <div className="col-md-6">
            <div className="mb-2">
              <h6 className="mb-0 text-success fw-bold">{admin.name || 'N/A'}</h6>
              <small className="text-muted">{admin.email || 'N/A'}</small>
            </div>
            
            <div className="mb-2">
              <span className={`badge bg-${getRoleBadgeColor(admin.role)} me-2`}>
                {formatRoleName(admin.role)}
              </span>
              <span className="badge bg-success">
                <i className="fas fa-check me-1"></i>
                Approved
              </span>
            </div>
          </div>

          {/* Location & Approval Info */}
          <div className="col-md-6">
            <div className="text-md-end">
              {/* Location Information */}
              <div className="mb-2">
                {admin.state && (
                  <small className="text-muted d-block">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    State: {admin.state.name || admin.state}
                  </small>
                )}
                {admin.branch && (
                  <small className="text-muted d-block">
                    <i className="fas fa-building me-1"></i>
                    Branch: {admin.branch.name || admin.branch}
                    {admin.branch.location && ` (${admin.branch.location})`}
                  </small>
                )}
                {admin.zone && (
                  <small className="text-muted d-block">
                    <i className="fas fa-map me-1"></i>
                    Zone: {admin.zone.name || admin.zone}
                  </small>
                )}
              </div>

              {/* Approval Information */}
              <div className="text-muted">
                {admin.approvedBy && (
                  <small className="d-block">
                    <i className="fas fa-user-check me-1"></i>
                    Approved by: {admin.approvedBy.name || admin.approvedBy.email || 'System'}
                  </small>
                )}                <small className="d-block">
                  <i className="fas fa-calendar me-1"></i>
                  Approved: {formatDate(admin.updatedAt)}
                </small>
                <small className="d-block">
                  <i className="fas fa-toggle-on me-1 text-success"></i>
                  Status: Active
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovedAdminCard;
