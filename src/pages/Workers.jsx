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
  const canApproveWorkers = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.currentRole || user?.role);
  const canManageWorkers = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.currentRole || user?.role);
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
            user?.currentRole || user?.role, 
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
    </Layout>
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

export default Workers;
