import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import { DataListState, LoadingCard, ErrorDisplay } from '../components/common/Loading';
import { StatisticsGrid, StatisticsCardTypes } from '../components/common/StatisticsCard';
import { TabbedInterface, TabPane } from '../components/common/TabNavigation';
import PageHeader, { HeaderConfigurations } from '../components/common/PageHeader';
import { StatusBadge } from '../utils/statusUtils.jsx';
import { ApprovalActions, ActionConfigurations } from '../components/common/ActionButtons.jsx';
import { API_ENDPOINTS, ROLES, STATUS } from '../utils/constants';
import api from '../services/api';

const Workers = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // Fetch workers based on user role
  const { data: workersData, loading: workersLoading, error: workersError, refetch } = useApi(
    API_ENDPOINTS.WORKERS.BASE, 
    { immediate: true }
  );

  useEffect(() => {
    if (workersData) {
      setWorkers(workersData);
    }
    setLoading(workersLoading);
    setError(workersError);
  }, [workersData, workersLoading, workersError]);

  // Role-based permissions
  const canApproveWorkers = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.role);
  const canManageWorkers = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.role);

  console.log('👤 [Workers] User role check:', {
    userRole: user?.role,
    canApproveWorkers,
    canManageWorkers,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN]
  });

  // Modal handlers
  const handleViewWorker = (worker) => {
    console.log('🔍 VIEW BUTTON CLICKED - Worker:', worker);
    alert(`View button clicked for: ${worker.name || worker.fullName || worker.email}`);
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  const handleDisableWorker = async (workerId, workerName) => {
    console.log('🚫 DISABLE BUTTON CLICKED - Worker ID:', workerId, 'Name:', workerName);
    alert(`Disable button clicked for: ${workerName}`);
    
    if (!window.confirm(`Are you sure you want to disable ${workerName}?`)) {
      return;
    }

    try {
      await api.patch(`${API_ENDPOINTS.WORKERS.BASE}/${workerId}/disable`);
      alert(`${workerName} has been successfully disabled.`);
      refetch();
    } catch (error) {
      console.error('Error disabling worker:', error);
      alert(`Failed to disable ${workerName}. ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  const handleCloseModal = () => {
    console.log('❌ Close modal clicked');
    setSelectedWorker(null);
    setShowWorkerModal(false);
  };
  if (loading) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0" style={{ color: 'var(--primary-purple)' }}>
                Workers Management
              </h1>
              <p className="text-muted mb-0">Manage worker applications and performance</p>
            </div>
          </div>
          <div className="row g-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-12">
                <LoadingCard height="200px" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <ErrorDisplay 
            message={error}
            onRetry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <PageHeader 
          {...HeaderConfigurations.workerManagement(
            user?.role, 
            refetch, 
            () => {/* Export functionality */}
          )}
        />

        {/* Statistics Cards */}
        <div className="mb-4">
          <StatisticsGrid 
            cards={[
              StatisticsCardTypes.totalWorkers(workers.length),
              StatisticsCardTypes.pendingApprovals(workers.filter(w => w.status === STATUS.PENDING).length),
              StatisticsCardTypes.activeWorkers(workers.filter(w => w.status === STATUS.APPROVED).length),
              {
                title: 'Inactive Workers',
                value: workers.filter(w => w.status === STATUS.INACTIVE).length,
                icon: 'bi-x-circle',
                color: '#dc3545',
                background: 'linear-gradient(135deg, #dc3545, #c82333)'
              }
            ]}
            columns={4}
          />
        </div>

        {/* Tab Navigation */}
        <TabbedInterface
          activeTab={activeTab}
          onTabChange={setActiveTab}
          configuration="workerManagement"
          rolePermissions={{
            canApproveWorkers,
            canManageWorkers
          }}
        >
          <TabPane tabId="list" title="All Workers">
            <WorkersList 
              workers={workers.filter(w => w.status === STATUS.APPROVED)}
              loading={loading}
              error={error}
              canManage={canManageWorkers}
              onRefresh={refetch}
              onViewWorker={handleViewWorker}
              onDisableWorker={handleDisableWorker}
            />
          </TabPane>

          {canApproveWorkers && (
            <TabPane tabId="pending" title="Pending Approval">
              <PendingWorkers 
                workers={workers.filter(w => w.status === STATUS.PENDING)}
                onRefresh={refetch}
              />
            </TabPane>
          )}

          <TabPane tabId="performance" title="Performance">
            <WorkerPerformance 
              workers={workers.filter(w => w.status === STATUS.APPROVED)}
            />
          </TabPane>
        </TabbedInterface>
      </div>

      {/* Worker Details Modal */}
      {showWorkerModal && selectedWorker && (
        <WorkerDetailsModal 
          worker={selectedWorker}
          onClose={handleCloseModal}
        />
      )}
    </Layout>
  );
};

// Workers List Component
const WorkersList = ({ workers, loading, error, canManage, onRefresh, onViewWorker, onDisableWorker }) => {
  console.log('📋 [WorkersList] Props received:', { 
    workersCount: workers?.length, 
    canManage, 
    hasViewHandler: !!onViewWorker, 
    hasDisableHandler: !!onDisableWorker 
  });
  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Error loading workers: {error}
        <button className="btn btn-outline-danger btn-sm ms-3" onClick={onRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-people" style={{ fontSize: '4rem', color: 'var(--primary-purple)', opacity: 0.5 }}></i>
        <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>No Workers Found</h4>
        <p className="text-muted">There are no approved workers at the moment.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {workers.map((worker) => (
        <div key={worker._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                    {worker.fullName}
                  </h5>
                  <small className="text-muted">{worker.email}</small>
                </div>                <StatusBadge status={worker.status} type="user" />
              </div>
              
              <div className="mb-2">
                <i className="bi bi-phone me-2 text-muted"></i>
                <small className="text-muted">{worker.phoneNumber}</small>
              </div>
              
              <div className="mb-2">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small className="text-muted">{worker.branch?.name || 'No Branch'}</small>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  {worker.guestsRegistered || 0} guests
                </small>
                
                {canManage && (
                  <div className="btn-group" role="group">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        console.log('VIEW BUTTON CLICKED!');
                        alert('View button works!');
                        handleViewWorker(worker);
                      }}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i> View
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        console.log('DISABLE BUTTON CLICKED!');
                        alert('Disable button works!');
                        handleDisableWorker(worker._id, worker.name || worker.fullName || worker.email);
                      }}
                      title="Disable Worker"
                      disabled={worker.status === 'disabled'}
                    >
                      <i className="bi bi-ban"></i> Disable
                    </button>
                  </div>
                )}
                
                {/* Debug: Show button visibility */}
                <div style={{ fontSize: '12px', color: 'red', marginTop: '5px', fontWeight: 'bold' }}>
                  DEBUG: canManage = {canManage ? 'TRUE' : 'FALSE'}
                  {canManage ? ' (BUTTONS SHOULD BE VISIBLE)' : ' (BUTTONS HIDDEN)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pending Workers Component
const PendingWorkers = ({ workers, onRefresh }) => {
  const { execute: approveWorker } = useApi(null, { immediate: false });
  const { execute: rejectWorker } = useApi(null, { immediate: false });

  const handleApprove = async (workerId) => {
    try {
      await approveWorker(`${API_ENDPOINTS.WORKERS.BASE}/${workerId}/approve`, {
        method: 'PATCH'
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to approve worker:', error);
    }
  };

  const handleReject = async (workerId) => {
    try {
      await rejectWorker(`${API_ENDPOINTS.WORKERS.BASE}/${workerId}/reject`, {
        method: 'PATCH'
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to reject worker:', error);
    }
  };

  if (!workers || workers.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-clock" style={{ fontSize: '4rem', color: 'var(--accent-yellow)', opacity: 0.5 }}></i>
        <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>No Pending Applications</h4>
        <p className="text-muted">All worker applications have been processed.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {workers.map((worker) => (
        <div key={worker._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title" style={{ color: 'var(--primary-purple)' }}>
                {worker.fullName}
              </h5>
              <p className="text-muted mb-2">{worker.email}</p>
              
              <div className="mb-2">
                <i className="bi bi-phone me-2 text-muted"></i>
                <small>{worker.phoneNumber}</small>
              </div>
              
              <div className="mb-3">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small>{worker.branch?.name || 'No Branch'}</small>
              </div>
                <ApprovalActions
                entityId={worker._id}
                entityType="worker"
                onApprove={handleApprove}
                onReject={handleReject}
                approveText="Approve"
                rejectText="Reject"
                size="sm"
                layout="horizontal"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Worker Performance Component
const WorkerPerformance = ({ workers }) => {
  const sortedWorkers = workers.sort((a, b) => (b.guestsRegistered || 0) - (a.guestsRegistered || 0));

  return (
    <div className="row g-4">
      {sortedWorkers.map((worker, index) => (
        <div key={worker._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                    {worker.fullName}
                  </h5>
                  <small className="text-muted">{worker.branch?.name}</small>
                </div>
                {index < 3 && (
                  <span className="badge bg-warning">
                    #{index + 1} Top Performer
                  </span>
                )}
              </div>
              
              <div className="row text-center">
                <div className="col-6">
                  <h4 style={{ color: 'var(--primary-purple)' }}>{worker.guestsRegistered || 0}</h4>
                  <small className="text-muted">Guests Registered</small>
                </div>
                <div className="col-6">
                  <h4 style={{ color: 'var(--accent-yellow)' }}>{worker.eventsParticipated || 0}</h4>
                  <small className="text-muted">Events Participated</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Worker Details Modal Component
const WorkerDetailsModal = ({ worker, onClose }) => {
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header" style={{ backgroundColor: 'var(--primary-purple)', color: 'white' }}>
            <h5 className="modal-title">
              <i className="bi bi-person-circle me-2"></i>
              Worker Details
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="row g-4">
              {/* Personal Information */}
              <div className="col-12">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-person me-2"></i>
                  Personal Information
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Full Name</label>
                      <p className="form-control-plaintext">{worker.fullName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <p className="form-control-plaintext">{worker.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Phone Number</label>
                      <p className="form-control-plaintext">{worker.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Status</label>
                      <div>
                        <StatusBadge status={worker.status} type="user" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="col-12">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-geo-alt me-2"></i>
                  Location Information
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">State</label>
                      <p className="form-control-plaintext">{worker.state?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Branch</label>
                      <p className="form-control-plaintext">{worker.branch?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Zone</label>
                      <p className="form-control-plaintext">{worker.zone?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Pickup Station</label>
                      <p className="form-control-plaintext">{worker.pickupStation?.name || 'Not Assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Statistics */}
              <div className="col-12">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-graph-up me-2"></i>
                  Performance Statistics
                </h6>
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h4 className="text-primary">{worker.guestsRegistered || 0}</h4>
                        <small className="text-muted">Guests Registered</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h4 className="text-success">{worker.eventsParticipated || 0}</h4>
                        <small className="text-muted">Events Participated</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h4 className="text-warning">{worker.guestsCheckedIn || 0}</h4>
                        <small className="text-muted">Guests Checked In</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h4 className="text-info">{worker.totalVolunteerRequests || 0}</h4>
                        <small className="text-muted">Volunteer Requests</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="col-12">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-calendar me-2"></i>
                  Registration Information
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Registered Date</label>
                      <p className="form-control-plaintext">
                        {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Last Updated</label>
                      <p className="form-control-plaintext">
                        {worker.updatedAt ? new Date(worker.updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Information */}
              {worker.canSwitchRoles && (
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-person-gear me-2"></i>
                    Role Information
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Primary Role</label>
                        <p className="form-control-plaintext">
                          <span className="badge bg-primary">{worker.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Current Role</label>
                        <p className="form-control-plaintext">
                          <span className="badge bg-success">{worker.currentRole || worker.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        This worker has registrar access and can switch between Worker and Registrar roles.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workers;
