import React, { useState, useEffect } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/constants';

const RegistrarManagement = ({ isReadOnly = false }) => {
  const [pendingRegistrars, setPendingRegistrars] = useState([]);
  const [approvedRegistrars, setApprovedRegistrars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('approved');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (activeView === 'pending') {
      loadPendingRegistrars();
    } else {
      loadApprovedRegistrars();
    }
  }, [activeView]);  const loadPendingRegistrars = async () => {
    setLoading(true);
    setError(null);
    try {      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTRARS.PENDING}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const registrarsArray = Array.isArray(data) ? data : data.data || [];
        setPendingRegistrars(registrarsArray);
      } else {
        setError('Failed to load pending registrars');
      }
    } catch (err) {
      console.error('Error loading pending registrars:', err);
      setError('Failed to load pending registrars');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedRegistrars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTRARS.APPROVED}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApprovedRegistrars(Array.isArray(data) ? data : data.data || []);
      } else {
        setError('Failed to load approved registrars');
      }
    } catch (err) {
      console.error('Error loading approved registrars:', err);
      setError('Failed to load approved registrars');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistrar = async (registrarId) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTRARS.APPROVE}/${registrarId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        alert('Registrar approved successfully!');
        loadPendingRegistrars(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to approve registrar: ${error.message}`);
      }
    } catch (err) {
      console.error('Error approving registrar:', err);
      alert('Failed to approve registrar');
    }
  };
  const handleRejectRegistrar = async (registrarId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTRARS.REJECT}/${registrarId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          reason: reason || undefined 
        })
      });

      if (response.ok) {
        alert('Registrar rejected successfully!');
        loadPendingRegistrars(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to reject registrar: ${error.message}`);
      }
    } catch (err) {
      console.error('Error rejecting registrar:', err);
      alert('Failed to reject registrar');
    }
  };

  const formatRole = (role) => {
    if (role === 'intern') return 'Internship';
    if (role === 'pcu') return 'PCU';
    if (role === 'registrar') return 'Registrar';
    return role?.charAt(0).toUpperCase() + role?.slice(1) || 'N/A';
  };

  const filterByRole = (registrars) => {
    // Always exclude workers from this component - they belong in WorkerManagement
    const filteredRegistrars = registrars.filter(registrar => 
      registrar.role !== 'worker' && registrar.role !== 'WORKER'
    );
    
    if (roleFilter === 'all') return filteredRegistrars;
    return filteredRegistrars.filter(registrar => registrar.role === roleFilter);
  };

  const getFilteredData = () => {
    if (activeView === 'approved') {
      return filterByRole(approvedRegistrars);
    } else {
      return filterByRole(pendingRegistrars);
    }
  };

  const getRoleFilterCounts = () => {
    const currentData = activeView === 'approved' ? approvedRegistrars : pendingRegistrars;
    // Exclude workers from counts (they belong in WorkerManagement)
    const filteredData = currentData.filter(r => r.role !== 'worker' && r.role !== 'WORKER');
    
    return {
      all: filteredData.length,
      registrar: filteredData.filter(r => r.role === 'registrar').length,
      pcu: filteredData.filter(r => r.role === 'pcu').length,
      intern: filteredData.filter(r => r.role === 'intern').length
    };
  };

  const renderRegistrarTable = (registrars, isPending = true) => (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>State</th>
            <th>Branch</th>
            <th>Registration Date</th>
            <th>Status</th>
            <th>Checked-in Guests</th>
            {isPending && !isReadOnly && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {registrars.map(registrar => (
            <tr key={registrar._id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                    <i className="bi bi-person-check text-primary"></i>
                  </div>
                  <span className="fw-semibold">{registrar.name}</span>
                </div>
              </td>
              <td>
                <span className="text-muted">{registrar.email}</span>
              </td>
              <td>
                <span className="badge bg-info bg-opacity-10 text-info">
                  {formatRole(registrar.role)}
                </span>
              </td>
              <td>{registrar.state?.name || 'N/A'}</td>
              <td>{registrar.branch?.name || 'N/A'}</td>
              <td>
                <span className="text-muted">
                  {new Date(registrar.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                {isPending ? (
                  <span className="badge bg-warning">
                    <i className="bi bi-clock me-1"></i>
                    Pending
                  </span>
                ) : (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Approved
                  </span>
                )}
              </td>
              <td>
                <span className="badge bg-secondary">
                  {registrar.totalCheckedIn || 0}
                </span>
              </td>
              {isPending && !isReadOnly && (
                <td>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success btn-sm fw-bold px-3"
                      onClick={() => handleApproveRegistrar(registrar._id)}
                      title="Approve this registrar/PCU/internship"
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      APPROVE
                    </button>
                    <button
                      className="btn btn-danger btn-sm fw-bold px-3"
                      onClick={() => handleRejectRegistrar(registrar._id)}
                      title="Reject this registrar/PCU/internship"
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      DECLINE
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Registrar/PCU/Internship Management</h5>
        <div className="d-flex gap-3 align-items-center">
          {/* Role Filter */}
          <div className="d-flex align-items-center">
            <label className="form-label me-2 mb-0 text-muted">Filter by Role:</label>
            <select 
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Roles ({getRoleFilterCounts().all})</option>
              <option value="registrar">Registrar ({getRoleFilterCounts().registrar})</option>
              <option value="pcu">PCU ({getRoleFilterCounts().pcu})</option>
              <option value="intern">Internship ({getRoleFilterCounts().intern})</option>
            </select>
          </div>
          
          {/* View Toggle */}
          <div className="btn-group" role="group">
            <button
              className={`btn ${activeView === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveView('approved')}
            >
              Approved ({approvedRegistrars.length})
            </button>
            <button
              className={`btn ${activeView === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveView('pending')}
            >
              Pending ({activeView === 'pending' ? getRoleFilterCounts().all : pendingRegistrars.filter(r => r.role !== 'worker' && r.role !== 'WORKER').length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <div>
          {(() => {
            const filteredData = getFilteredData();
            const isEmpty = filteredData.length === 0;
            const originalData = activeView === 'approved' ? approvedRegistrars : pendingRegistrars;
            const isFiltered = roleFilter !== 'all';
            
            if (activeView === 'approved') {
              if (originalData.length === 0) {
                return (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-people fa-3x text-muted mb-3"></i>
                      <h5>No approved registrars, PCUs, or internships yet</h5>
                      <p className="text-muted mb-0">Approved users will appear here once branch pastors approve their applications.</p>
                    </div>
                  </div>
                );
              } else if (isEmpty && isFiltered) {
                return (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-funnel fa-3x text-muted mb-3"></i>
                      <h5>No {formatRole(roleFilter).toLowerCase()}s found</h5>
                      <p className="text-muted mb-0">No approved {formatRole(roleFilter).toLowerCase()}s match the current filter.</p>
                      <button 
                        className="btn btn-outline-primary btn-sm mt-2"
                        onClick={() => setRoleFilter('all')}
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="card">
                    <div className="card-body p-0">
                      {renderRegistrarTable(filteredData, false)}
                    </div>
                  </div>
                );
              }
            } else {
              if (originalData.length === 0) {
                return (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-clock fa-3x text-muted mb-3"></i>
                      <h5>No pending PCU or internship requests</h5>
                      <p className="text-muted mb-0">New PCU and internship applications awaiting approval will appear here.</p>
                    </div>
                  </div>
                );
              } else if (isEmpty && isFiltered) {
                return (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-funnel fa-3x text-muted mb-3"></i>
                      <h5>No pending {formatRole(roleFilter).toLowerCase()}s found</h5>
                      <p className="text-muted mb-0">No pending {formatRole(roleFilter).toLowerCase()}s match the current filter.</p>
                      <button 
                        className="btn btn-outline-primary btn-sm mt-2"
                        onClick={() => setRoleFilter('all')}
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="card">
                    <div className="card-body p-0">
                      {renderRegistrarTable(filteredData, true)}
                    </div>
                  </div>
                );
              }
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default RegistrarManagement;
