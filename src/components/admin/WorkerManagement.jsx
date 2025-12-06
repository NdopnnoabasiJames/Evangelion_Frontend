import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { StatusBadge } from '../../utils/statusUtils';
import { API_ENDPOINTS, STATUS, API_BASE_URL } from '../../utils/constants';
import workerService from '../../services/workerService';

const WorkerManagement = ({ isReadOnly = false }) => {
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [approvedWorkers, setApprovedWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState('approved');
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
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
      setPendingWorkers(Array.isArray(pendingData) ? pendingData : pendingData.data || []);
    }
  }, [pendingData]);

  // Update approved workers when data changes
  useEffect(() => {
    if (approvedData) {
      setApprovedWorkers(Array.isArray(approvedData) ? approvedData : approvedData.data || []);
    }
  }, [approvedData]);



  // Filter approved workers based on search term
  const filteredApprovedWorkers = approvedWorkers.filter(worker => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      worker.name?.toLowerCase().includes(searchLower) ||
      worker.email?.toLowerCase().includes(searchLower) ||
      worker.branch?.name?.toLowerCase().includes(searchLower) ||
      worker.approvedBy?.name?.toLowerCase().includes(searchLower) ||
      worker.approvedBy?.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleApproveWorker = async (workerId) => {
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

    setActionLoading(prev => ({ ...prev, [workerId]: 'rejecting' }));
    
    try {
      const result = await workerService.rejectWorker(workerId);
      
      // Remove from pending list
      setPendingWorkers(prev => prev.filter(worker => worker._id !== workerId));
      
      // Refetch pending list to ensure consistency
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


  const renderWorkerCard = (worker, isPending = true) => {
    return (
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
                <div className="col-6">
                  <strong>Approved by:</strong>
                  <div className="text-muted">{worker.approvedBy.name || worker.approvedBy.email}</div>
                </div>
              )}
            </div>
          </div>

          {isPending && !isReadOnly && (
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
  };


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
    <div>      {/* Tab Navigation */}
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
                <h5 className="mb-1">Approved Workers ({filteredApprovedWorkers.length})</h5>
                <p className="text-muted mb-0">
                  Workers who have been approved and can access the system
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search workers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
                  />
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                </div>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    refetchApproved();
                  }}
                  disabled={approvedLoading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>
            </div>

            {approvedLoading ? (
              <div className="row g-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="col-12">
                    <LoadingCard height="60px" />
                  </div>
                ))}
              </div>
            ) : approvedError ? (
              <ErrorDisplay 
                message={approvedError}
                onRetry={refetchApproved}
              />
            ) : filteredApprovedWorkers.length === 0 ? (
              <EmptyState 
                icon="bi-check-circle"
                title={searchTerm ? "No Workers Found" : "No Approved Workers"}
                description={searchTerm ? `No workers match your search "${searchTerm}".` : "Workers will appear here after they have been approved."}
              />
            ) : (
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="border-0">Rank</th>
                          <th scope="col" className="border-0">Worker Name</th>
                          <th scope="col" className="border-0">Score</th>
                          <th scope="col" className="border-0">Invited Guests</th>
                          <th scope="col" className="border-0">Approved</th>
                          <th scope="col" className="border-0">Approved By</th>
                          <th scope="col" className="border-0">Checked-in Guests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const sortedWorkers = filteredApprovedWorkers
                            .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)); // Sort by score descending
                          
                          // Calculate ranks and medals based on score groups
                          let currentRank = 1;
                          let medalRank = 1; // Separate counter for medal assignment
                          let previousScore = null;
                          const workersWithRanks = sortedWorkers.map((worker, index) => {
                            const score = worker.totalScore || 0;
                            
                            // If this worker has a different score than the previous, update ranks
                            if (previousScore !== null && score !== previousScore) {
                              currentRank = index + 1;
                              medalRank++; // Increment medal rank for each new score group
                            }
                            
                            // Determine medal based on medal rank (not actual rank)
                            let medal = '';
                            if (medalRank === 1) medal = 'gold';
                            else if (medalRank === 2) medal = 'platinum';
                            else if (medalRank === 3) medal = 'silver';
                            
                            previousScore = score;
                            
                            return { ...worker, rank: currentRank, medal };
                          });
                          
                          return workersWithRanks.map((worker) => (
                            <tr key={worker._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {worker.medal && (
                                    <i className={`bi bi-award-fill me-2 ${
                                      worker.medal === 'gold' ? 'text-warning' :     // Gold
                                      worker.medal === 'platinum' ? 'text-info' :    // Platinum (light blue)
                                      worker.medal === 'silver' ? 'text-secondary' :  // Silver
                                      ''
                                    }`} title={
                                      worker.medal.charAt(0).toUpperCase() + worker.medal.slice(1) + ' Medal'
                                    }></i>
                                  )}
                                  <span className="fw-bold">{worker.rank}</span>
                                  {worker.medal && (
                                    <small className="text-muted ms-2">
                                      {worker.medal.charAt(0).toUpperCase() + worker.medal.slice(1)}
                                    </small>
                                  )}
                                </div>
                              </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                                  <i className="bi bi-person-fill text-primary"></i>
                                </div>
                                <div>
                                  <div className="fw-semibold">{worker.name}</div>
                                  <small className="text-muted">{worker.email}</small>
                                  <div className="text-muted small">
                                    <i className="bi bi-building me-1"></i>
                                    {worker.branch?.name || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-success">{worker.totalScore || 0}</span>
                            </td>
                            <td>
                              <span className="text-primary fw-semibold">{worker.totalInvitedGuests || 0}</span>
                            </td>
                            <td>
                              <div className="text-muted">
                                {new Date(worker.approvedAt || worker.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td>
                              <div className="text-muted">
                                {worker.approvedBy?.name || worker.approvedBy?.email || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <span className="text-success fw-semibold">{worker.totalCheckedInGuests || 0}</span>
                                </td>
                              </tr>
                            )
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkerManagement;
