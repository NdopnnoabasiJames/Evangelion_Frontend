import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { StatusBadge } from '../../utils/statusUtils';
import { API_ENDPOINTS, STATUS } from '../../utils/constants';
import workerService from '../../services/workerService';

const WorkerManagement = () => {
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [approvedWorkers, setApprovedWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  // Fetch pending workers
  const { data: pendingData, loading: pendingLoading, error: pendingError, refetch: refetchPending } = useApi(
    API_ENDPOINTS.WORKERS.PENDING,
    { immediate: true }
  );

  // Fetch approved workers
  const { data: approvedData, loading: approvedLoading, error: approvedError, refetch: refetchApproved } = useApi(
    API_ENDPOINTS.WORKERS.APPROVED,
    { immediate: true }
  );
  // Update pending workers when data changes
  useEffect(() => {
    if (pendingData) {
      console.log('📋 Updating pending workers from API data:', pendingData);
      setPendingWorkers(Array.isArray(pendingData) ? pendingData : pendingData.data || []);
    }
  }, [pendingData]);

  // Update approved workers when data changes
  useEffect(() => {
    if (approvedData) {
      console.log('📋 Updating approved workers from API data:', approvedData);
      setApprovedWorkers(Array.isArray(approvedData) ? approvedData : approvedData.data || []);
    }
  }, [approvedData]);  const handleApproveWorker = async (workerId) => {
    setActionLoading(prev => ({ ...prev, [workerId]: 'approving' }));
    
    try {
      await workerService.approveWorker(workerId);
      
      // Remove from pending list
      setPendingWorkers(prev => prev.filter(worker => worker._id !== workerId));
      
      // Refetch both lists to ensure consistency
      setTimeout(() => {
        refetchPending();
        refetchApproved();
      }, 500);

    } catch (error) {
      console.error('Error approving worker:', error);
      alert(`Failed to approve worker: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [workerId]: null }));
    }
  };const handleRejectWorker = async (workerId) => {
    if (!confirm('Are you sure you want to reject this worker application?')) {
      return;
    }

    console.log('🔄 Rejecting worker:', workerId);
    setActionLoading(prev => ({ ...prev, [workerId]: 'rejecting' }));
    
    try {
      const result = await workerService.rejectWorker(workerId);
      console.log('✅ Worker rejected, result:', result);
      
      // Remove from pending list
      setPendingWorkers(prev => prev.filter(worker => worker._id !== workerId));
      
      // Refetch pending list to ensure consistency
      console.log('🔄 Refetching pending workers...');
      setTimeout(() => {
        refetchPending();
      }, 500);

    } catch (error) {
      console.error('❌ Error rejecting worker:', error);
      alert(`Failed to reject worker: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [workerId]: null }));
    }
  };

  const renderWorkerCard = (worker, isPending = true) => (
    <div key={worker._id} className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
              <i className="bi bi-person-fill text-primary"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-semibold">{worker.name}</h6>
              <small className="text-muted">{worker.email}</small>
            </div>
            <StatusBadge status={worker.status} />
          </div>

          <div className="mb-3">            <div className="row g-2 text-sm">
              <div className="col-6">
                <strong>Phone:</strong>
                <div className="text-muted">{worker.phone || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>Branch:</strong>
                <div className="text-muted">{worker.branch?.name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>State:</strong>
                <div className="text-muted">{worker.state?.name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>{isPending ? 'Applied' : 'Approved'}:</strong>
                <div className="text-muted">
                  {isPending 
                    ? new Date(worker.createdAt).toLocaleDateString()
                    : new Date(worker.approvedAt || worker.createdAt).toLocaleDateString()
                  }
                </div>
              </div>
              {!isPending && worker.approvedBy && (
                <div className="col-12">
                  <strong>Approved by:</strong>
                  <div className="text-muted">{worker.approvedBy.name || worker.approvedBy.email}</div>
                </div>
              )}
            </div>
          </div>

          {isPending && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm flex-fill"
                onClick={() => handleApproveWorker(worker._id)}
                disabled={actionLoading[worker._id]}
              >
                {actionLoading[worker._id] === 'approving' ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>
                    Approve
                  </>
                )}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRejectWorker(worker._id)}
                disabled={actionLoading[worker._id]}
              >
                {actionLoading[worker._id] === 'rejecting' ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-x-lg"></i>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (pendingLoading) {
    return (
      <div className="row g-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <LoadingCard height="250px" />
          </div>
        ))}
      </div>
    );
  }

  if (pendingError) {
    return (
      <ErrorDisplay 
        message={pendingError}
        onRetry={refetchPending}
      />
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            type="button"
          >
            <i className="bi bi-clock-history me-2"></i>
            Pending Approval
            {pendingWorkers.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingWorkers.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
            type="button"
          >
            <i className="bi bi-check-circle me-2"></i>
            Approved Workers
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'pending' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Pending Worker Applications</h5>
                <p className="text-muted mb-0">
                  Review and approve worker applications for your branch
                </p>
              </div>
              <button 
                className="btn btn-outline-primary"
                onClick={refetchPending}
                disabled={pendingLoading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>

            {pendingWorkers.length === 0 ? (
              <EmptyState 
                icon="bi-check-circle"
                title="No Pending Applications"
                description="All worker applications have been processed. New applications will appear here."
              />
            ) : (
              <div className="row g-4">
                {pendingWorkers.map(worker => renderWorkerCard(worker, true))}
              </div>
            )}
          </div>
        )}        {activeTab === 'approved' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Approved Workers ({approvedWorkers.length})</h5>
                <p className="text-muted mb-0">
                  Workers who have been approved and can access the system
                </p>
              </div>
            </div>

            {approvedLoading ? (
              <div className="row g-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="col-12 col-md-6 col-lg-4">
                    <LoadingCard height="200px" />
                  </div>
                ))}
              </div>
            ) : approvedError ? (
              <ErrorDisplay 
                message={approvedError}
                onRetry={refetchApproved}
              />
            ) : approvedWorkers.length === 0 ? (
              <EmptyState 
                icon="bi-check-circle"
                title="No Approved Workers"
                description="Workers will appear here after they have been approved."
              />
            ) : (
              <div className="row g-4">
                {approvedWorkers.map(worker => renderWorkerCard(worker, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerManagement;
