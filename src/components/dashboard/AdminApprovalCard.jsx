import React, { useState } from 'react';

const AdminApprovalCard = ({ admin, onApprove, onReject, loading = false }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const adminId = admin._id || admin.id;
      
      if (!adminId) {
        throw new Error('Admin ID is missing from admin object');
      }
      
      await onApprove(adminId);
    } finally {
      setActionLoading(false);
    }
  };
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      const adminId = admin._id || admin.id;
      
      if (!adminId) {
        throw new Error('Admin ID is missing from admin object');
      }
      
      await onReject(adminId, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="card border-warning mb-3">        <div className="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-warning">
            <i className="fas fa-clock me-2"></i>
            Pending Approval
          </h6>          <span className="badge bg-warning text-dark">
            {admin.role === 'zonal_admin' ? 'Zonal Coordinator' : 
             admin.role === 'state_admin' ? 'State Admin' : 
             admin.role === 'branch_admin' ? 'Branch Pastor' : 
             'Admin'}
          </span>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <h5 className="card-title mb-2">
                {admin.firstName} {admin.lastName}
              </h5>              <div className="text-muted mb-3">
                <div><strong>Name:</strong> {admin.name}</div>
                <div><strong>Email:</strong> {admin.email}</div>
                <div><strong>State:</strong> {
                  typeof admin.state === 'object' && admin.state?.name 
                    ? admin.state.name 
                    : admin.state || 'N/A'
                }</div>
                {admin.branch && (
                  <div><strong>Branch:</strong> {
                    typeof admin.branch === 'object' && admin.branch?.name 
                      ? admin.branch.name 
                      : admin.branch || 'N/A'
                  }</div>
                )}
                {admin.zone && (
                  <div><strong>Zone:</strong> {
                    typeof admin.zone === 'object' && admin.zone?.name 
                      ? admin.zone.name 
                      : admin.zone || 'N/A'
                  }</div>
                )}
                <div><strong>Applied:</strong> {formatDate(admin.createdAt)}</div>
              </div>
              
              {admin.reason && (
                <div className="mb-3">
                  <small className="text-muted"><strong>Application Reason:</strong></small>
                  <p className="mb-0 text-secondary">{admin.reason}</p>
                </div>
              )}
            </div>
            
            <div className="col-md-4 text-end">
              <div className="d-flex flex-column gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={loading || actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Approve
                    </>
                  )}
                </button>
                
                <button
                  className="btn btn-danger"
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading || actionLoading}
                >
                  <i className="fas fa-times me-2"></i>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Application</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to reject the application from{' '}
                  <strong>{admin.firstName} {admin.lastName}</strong>?
                </p>
                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Reason for rejection <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="rejectionReason"
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminApprovalCard;
