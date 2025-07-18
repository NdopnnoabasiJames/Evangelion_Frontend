import React from 'react';
import AdminApprovalCard from '../AdminApprovalCard';
import ApprovedAdminCard from '../ApprovedAdminCard';
import { LoadingCard, ErrorDisplay } from '../../common/Loading';

const AdminManagementTab = ({
  loading,
  error,
  pendingAdmins,
  approvedAdmins,
  approvedLoading,
  approvedError,
  loadPendingAdmins,
  loadApprovedAdmins,
  handleApproveAdmin,
  handleRejectAdmin
}) => {
  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="col-12">
            <LoadingCard height="200px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error}
        onRetry={loadPendingAdmins}
      />
    );
  }

  return (
    <div>
      {/* Pending Admins Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Pending State Admin Registrations</h5>
            <p className="text-muted mb-0">
              {pendingAdmins.length} registration{pendingAdmins.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={loadPendingAdmins}
            disabled={loading}
          >
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </button>
        </div>

        {pendingAdmins.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h4>No Pending Approvals</h4>
              <p className="text-muted">All State Admin registrations have been processed.</p>
            </div>
          </div>
        ) : (
          pendingAdmins.map(admin => (
            <AdminApprovalCard
              key={admin._id || admin.id}
              admin={admin}
              onApprove={handleApproveAdmin}
              onReject={handleRejectAdmin}
              loading={loading}
            />
          ))
        )}
      </div>

      {/* Approved Admins Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Approved State Admins</h5>
            <p className="text-muted mb-0">
              {approvedAdmins.length} approved admin{approvedAdmins.length !== 1 ? 's' : ''} currently active
            </p>
          </div>
          <button 
            className="btn btn-outline-success"
            onClick={loadApprovedAdmins}
            disabled={approvedLoading}
          >
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </button>
        </div>

        {approvedLoading ? (
          <div className="row g-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="col-12">
                <LoadingCard height="150px" />
              </div>
            ))}
          </div>
        ) : approvedError ? (
          <ErrorDisplay 
            message={approvedError}
            onRetry={loadApprovedAdmins}
          />
        ) : approvedAdmins.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h4>No Approved Admins</h4>
              <p className="text-muted">No State Admins have been approved yet.</p>
            </div>
          </div>
        ) : (
          approvedAdmins.map(admin => (
            <ApprovedAdminCard
              key={admin._id || admin.id}
              admin={admin}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminManagementTab;
