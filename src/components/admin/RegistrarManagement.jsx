import React, { useState, useEffect } from 'react';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { API_ENDPOINTS } from '../../utils/constants';

const RegistrarManagement = () => {
  const [pendingRegistrars, setPendingRegistrars] = useState([]);
  const [approvedRegistrars, setApprovedRegistrars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('pending');

  useEffect(() => {
    if (activeView === 'pending') {
      loadPendingRegistrars();
    } else {
      loadApprovedRegistrars();
    }
  }, [activeView]);
  const loadPendingRegistrars = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('DEBUG - RegistrarManagement: Loading pending registrars...');
      console.log('DEBUG - RegistrarManagement: Endpoint:', API_ENDPOINTS.REGISTRARS.PENDING);
      
      const response = await fetch(API_ENDPOINTS.REGISTRARS.PENDING, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      console.log('DEBUG - RegistrarManagement: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG - RegistrarManagement: Received data:', data);
        const registrarsArray = Array.isArray(data) ? data : data.data || [];
        console.log('DEBUG - RegistrarManagement: Processed registrars array:', registrarsArray);
        console.log('DEBUG - RegistrarManagement: Length of array:', registrarsArray.length);
        setPendingRegistrars(registrarsArray);
      } else {
        const errorText = await response.text();
        console.error('DEBUG - RegistrarManagement: Error response:', errorText);
        setError('Failed to load pending registrars');
      }
    } catch (err) {
      console.error('Error loading pending registrars:', err);
      console.error('DEBUG - RegistrarManagement: Error details:', err.stack || err.toString());
      setError('Failed to load pending registrars');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedRegistrars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTRARS.APPROVED, {
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
      const response = await fetch(API_ENDPOINTS.REGISTRARS.APPROVE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ registrarId })
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
      const response = await fetch(API_ENDPOINTS.REGISTRARS.REJECT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          registrarId,
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

  const renderRegistrarCard = (registrar, isPending = true) => (
    <div key={registrar._id} className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
              <i className="bi bi-person-check text-primary"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-semibold">{registrar.name}</h6>
              <small className="text-muted">{registrar.email}</small>
            </div>
          </div>

          <div className="mb-3">
            <div className="row g-2 text-sm">
              <div className="col-6">
                <strong>Phone:</strong>
                <div className="text-muted">{registrar.phone || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>State:</strong>
                <div className="text-muted">{registrar.state?.name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>Branch:</strong>
                <div className="text-muted">{registrar.branch?.name || 'N/A'}</div>
              </div>
              <div className="col-6">
                <strong>Registered:</strong>
                <div className="text-muted">
                  {new Date(registrar.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {isPending ? (
            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm flex-fill"
                onClick={() => handleApproveRegistrar(registrar._id)}
              >
                <i className="bi bi-check-circle me-1"></i>
                Approve
              </button>
              <button
                className="btn btn-danger btn-sm flex-fill"
                onClick={() => handleRejectRegistrar(registrar._id)}
              >
                <i className="bi bi-x-circle me-1"></i>
                Reject
              </button>
            </div>
          ) : (
            <div className="text-center">
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                Approved
              </span>
              {registrar.approvedAt && (
                <div className="text-muted small mt-1">
                  Approved: {new Date(registrar.approvedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Registrar Management</h5>
        <div className="btn-group" role="group">
          <button
            className={`btn ${activeView === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('pending')}
          >
            Pending ({pendingRegistrars.length})
          </button>
          <button
            className={`btn ${activeView === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('approved')}
          >
            Approved ({approvedRegistrars.length})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingCard />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <div>
          {activeView === 'pending' ? (
            pendingRegistrars.length === 0 ? (
              <EmptyState message="No pending registrar requests" />
            ) : (
              <div className="row g-3">
                {pendingRegistrars.map(registrar => renderRegistrarCard(registrar, true))}
              </div>
            )
          ) : (
            approvedRegistrars.length === 0 ? (
              <EmptyState message="No approved registrars yet" />
            ) : (
              <div className="row g-3">
                {approvedRegistrars.map(registrar => renderRegistrarCard(registrar, false))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrarManagement;
