import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../utils/constants';
import { TabPane, TabContent, TabbedInterface } from '../common/TabNavigation';
import Loading, { ErrorDisplay, EmptyState } from '../common/Loading';

const ZoneAdminManagement = ({ onPendingCountChange, isReadOnly = false }) => {
  const [activeTab, setActiveTab] = useState('pending');
  
  // API hooks for zone admin management
  const { 
    data: pendingRequests, 
    loading: pendingLoading, 
    error: pendingError, 
    execute: refetchPending 
  } = useApi(API_ENDPOINTS.ADMIN.PENDING_ZONE_ADMINS);

  const { 
    data: approvedAdmins, 
    loading: approvedLoading, 
    error: approvedError, 
    execute: refetchApproved 
  } = useApi(API_ENDPOINTS.ADMIN.APPROVED_ZONE_ADMINS);  const { execute: approveAdmin } = useApi(null, { immediate: false });
  const { execute: rejectAdmin } = useApi(null, { immediate: false });
  const handleApprove = async (adminId) => {
    try {
      await approveAdmin(`${API_ENDPOINTS.ADMIN.APPROVE_ZONE_ADMIN}/${adminId}`, {
        method: 'POST',
        body: {
          approvedBy: 'Branch Pastor',
          approvedAt: new Date().toISOString()
        }
      });
      
      if (window.showNotification) {
        window.showNotification('Zone admin approved successfully!', 'success');
      }
      
      refetchPending();
      refetchApproved();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`Failed to approve admin: ${error.message}`, 'error');
      }
    }
  };
  const handleReject = async (adminId) => {
    try {
      await rejectAdmin(`${API_ENDPOINTS.ADMIN.REJECT_ZONE_ADMIN}/${adminId}`, {
        method: 'POST',
        body: {
          reason: 'Request rejected by branch pastor'
        }
      });
      
      if (window.showNotification) {
        window.showNotification('Zone admin request rejected', 'success');
      }
      
      refetchPending();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`Failed to reject admin: ${error.message}`, 'error');
      }
    }
  };

  const refreshAll = () => {
    refetchPending();
    refetchApproved();
  };
  const renderPendingRequests = () => {
    if (pendingLoading) return <Loading />;
    if (pendingError) return <ErrorDisplay message={pendingError} onRetry={refetchPending} />;
    
    // Ensure pendingRequests is an array
    const requestsList = Array.isArray(pendingRequests) ? pendingRequests : 
                        Array.isArray(pendingRequests?.data) ? pendingRequests.data : [];
    
    if (requestsList.length === 0) {
      return (
        <EmptyState 
          icon="bi-person-check"
          title="No Pending Requests"
          description="All zone admin requests have been processed. New requests will appear here."
        />
      );
    }

    return (
      <div className="row g-4">
        {requestsList.map((admin) => (
          <div key={admin._id} className="col-md-6">
            <div className="card border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="bi bi-person-badge me-2"></i>
                    {admin.name}
                  </h6>
                  <span className="badge bg-warning">Pending</span>
                </div>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-envelope me-1"></i>
                    {admin.email}
                  </small>
                  {admin.phone && (
                    <small className="text-muted d-block">
                      <i className="bi bi-phone me-1"></i>
                      {admin.phone}
                    </small>
                  )}
                  {admin.zone && (
                    <small className="text-muted d-block">
                      <i className="bi bi-geo-alt me-1"></i>
                      Requested Zone: {admin.zone.name}
                    </small>
                  )}
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    Requested: {new Date(admin.createdAt).toLocaleDateString()}
                  </small>
                </div>

                {!isReadOnly && (
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-success btn-sm flex-fill"
                      onClick={() => handleApprove(admin._id)}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Approve
                    </button>
                    <button 
                      className="btn btn-danger btn-sm flex-fill"
                      onClick={() => handleReject(admin._id)}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const renderApprovedAdmins = () => {
    if (approvedLoading) return <Loading />;
    if (approvedError) return <ErrorDisplay message={approvedError} onRetry={refetchApproved} />;
    
    // Ensure approvedAdmins is an array
    const adminsList = Array.isArray(approvedAdmins) ? approvedAdmins : 
                      Array.isArray(approvedAdmins?.data) ? approvedAdmins.data : [];
    
    if (adminsList.length === 0) {
      return (
        <EmptyState 
          icon="bi-people"
          title="No Zone Admins"
          description="No zone admins have been approved yet. Approved admins will appear here."
        />
      );
    }

    return (
      <div className="row g-4">
        {adminsList.map((admin) => (
          <div key={admin._id} className="col-md-6">
            <div className="card border-success">
              <div className="card-header bg-success bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="bi bi-person-check me-2"></i>
                    {admin.name}
                  </h6>
                  <span className="badge bg-success">Active</span>
                </div>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-envelope me-1"></i>
                    {admin.email}
                  </small>
                  {admin.phone && (
                    <small className="text-muted d-block">
                      <i className="bi bi-phone me-1"></i>
                      {admin.phone}
                    </small>
                  )}
                  {admin.zone && (
                    <small className="text-success d-block">
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      Zone: {admin.zone.name}
                    </small>
                  )}
                </div>
                
                <div className="row">
                  <div className="col-6">
                    <small className="text-muted">
                      <i className="bi bi-calendar-check me-1"></i>
                      Approved: {new Date(admin.approvedAt || admin.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">
                      Status: 
                      <span className={`ms-1 ${admin.isActive ? 'text-success' : 'text-warning'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="zone-admin-management">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Zone Admin Management</h4>
          <p className="text-muted mb-0">Approve zone admin requests and manage existing zone admins</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={refreshAll}
          disabled={pendingLoading || approvedLoading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>      <TabbedInterface
        tabs={[
          {
            key: 'pending',
            label: 'Pending Requests',
            icon: 'bi-clock-history',
            badge: pendingRequests?.length ? { count: pendingRequests.length, className: 'bg-warning' } : null
          },
          {
            key: 'approved',
            label: 'Approved Admins',
            icon: 'bi-people'
          }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <TabPane tabId="pending">
          <div className="mb-3">
            <h6>Zone Admin Approval Requests</h6>
            <p className="text-muted">
              Review and approve zone admin requests for your branch. Approved admins will be able to manage zones within your branch.
            </p>
          </div>
          {renderPendingRequests()}
        </TabPane>

        <TabPane tabId="approved">
          <div className="mb-3">
            <h6>Active Zone Admins</h6>
            <p className="text-muted">
              Zone admins who have been approved and are managing zones within your branch.
            </p>
          </div>
          {renderApprovedAdmins()}
        </TabPane>
      </TabbedInterface>
    </div>
  );
};

export default ZoneAdminManagement;
