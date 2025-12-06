import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { LoadingCard, ErrorDisplay, EmptyState } from '../common/Loading';
import { StatusBadge } from '../../utils/statusUtils';
import { API_ENDPOINTS, STATUS, API_BASE_URL } from '../../utils/constants';

const EventVolunteersManagement = ({ isReadOnly = false }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('registrar');
  const [actionLoading, setActionLoading] = useState({});
  const [eventFilter, setEventFilter] = useState('upcoming'); // upcoming, expired, all

  // Fetch volunteer requests from registrars endpoint
  const { data: registrarVolunteerRequestsData, loading: registrarLoading, error: registrarError, refetch: refetchRegistrarRequests } = useApi(
    `${API_ENDPOINTS.REGISTRARS.BASE}/admin/volunteer-requests/pending`,
    { immediate: true }
  );

  // Fetch volunteer requests from workers endpoint (covers PCUs and Interns)
  const { data: workerVolunteerRequestsData, loading: workerLoading, error: workerError, refetch: refetchWorkerRequests } = useApi(
    `${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/pending`,
    { immediate: true }
  );


  useEffect(() => {
    
    if (registrarError) {
      console.error('Registrar API Error:', registrarError);
    }
    if (workerError) {
      console.error('🚨 Worker API Error:', workerError);
    }
    
  }, [registrarError, workerError, registrarLoading, workerLoading, user]);

  const [allVolunteerRequests, setAllVolunteerRequests] = useState([]);

  useEffect(() => {
    // Combine requests from both endpoints
    const registrarRequests = registrarVolunteerRequestsData 
      ? (Array.isArray(registrarVolunteerRequestsData) ? registrarVolunteerRequestsData : registrarVolunteerRequestsData.data || [])
      : [];
    
    const workerRequests = workerVolunteerRequestsData 
      ? (Array.isArray(workerVolunteerRequestsData) ? workerVolunteerRequestsData : workerVolunteerRequestsData.data || [])
      : [];

    const allRequests = [...registrarRequests, ...workerRequests];
    
    // Debug each request to see their structure
    if (allRequests.length > 0) {
      
      // Look for any PCU-related requests specifically
      const pcuRequests = allRequests.filter(req => {
        const user = req.registrar || req.worker || req.user;
        const userRole = user?.role?.toLowerCase();
        return userRole === 'pcu';
      });
      
      
      if (pcuRequests.length > 0) {
      }
    }
    
    setAllVolunteerRequests(allRequests);
  }, [registrarVolunteerRequestsData, workerVolunteerRequestsData]);

  // Helper function to check if event is upcoming
  const isEventUpcoming = (event) => {
    if (!event) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Handle multi-day-specific events
    if (event.eventType === 'multi-day-specific' && event.specificDates) {
      return event.specificDates.some(date => {
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
    }
    
    // Handle multi-day events
    if (event.eventType === 'multi-day' && event.startDate) {
      const startDate = new Date(event.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    }
    
    // Handle single-day events (backward compatibility)
    if (event.date) {
      const eventDateTime = new Date(event.date);
      eventDateTime.setHours(0, 0, 0, 0);
      return eventDateTime >= today;
    }
    
    return false;
  };

  // Filter requests by role and cross-branch only
  const getFilteredRequestsByRole = (role) => {
    const filtered = allVolunteerRequests.filter(request => {
      // Determine user info based on request structure
      const user = request.registrar || request.worker || request.user;
      const userBranchId = user?.branch?._id;
      
      // Enhanced role detection to handle all user types
      let userRole = 'unknown';
      if (request.registrar) {
        // For registrar requests, use the actual role of the registrar (could be PCU, REGISTRAR, INTERN)
        userRole = request.registrar.role?.toLowerCase() || user?.role?.toLowerCase() || 'registrar';
      } else if (request.worker) {
        // Worker can be PCU, INTERN, or regular WORKER - use the role from the worker object
        userRole = request.worker.role?.toLowerCase() || user?.role?.toLowerCase() || 'worker';
      } else if (user?.role) {
        userRole = user.role.toLowerCase();
      }
      
      // Check if this is a cross-branch request
      // Event selectedBranches should include the current branch admin's branch but NOT the volunteer's branch
      const eventBranchIds = request.event?.selectedBranches?.map(branch => branch._id) || [];
      const isEventInAdminBranch = eventBranchIds.includes(user?.branch?._id);
      const isCrossBranch = !isEventInAdminBranch; // Cross-branch if volunteer's branch is NOT in event's selectedBranches
      
      // Enhanced role matching to handle all variations
      const matchesRole = userRole === role.toLowerCase() || 
                         (role === 'pcu' && (userRole === 'pcu' || userRole === 'pcu_admin')) ||
                         (role === 'intern' && (userRole === 'intern' || userRole === 'internship')) ||
                         (role === 'internship' && (userRole === 'intern' || userRole === 'internship'));
      
      // Apply event filter
      let matchesEventFilter = true;
      if (eventFilter === 'upcoming') {
        matchesEventFilter = isEventUpcoming(request.event);
      } else if (eventFilter === 'expired') {
        matchesEventFilter = !isEventUpcoming(request.event);
      }
      
      
      return isCrossBranch && matchesRole && matchesEventFilter;
    });
    
    return filtered;
  };

  const filteredRegistrarRequests = getFilteredRequestsByRole('registrar');
  const filteredPCURequests = getFilteredRequestsByRole('pcu');
  const filteredInternshipRequests = getFilteredRequestsByRole('intern');
  const filteredWorkerRequests = getFilteredRequestsByRole('worker');
  

  // Handle approve/reject actions
  const handleApprove = async (requestId, role, request) => {
    setActionLoading(prev => ({ ...prev, [requestId]: 'approving' }));
    try {
      let endpoint;
      if (role === 'registrar') {
        // Registrar endpoint: /admin/volunteer-requests/:eventId/approve/:registrarId
        const eventId = request.event?.id || request.event?._id;
        const registrarId = request.registrar?._id;
        endpoint = `${API_ENDPOINTS.REGISTRARS.BASE}/admin/volunteer-requests/${eventId}/approve/${registrarId}`;
      } else {
        // Worker endpoint: /admin/volunteer-requests/:eventId/:requestId/approve
        const eventId = request.event?.id || request.event?._id;
        endpoint = `${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/${eventId}/${requestId}/approve`;
      }
        
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Volunteer request approved successfully!');
        refetchRegistrarRequests(); 
        refetchWorkerRequests(); // Refresh both data sources
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to approve request:', response.status, errorData);
        alert(`Failed to approve request: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`Error approving request: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId, role, request) => {
    if (!confirm('Are you sure you want to reject this volunteer request?')) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      let endpoint;
      if (role === 'registrar') {
        // Registrar endpoint: /admin/volunteer-requests/:eventId/reject/:registrarId
        const eventId = request.event?.id || request.event?._id;
        const registrarId = request.registrar?._id;
        endpoint = `${API_ENDPOINTS.REGISTRARS.BASE}/admin/volunteer-requests/${eventId}/reject/${registrarId}`;
      } else {
        // Worker endpoint: /admin/volunteer-requests/:eventId/:requestId/reject
        const eventId = request.event?.id || request.event?._id;
        endpoint = `${API_ENDPOINTS.WORKERS.BASE}/admin/volunteer-requests/${eventId}/${requestId}/reject`;
      }
        
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Volunteer request rejected.');
        refetchRegistrarRequests(); 
        refetchWorkerRequests(); // Refresh both data sources
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to reject request:', response.status, errorData);
        alert(`Failed to reject request: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Error rejecting request: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  // Render volunteer request card
  const renderVolunteerRequestCard = (request) => {
    const user = request.registrar || request.worker || request.user;
    const requestId = request.requestId || request._id;
    
    // Determine user role for API calls
    let userRole = 'worker'; // default for API endpoint selection
    if (request.registrar) {
      userRole = 'registrar';
    } else if (request.worker && user?.role) {
      // For workers (PCU, INTERN, etc.), use their specific role but default to 'worker' for API
      userRole = ['pcu', 'intern', 'internship'].includes(user.role.toLowerCase()) ? user.role.toLowerCase() : 'worker';
    }
    
    return (
    <div key={requestId} className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm" style={{ 
        border: '1px solid #e3f2fd', 
        borderLeft: '4px solid #2196f3',
        transition: 'all 0.2s ease-in-out'
      }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-2">
                <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                  <i className="bi bi-person-fill text-primary"></i>
                </div>
                <div>
                  <h6 className="card-title mb-1 fw-semibold">{user?.name || 'Unknown User'}</h6>
                  <small className="text-muted">
                    <i className="bi bi-envelope me-1"></i>
                    {user?.email || 'No email'}
                  </small>
                </div>
              </div>
            </div>
            <StatusBadge status={request.status} type="volunteer" />
          </div>

          <div className="mb-3 p-3 bg-light rounded">
            <h6 className="text-primary mb-2 fw-semibold">
              <i className="bi bi-calendar-event me-2"></i>
              {request.event?.name || 'Event Name'}
            </h6>
            <div className="row g-2 text-sm">
              <div className="col-6">
                <small className="text-muted d-block">
                  <i className="bi bi-geo-alt me-1"></i>
                  <strong>Location:</strong>
                </small>
                <small className="text-dark">{request.event?.location || 'Location TBD'}</small>
              </div>
              <div className="col-6">
                <small className="text-muted d-block">
                  <i className="bi bi-calendar me-1"></i>
                  <strong>Date:</strong>
                </small>
                <small className="text-dark">
                  {request.event?.eventType === 'multi-day' && request.event?.startDate ? 
                    `${new Date(request.event.startDate).toLocaleDateString()} - ${new Date(request.event.endDate).toLocaleDateString()}` :
                    request.event?.date ? new Date(request.event.date).toLocaleDateString() : 'Date TBD'
                  }
                </small>
              </div>
            </div>
          </div>

          <div className="mb-3 d-flex align-items-center">
            <div className="rounded-circle bg-info bg-opacity-10 p-1 me-2">
              <i className="bi bi-building text-info" style={{ fontSize: '0.8rem' }}></i>
            </div>
            <div>
              <small className="text-muted d-block">From Branch</small>
              <small className="fw-semibold text-dark">{user?.branch?.name || 'Unknown Branch'}</small>
            </div>
          </div>

          {!isReadOnly && request.status === 'pending' && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm flex-fill"
                onClick={() => handleApprove(requestId, request.registrar ? 'registrar' : 'worker', request)}
                disabled={actionLoading[requestId] === 'approving'}
              >
                {actionLoading[requestId] === 'approving' ? (
                  <>
                    <i className="spinner-border spinner-border-sm me-1"></i>
                    Approving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Approve
                  </>
                )}
              </button>
              <button
                className="btn btn-danger btn-sm flex-fill"
                onClick={() => handleReject(requestId, request.registrar ? 'registrar' : 'worker', request)}
                disabled={actionLoading[requestId] === 'rejecting'}
              >
                {actionLoading[requestId] === 'rejecting' ? (
                  <>
                    <i className="spinner-border spinner-border-sm me-1"></i>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle me-1"></i>
                    Reject
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  const getCurrentRequests = () => {
    switch (activeSubTab) {
      case 'registrar': return filteredRegistrarRequests;
      case 'pcu': return filteredPCURequests;
      case 'internship': return filteredInternshipRequests;
      case 'worker': return filteredWorkerRequests;
      default: return [];
    }
  };

  const currentRequests = getCurrentRequests();

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1">Event Volunteers Management</h4>
              <p className="text-muted mb-0">
                Manage cross-branch volunteer requests for events in your branch
              </p>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={() => {
                refetchRegistrarRequests();
                refetchWorkerRequests();
              }}
              disabled={registrarLoading || workerLoading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>

          {/* Event Filter */}
          <div className="mb-4">
            <div className="row align-items-center">
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  <i className="bi bi-funnel me-1"></i>
                  Filter Events
                </label>
                <select
                  className="form-select"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="upcoming">Upcoming Events</option>
                  <option value="expired">Expired Events</option>
                  <option value="all">All Events</option>
                </select>
              </div>
              <div className="col-md-9">
                <div className="mt-3 mt-md-0">
                  <p className="text-muted mb-0">
                    {eventFilter === 'upcoming' && `Showing volunteer requests for upcoming events (${currentRequests.length} total)`}
                    {eventFilter === 'expired' && `Showing volunteer requests for expired events (${currentRequests.length} total)`}
                    {eventFilter === 'all' && `Showing all volunteer requests (${currentRequests.length} total)`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Tabs */}
          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSubTab === 'registrar' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('registrar')}
                type="button"
              >
                <i className="bi bi-clipboard-check me-1"></i>
                Registrar ({filteredRegistrarRequests.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSubTab === 'pcu' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('pcu')}
                type="button"
              >
                <i className="bi bi-person-workspace me-1"></i>
                PCU ({filteredPCURequests.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSubTab === 'internship' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('internship')}
                type="button"
              >
                <i className="bi bi-mortarboard me-1"></i>
                Internship ({filteredInternshipRequests.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSubTab === 'worker' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('worker')}
                type="button"
              >
                <i className="bi bi-person-badge me-1"></i>
                Worker ({filteredWorkerRequests.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <div className="row">
        <div className="col-12">
          {(registrarLoading || workerLoading) ? (
            <div className="row g-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <LoadingCard height="250px" />
                </div>
              ))}
            </div>
          ) : (registrarError || workerError) ? (
            <ErrorDisplay 
              message={registrarError || workerError}
              onRetry={() => {
                refetchRegistrarRequests();
                refetchWorkerRequests();
              }}
            />
          ) : currentRequests.length === 0 ? (
            <EmptyState 
              icon="hand-thumbs-up"
              title="No Volunteer Requests"
              message={`No ${activeSubTab} volunteer requests for ${eventFilter} events from other branches`}
            />
          ) : (
            <div className="row g-4">
              {currentRequests.map(request => renderVolunteerRequestCard(request))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventVolunteersManagement;