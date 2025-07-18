import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { StatusBadge } from '../../utils/statusUtils';
import { API_ENDPOINTS, STATUS, API_BASE_URL } from '../../utils/constants';
import workerService from '../../services/workerService';

const WorkerManagement = ({ isReadOnly = false }) => {
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [approvedWorkers, setApprovedWorkers] = useState([]);
  const [pendingVolunteerRequests, setPendingVolunteerRequests] = useState([]);
  const [approvedEventWorkers, setApprovedEventWorkers] = useState([]);
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

  // Fetch pending volunteer requests
  const { data: volunteerRequestsData, loading: volunteerRequestsLoading, error: volunteerRequestsError, refetch: refetchVolunteerRequests } = useApi(
    `${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/pending`,
    { immediate: false }
  );

  // Fetch approved event workers
  const { data: eventWorkersData, loading: eventWorkersLoading, error: eventWorkersError, refetch: refetchEventWorkers } = useApi(
    `${API_ENDPOINTS.WORKERS.BASE}/admin/approved-event-workers`,
    { immediate: false }
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

  // Update volunteer requests when data changes
  useEffect(() => {
    if (volunteerRequestsData) {
      setPendingVolunteerRequests(Array.isArray(volunteerRequestsData) ? volunteerRequestsData : volunteerRequestsData.data || []);
    }
  }, [volunteerRequestsData]);

  // Update approved event workers when data changes
  useEffect(() => {
    if (eventWorkersData) {
      setApprovedEventWorkers(Array.isArray(eventWorkersData) ? eventWorkersData : eventWorkersData.data || []);
    }
  }, [eventWorkersData]);

  // Load volunteer data when Event Volunteers tab is active
  useEffect(() => {
    if (activeTab === 'event-volunteers') {
      refetchVolunteerRequests();
      refetchEventWorkers();
    }
  }, [activeTab]);

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

  const handleApproveVolunteerRequest = async (eventId, requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: 'approving' }));
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/${eventId}/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to approve volunteer request: ${response.status}`);
      }

      // Remove from pending list
      setPendingVolunteerRequests(prev => prev.filter(req => req.requestId !== requestId));
      
      // Refetch both lists to ensure consistency
      setTimeout(() => {
        refetchVolunteerRequests();
        refetchEventWorkers();
      }, 500);

      alert('Volunteer request approved successfully!');

    } catch (error) {
      console.error('❌ Error approving volunteer request:', error);
      alert(`Failed to approve volunteer request: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleRejectVolunteerRequest = async (eventId, requestId) => {
    if (!confirm('Are you sure you want to reject this volunteer request?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [requestId]: 'rejecting' }));
    
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/${eventId}/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to reject volunteer request: ${response.status}`);
      }

      // Remove from pending list
      setPendingVolunteerRequests(prev => prev.filter(req => req.requestId !== requestId));
      
      // Refetch pending list to ensure consistency
      setTimeout(() => {
        refetchVolunteerRequests();
      }, 500);

      alert('Volunteer request rejected.');

    } catch (error) {
      console.error('❌ Error rejecting volunteer request:', error);
      alert(`Failed to reject volunteer request: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
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

  const renderVolunteerRequestCard = (request) => (
    <div key={request.requestId} className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-warning bg-opacity-10 p-2 me-3">
              <i className="bi bi-calendar-event text-warning"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-semibold">{request.eventName}</h6>
              <small className="text-muted">
                {new Date(request.eventDate).toLocaleDateString()}
              </small>
            </div>
            <span className="badge bg-warning">Pending</span>
          </div>

          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <div className="rounded-circle bg-primary bg-opacity-10 p-1 me-2">
                <i className="bi bi-person text-primary" style={{ fontSize: '0.8rem' }}></i>
              </div>
              <div>
                <div className="fw-semibold">{request.worker?.name}</div>
                <small className="text-muted">{request.worker?.email}</small>
              </div>
            </div>
            
            <div className="row g-2 text-sm">
              <div className="col-6">
                <strong>Branch:</strong>
                <div className="text-muted">{request.worker?.branch?.name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>Requested:</strong>
                <div className="text-muted">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm flex-fill"
                onClick={() => handleApproveVolunteerRequest(request.eventId, request.requestId)}
                disabled={actionLoading[request.requestId]}
              >
                {actionLoading[request.requestId] === 'approving' ? (
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
                onClick={() => handleRejectVolunteerRequest(request.eventId, request.requestId)}
                disabled={actionLoading[request.requestId]}
              >
                {actionLoading[request.requestId] === 'rejecting' ? (
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

  const renderEventWorkersCard = (eventWorker) => (
    <div key={eventWorker.eventId} className="mb-4">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1 fw-semibold">{eventWorker.eventName}</h6>
              <small className="text-muted">
                <i className="bi bi-calendar me-1"></i>
                {new Date(eventWorker.eventDate).toLocaleDateString()}
              </small>
            </div>
            <span className="badge bg-success">
              {eventWorker.workers.length} Worker{eventWorker.workers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {eventWorker.workers.map(worker => (
              <div key={worker.id} className="col-md-6">
                <div className="d-flex align-items-center p-2 bg-light rounded">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                    <i className="bi bi-person-fill text-primary"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{worker.name}</div>
                    <small className="text-muted">{worker.email}</small>
                    <div className="text-muted">
                      <i className="bi bi-building me-1"></i>
                      {worker.branch?.name || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'event-volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('event-volunteers')}
            type="button"
          >
            <i className="bi bi-calendar-event me-2"></i>
            Event Volunteers
            {pendingVolunteerRequests.length > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {pendingVolunteerRequests.length}
              </span>
            )}
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
                ))}              </div>
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

        {activeTab === 'event-volunteers' && (
          <div>
            {/* Pending Volunteer Requests Section */}
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-1">Pending Volunteer Requests</h5>
                  <p className="text-muted mb-0">
                    Workers from other branches requesting to volunteer for events in your branch
                  </p>
                </div>
                <button 
                  className="btn btn-outline-primary"
                  onClick={refetchVolunteerRequests}
                  disabled={volunteerRequestsLoading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>

              {volunteerRequestsLoading ? (
                <div className="row g-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-4">
                      <LoadingCard height="250px" />
                    </div>
                  ))}
                </div>
              ) : volunteerRequestsError ? (
                <ErrorDisplay 
                  message={volunteerRequestsError}
                  onRetry={refetchVolunteerRequests}
                />
              ) : pendingVolunteerRequests.length === 0 ? (
                <EmptyState 
                  icon="bi-calendar-event"
                  title="No Pending Volunteer Requests"
                  description="All volunteer requests have been processed. New requests will appear here."
                />
              ) : (
                <div className="row g-4">
                  {pendingVolunteerRequests.map(request => renderVolunteerRequestCard(request))}
                </div>
              )}
            </div>

            {/* Approved Event Workers Section */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>                  <h5 className="mb-1">Approved Event Workers</h5>
                  <p className="text-muted mb-0">
                    Workers from other branches approved for events in your branch
                  </p>
                </div>
                <button 
                  className="btn btn-outline-success"
                  onClick={refetchEventWorkers}
                  disabled={eventWorkersLoading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>

              {eventWorkersLoading ? (
                <div className="row g-4">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="col-12">
                      <LoadingCard height="200px" />
                    </div>
                  ))}
                </div>
              ) : eventWorkersError ? (
                <ErrorDisplay 
                  message={eventWorkersError}
                  onRetry={refetchEventWorkers}
                />
              ) : approvedEventWorkers.length === 0 ? (
                <EmptyState 
                  icon="bi-people"
                  title="No Approved Event Workers"
                  description="Workers who are approved for events will appear here organized by event."
                />
              ) : (
                <div>
                  {approvedEventWorkers.map(eventWorker => renderEventWorkersCard(eventWorker))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerManagement;
