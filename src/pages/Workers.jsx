import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import Layout from '../components/Layout/Layout';
import Loading from '../components/common/Loading';
import { API_ENDPOINTS, ROLES, STATUS } from '../utils/constants';

const Workers = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <Layout>
        <Loading text="Loading workers..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0" style={{ color: 'var(--primary-purple)' }}>
              Workers Management
            </h1>
            <p className="text-muted mb-0">Manage worker applications and performance</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <WorkersStats workers={workers} />

        {/* Tabs Navigation */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
              style={activeTab === 'list' ? {
                backgroundColor: 'var(--primary-purple)',
                borderColor: 'var(--primary-purple)',
                color: 'white'
              } : {}}
            >
              <i className="bi bi-people me-2"></i>
              All Workers
            </button>
          </li>
          
          {canApproveWorkers && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
                style={activeTab === 'pending' ? {
                  backgroundColor: 'var(--primary-purple)',
                  borderColor: 'var(--primary-purple)',
                  color: 'white'
                } : {}}
              >
                <i className="bi bi-clock me-2"></i>
                Pending Approval
              </button>
            </li>
          )}

          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
              style={activeTab === 'performance' ? {
                backgroundColor: 'var(--primary-purple)',
                borderColor: 'var(--primary-purple)',
                color: 'white'
              } : {}}
            >
              <i className="bi bi-graph-up me-2"></i>
              Performance
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <WorkersList 
            workers={workers.filter(w => w.status === STATUS.APPROVED)}
            loading={loading}
            error={error}
            canManage={canManageWorkers}
            onRefresh={refetch}
          />
        )}

        {activeTab === 'pending' && canApproveWorkers && (
          <PendingWorkers 
            workers={workers.filter(w => w.status === STATUS.PENDING)}
            onRefresh={refetch}
          />
        )}

        {activeTab === 'performance' && (
          <WorkerPerformance 
            workers={workers.filter(w => w.status === STATUS.APPROVED)}
          />
        )}
      </div>
    </Layout>
  );
};

// Workers Statistics Component
const WorkersStats = ({ workers }) => {
  const totalWorkers = workers.length;
  const pendingApprovals = workers.filter(w => w.status === STATUS.PENDING).length;
  const activeWorkers = workers.filter(w => w.status === STATUS.APPROVED).length;
  const inactiveWorkers = workers.filter(w => w.status === STATUS.INACTIVE).length;

  return (
    <div className="row mb-4">
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <i className="bi bi-people" style={{ fontSize: '2rem', color: 'var(--primary-purple)' }}></i>
            <h4 className="mt-2 mb-0" style={{ color: 'var(--primary-purple)' }}>{totalWorkers}</h4>
            <small className="text-muted">Total Workers</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <i className="bi bi-clock" style={{ fontSize: '2rem', color: 'var(--accent-yellow)' }}></i>
            <h4 className="mt-2 mb-0" style={{ color: 'var(--accent-yellow)' }}>{pendingApprovals}</h4>
            <small className="text-muted">Pending Approvals</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <i className="bi bi-check-circle" style={{ fontSize: '2rem', color: '#28a745' }}></i>
            <h4 className="mt-2 mb-0" style={{ color: '#28a745' }}>{activeWorkers}</h4>
            <small className="text-muted">Active Workers</small>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <i className="bi bi-x-circle" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
            <h4 className="mt-2 mb-0" style={{ color: '#dc3545' }}>{inactiveWorkers}</h4>
            <small className="text-muted">Inactive Workers</small>
          </div>
        </div>
      </div>
    </div>
  );
};

// Workers List Component
const WorkersList = ({ workers, loading, error, canManage, onRefresh }) => {
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
                </div>
                <span className={`badge ${getStatusBadgeClass(worker.status)}`}>
                  {worker.status}
                </span>
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
                  <button className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-pencil"></i>
                  </button>
                )}
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
              
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm flex-fill"
                  onClick={() => handleApprove(worker._id)}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-sm flex-fill"
                  onClick={() => handleReject(worker._id)}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Reject
                </button>
              </div>
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

// Helper function for status badge styling
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-success';
    case 'pending':
      return 'bg-warning';
    case 'rejected':
      return 'bg-danger';
    case 'inactive':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
};

export default Workers;
