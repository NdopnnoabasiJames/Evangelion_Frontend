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

const Registrars = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch registrars based on user role
  const endpoint = user?.role === ROLES.SUPER_ADMIN 
    ? API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_PENDING 
    : API_ENDPOINTS.REGISTRARS.BASE;
    
  const { data: registrarsData, loading: registrarsLoading, error: registrarsError, refetch } = useApi(
    endpoint, 
    { immediate: true }
  );

  useEffect(() => {
    if (registrarsData) {
      setRegistrars(registrarsData);
    }
    setLoading(registrarsLoading);
    setError(registrarsError);
  }, [registrarsData, registrarsLoading, registrarsError]);

  // Role-based permissions
  const canApproveRegistrars = [ROLES.SUPER_ADMIN].includes(user?.role); // Only super admin can approve
  const canManageRegistrars = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN, ROLES.ZONAL_ADMIN, ROLES.BRANCH_ADMIN].includes(user?.role);
  const canAssignZones = [ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN].includes(user?.role);
  if (loading) {
    return (
      <Layout>
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0" style={{ color: 'var(--primary-purple)' }}>
                Registrars Management
              </h1>
              <p className="text-muted mb-0">Manage registrar applications and zone assignments</p>
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
          {...HeaderConfigurations.registrarManagement(
            user?.role, 
            refetch, 
            () => {/* Export functionality */}
          )}
        />

        {/* Statistics Cards */}
        <div className="mb-4">
          <StatisticsGrid 
            cards={[
              StatisticsCardTypes.totalRegistrars(registrars.length),
              StatisticsCardTypes.pendingApprovals(registrars.filter(r => r.status === STATUS.PENDING).length),
              StatisticsCardTypes.activeRegistrars(registrars.filter(r => r.status === STATUS.APPROVED).length),
              {
                title: 'Total Check-ins',
                value: registrars.reduce((sum, r) => sum + (r.totalCheckIns || 0), 0),
                icon: 'bi-check-square',
                color: '#17a2b8',
                background: 'linear-gradient(135deg, #17a2b8, #20c997)'
              }
            ]}
            columns={4}
          />
        </div>

        {/* Tab Navigation */}
        <TabbedInterface
          activeTab={activeTab}
          onTabChange={setActiveTab}
          configuration="registrarManagement"
          rolePermissions={{
            canApproveRegistrars,
            canManageRegistrars,
            canAssignZones
          }}
        >
          <TabPane tabId="list" title="All Registrars">
            <RegistrarsList 
              registrars={registrars.filter(r => r.status === STATUS.APPROVED)}
              loading={loading}
              error={error}
              canManage={canManageRegistrars}
              onRefresh={refetch}
            />
          </TabPane>

          {canApproveRegistrars && (
            <TabPane tabId="pending" title="Pending Approval">
              <PendingRegistrars 
                registrars={registrars.filter(r => r.status === STATUS.PENDING)}
                onRefresh={refetch}
                canApprove={canApproveRegistrars}
              />
            </TabPane>
          )}

          {canAssignZones && (
            <TabPane tabId="zones" title="Zone Assignments">
              <ZoneAssignments 
                registrars={registrars.filter(r => r.status === STATUS.APPROVED)}
                onRefresh={refetch}
              />
            </TabPane>
          )}

          <TabPane tabId="performance" title="Performance">
            <RegistrarPerformance 
              registrars={registrars.filter(r => r.status === STATUS.APPROVED)}
            />
          </TabPane>
        </TabbedInterface>
      </div>
    </Layout>
  );
};

// Registrars List Component
const RegistrarsList = ({ registrars, loading, error, canManage, onRefresh }) => {
  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Error loading registrars: {error}
        <button className="btn btn-outline-danger btn-sm ms-3" onClick={onRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  if (!registrars || registrars.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-people" style={{ fontSize: '4rem', color: 'var(--primary-purple)', opacity: 0.5 }}></i>
        <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>No Registrars Found</h4>
        <p className="text-muted">There are no approved registrars at the moment.</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {registrars.map((registrar) => (
        <div key={registrar._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                    {registrar.fullName}
                  </h5>
                  <small className="text-muted">{registrar.email}</small>
                </div>                <StatusBadge status={registrar.status} type="user" />
              </div>
              
              <div className="mb-2">
                <i className="bi bi-phone me-2 text-muted"></i>
                <small className="text-muted">{registrar.phoneNumber}</small>
              </div>
              
              <div className="mb-2">
                <i className="bi bi-geo-alt me-2 text-muted"></i>
                <small className="text-muted">{registrar.zone?.name || 'No Zone Assigned'}</small>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  <i className="bi bi-clipboard-check me-1"></i>
                  {registrar.totalCheckIns || 0} check-ins
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

// Pending Registrars Component
const PendingRegistrars = ({ registrars, onRefresh, canApprove }) => {
  const { execute: approveRegistrar } = useApi(null, { immediate: false });
  const { execute: rejectRegistrar } = useApi(null, { immediate: false });
  const { execute: revokeRoleSwitching } = useApi(null, { immediate: false });

  const handleApprove = async (registrarId) => {
    try {
      await approveRegistrar(API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_APPROVE, {
        method: 'POST',
        body: { registrarId }
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to approve registrar:', error);
    }
  };

  const handleReject = async (registrarId) => {
    try {
      await rejectRegistrar(API_ENDPOINTS.REGISTRARS.SUPER_ADMIN_REJECT, {
        method: 'POST',
        body: { registrarId }
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to reject registrar:', error);
    }
  };

  const handleRevokeRoleSwitching = async (userId) => {
    try {
      await revokeRoleSwitching(`${API_ENDPOINTS.REGISTRARS.BASE}/super-admin/revoke-role-switching/${userId}`, {
        method: 'POST'
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to revoke role switching:', error);
    }
  };

  if (!registrars || registrars.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-clock" style={{ fontSize: '4rem', color: 'var(--accent-yellow)', opacity: 0.5 }}></i>
        <h4 className="mt-3" style={{ color: 'var(--primary-purple)' }}>No Pending Applications</h4>
        <p className="text-muted">All registrar applications and role-switch requests have been processed.</p>
      </div>
    );
  }

  // Separate applications by type
  const newRegistrarApps = registrars.filter(r => r.requestType === 'new_registrar' || !r.requestType);
  const roleSwitchRequests = registrars.filter(r => r.requestType === 'role_switch');

  return (
    <div className="container-fluid">
      {/* Role Switch Requests Section */}
      {roleSwitchRequests.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-arrow-repeat me-2" style={{ color: 'var(--accent-yellow)' }}></i>
            <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
              Worker Role-Switch Requests ({roleSwitchRequests.length})
            </h5>
          </div>
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            These are workers requesting the ability to switch between Worker and Registrar roles.
          </div>
          <div className="row g-4">
            {roleSwitchRequests.map((request) => (
              <div key={request._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                          {request.name}
                        </h5>
                        <small className="text-muted">{request.email}</small>
                      </div>
                      <span className="badge bg-warning">Role Switch</span>
                    </div>
                    
                    <div className="mb-2">
                      <i className="bi bi-phone me-2 text-muted"></i>
                      <small>{request.phone}</small>
                    </div>
                    
                    <div className="mb-2">
                      <i className="bi bi-geo-alt me-2 text-muted"></i>
                      <small>{request.branch?.name || 'No Branch'}</small>
                    </div>

                    <div className="mb-3">
                      <i className="bi bi-clock me-2 text-muted"></i>
                      <small>Requested: {new Date(request.roleSwitchRequestedAt).toLocaleDateString()}</small>
                    </div>
                    
                    {canApprove && (
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(request._id)}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Grant Role Switching
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleReject(request._id)}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Registrar Applications Section */}
      {newRegistrarApps.length > 0 && (
        <div>
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-person-plus me-2" style={{ color: 'var(--primary-purple)' }}></i>
            <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
              New Registrar Applications ({newRegistrarApps.length})
            </h5>
          </div>
          <div className="alert alert-primary">
            <i className="bi bi-info-circle me-2"></i>
            These are new registrar account applications.
          </div>
          <div className="row g-4">
            {newRegistrarApps.map((registrar) => (
              <div key={registrar._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0" style={{ borderLeft: '4px solid var(--primary-purple)' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                          {registrar.name}
                        </h5>
                        <small className="text-muted">{registrar.email}</small>
                      </div>
                      <span className="badge bg-primary">New Registrar</span>
                    </div>
                    
                    <div className="mb-2">
                      <i className="bi bi-phone me-2 text-muted"></i>
                      <small>{registrar.phone}</small>
                    </div>
                    
                    <div className="mb-3">
                      <i className="bi bi-geo-alt me-2 text-muted"></i>
                      <small>{registrar.branch?.name || 'No Branch'}</small>
                    </div>
                    
                    {canApprove && (
                      <ApprovalActions
                        entityId={registrar._id}
                        entityType="registrar"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        approveText="Approve"
                        rejectText="Reject"
                        size="sm"
                        layout="horizontal"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Existing Role Switchers */}
      <div className="mt-5">
        <ExistingRoleSwitchers onRevoke={handleRevokeRoleSwitching} />
      </div>
    </div>
  );
};

// Component to manage existing role switchers
const ExistingRoleSwitchers = ({ onRevoke }) => {
  const [roleSwitchers, setRoleSwitchers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoleSwitchers();
  }, []);

  const fetchRoleSwitchers = async () => {
    setLoading(true);
    try {
      // Fetch workers who have canSwitchRoles = true
      const response = await fetch(`${API_ENDPOINTS.ADMIN.USERS}?canSwitchRoles=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const users = await response.json();
        setRoleSwitchers(Array.isArray(users) ? users : users.data || []);
      }
    } catch (err) {
      console.error('Error fetching role switchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (userId) => {
    if (window.confirm('Are you sure you want to revoke role switching ability? This will force the user back to Worker role.')) {
      await onRevoke(userId);
      fetchRoleSwitchers(); // Refresh the list
    }
  };

  if (loading) {
    return <LoadingCard height="200px" />;
  }

  if (!roleSwitchers.length) {
    return null; // Don't show section if no role switchers
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <i className="bi bi-people-fill me-2" style={{ color: 'var(--success)' }}></i>
        <h5 className="mb-0" style={{ color: 'var(--primary-purple)' }}>
          Active Role Switchers ({roleSwitchers.length})
        </h5>
      </div>
      <div className="alert alert-success">
        <i className="bi bi-info-circle me-2"></i>
        These workers can switch between Worker and Registrar roles. You can revoke this ability.
      </div>
      <div className="row g-4">
        {roleSwitchers.map((user) => (
          <div key={user._id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                      {user.name}
                    </h5>
                    <small className="text-muted">{user.email}</small>
                  </div>
                  <span className="badge bg-success">Active Switcher</span>
                </div>
                
                <div className="mb-2">
                  <i className="bi bi-person-badge me-2 text-muted"></i>
                  <small>Current: {user.currentRole === 'registrar' ? 'Registrar' : 'Worker'}</small>
                </div>
                
                <div className="mb-2">
                  <i className="bi bi-geo-alt me-2 text-muted"></i>
                  <small>{user.branch?.name || 'No Branch'}</small>
                </div>

                <div className="mb-3">
                  <i className="bi bi-clock me-2 text-muted"></i>
                  <small>Approved: {new Date(user.roleSwitchApprovedAt).toLocaleDateString()}</small>
                </div>
                
                <button
                  className="btn btn-outline-danger btn-sm w-100"
                  onClick={() => handleRevoke(user._id)}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Revoke Role Switching
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Zone Assignments Component
const ZoneAssignments = ({ registrars, onRefresh }) => {
  const { execute: assignZone } = useApi(null, { immediate: false });

  const handleZoneAssignment = async (registrarId, zoneId) => {
    try {
      await assignZone(`${API_ENDPOINTS.REGISTRARS.BASE}/${registrarId}/assign-zone`, {
        method: 'PATCH',
        body: { zoneId }
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to assign zone:', error);
    }
  };

  return (
    <div className="row g-4">
      {registrars.map((registrar) => (
        <div key={registrar._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title" style={{ color: 'var(--primary-purple)' }}>
                {registrar.fullName}
              </h5>
              
              <div className="mb-3">
                <label className="form-label small text-muted">Current Zone</label>
                <p className="mb-0">{registrar.zone?.name || 'No Zone Assigned'}</p>
              </div>
              
              <div className="mb-3">
                <label className="form-label small text-muted">Assign to Zone</label>
                <select 
                  className="form-select form-select-sm"
                  onChange={(e) => handleZoneAssignment(registrar._id, e.target.value)}
                  defaultValue=""
                >
                  <option value="">Select Zone</option>
                  <option value="zone1">Zone A</option>
                  <option value="zone2">Zone B</option>
                  <option value="zone3">Zone C</option>
                </select>
              </div>
              
              <small className="text-muted">
                <i className="bi bi-clipboard-check me-1"></i>
                {registrar.totalCheckIns || 0} total check-ins
              </small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Registrar Performance Component
const RegistrarPerformance = ({ registrars }) => {
  const sortedRegistrars = registrars.sort((a, b) => (b.totalCheckIns || 0) - (a.totalCheckIns || 0));

  return (
    <div className="row g-4">
      {sortedRegistrars.map((registrar, index) => (
        <div key={registrar._id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1" style={{ color: 'var(--primary-purple)' }}>
                    {registrar.fullName}
                  </h5>
                  <small className="text-muted">{registrar.zone?.name || 'No Zone'}</small>
                </div>
                {index < 3 && (
                  <span className="badge bg-warning">
                    #{index + 1} Top Performer
                  </span>
                )}
              </div>
              
              <div className="row text-center">
                <div className="col-6">
                  <h4 style={{ color: 'var(--primary-purple)' }}>{registrar.totalCheckIns || 0}</h4>
                  <small className="text-muted">Total Check-ins</small>
                </div>
                <div className="col-6">
                  <h4 style={{ color: 'var(--accent-yellow)' }}>{registrar.avgCheckInTime || '0m'}</h4>
                  <small className="text-muted">Avg Check-in Time</small>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <small className="text-muted">
                  <i className="bi bi-star-fill me-1" style={{ color: 'var(--accent-yellow)' }}></i>
                  {registrar.efficiency || 95}% Efficiency Rate
                </small>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Registrars;
