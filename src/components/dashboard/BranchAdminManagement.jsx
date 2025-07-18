import React from 'react';
import AdminApprovalCard from './AdminApprovalCard';
import ApprovedAdminCard from './ApprovedAdminCard';
import { LoadingCard, ErrorDisplay } from '../common/Loading';

const BranchAdminManagement = ({
  pendingBranchAdmins,
  approvedBranchAdmins,
  loading,
  approvedLoading,
  error,
  approvedError,
  onApproveBranchAdmin,
  onRejectBranchAdmin,
  onRefreshPending,
  onRefreshApproved
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
        onRetry={onRefreshPending}
      />
    );
  }

  return (
    <div>
      {/* Pending Branch Admins Section */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Pending Branch Admin Registrations</h5>
            <p className="text-muted mb-0">
              {pendingBranchAdmins.length} registration{pendingBranchAdmins.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={onRefreshPending}
            disabled={loading}
          >
            <i className="fas fa-refresh me-2"></i>
            Refresh
          </button>
        </div>

        {pendingBranchAdmins.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h4>No Pending Approvals</h4>
              <p className="text-muted">All Branch Admin registrations have been processed.</p>
            </div>
          </div>
        ) : (
          pendingBranchAdmins.map(admin => (
            <AdminApprovalCard
              key={admin._id || admin.id}
              admin={admin}
              onApprove={onApproveBranchAdmin}
              onReject={onRejectBranchAdmin}
              loading={loading}
            />
          ))
        )}
      </div>

      {/* Approved Branch Admins Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Approved Branch Admins</h5>
            <p className="text-muted mb-0">
              {approvedBranchAdmins.length} approved admin{approvedBranchAdmins.length !== 1 ? 's' : ''} currently active
            </p>
          </div>
          <button 
            className="btn btn-outline-success"
            onClick={onRefreshApproved}
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
            onRetry={onRefreshApproved}
          />
        ) : approvedBranchAdmins.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h4>No Approved Branch Admins</h4>
              <p className="text-muted">No Branch Admins have been approved yet.</p>
            </div>
          </div>
        ) : (
          approvedBranchAdmins.map(admin => (
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

export default BranchAdminManagement;
