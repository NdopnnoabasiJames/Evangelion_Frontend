import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_ENDPOINTS, ROLES } from '../../utils/constants';

const RoleSwitchingSection = ({ user }) => {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
  const [notification, setNotification] = useState(null);

  // Check if user has a pending request
  useEffect(() => {
    if (user?.requestType === 'role_switch') {
      setHasRequestedAccess(true);
    }
  }, [user]);

  // Check for revocation notification
  useEffect(() => {
    const checkRevocation = () => {
      // If user previously had switching ability but no longer does, show notification
      const previousCanSwitch = localStorage.getItem('previousCanSwitchRoles');
      if (previousCanSwitch === 'true' && !user?.canSwitchRoles) {
        setNotification({
          type: 'warning',
          message: 'Your role switching privilege has been revoked by the admin. You have been switched back to Worker role.'
        });
        localStorage.removeItem('previousCanSwitchRoles');
      }
      
      // Store current state for future comparison
      if (user?.canSwitchRoles !== undefined) {
        localStorage.setItem('previousCanSwitchRoles', user.canSwitchRoles.toString());
      }
    };

    if (user) {
      checkRevocation();
    }
  }, [user?.canSwitchRoles]);

  const requestRegistrarAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USERS.REQUEST_REGISTRAR_ACCESS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setHasRequestedAccess(true);
        setNotification({
          type: 'success',
          message: 'Registrar access request submitted successfully! Please wait for admin approval.'
        });
      } else {
        const error = await response.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to submit request'
        });
      }
    } catch (err) {
      console.error('Error requesting registrar access:', err);
      setNotification({
        type: 'error',
        message: 'Failed to submit request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async () => {
    setLoading(true);
    try {
      const currentEffectiveRole = user?.currentRole || user?.role;
      const newRole = currentEffectiveRole === ROLES.WORKER ? ROLES.REGISTRAR : ROLES.WORKER;
      
      const response = await fetch(API_ENDPOINTS.USERS.SWITCH_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ targetRole: newRole }) // Changed from newRole to targetRole
      });

      if (response.ok) {
        const result = await response.json();
        
        // If the backend returns a new JWT token, use it
        if (result.access_token) {
          localStorage.setItem('authToken', result.access_token);
          
          // Update user context with the user data returned from the backend
          if (result.user) {
            const updatedUser = { ...user, ...result.user, currentRole: result.currentRole };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else {
            // Fallback: update just the currentRole
            const updatedUser = { ...user, currentRole: result.currentRole };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          // Fallback: Fetch updated user profile from backend if no token returned
          try {
            const profileResponse = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const normalizedUser = profileData.data || profileData;
              
              // Update user in auth context and localStorage with fresh data
              setUser(normalizedUser);
              localStorage.setItem('user', JSON.stringify(normalizedUser));
            } else {
              // Fallback to local update if profile fetch fails
              const updatedUser = { ...user, currentRole: newRole };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (profileError) {
            console.error('Failed to fetch updated profile:', profileError);
            // Fallback to local update
            const updatedUser = { ...user, currentRole: newRole };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
        
        setNotification({
          type: 'success',
          message: `Successfully switched to ${newRole === ROLES.WORKER ? 'Worker' : 'Registrar'} role!`
        });

        // Force a re-render by updating the page after user context updates
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        setNotification({
          type: 'error',
          message: error.message || 'Failed to switch role'
        });
      }
    } catch (err) {
      console.error('Error switching role:', err);
      setNotification({
        type: 'error',
        message: 'Failed to switch role. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show section for workers or users who can switch roles
  if (user?.role !== ROLES.WORKER && !user?.canSwitchRoles) {
    return null;
  }

  return (
    <div className="card mb-4 border-0 shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3" style={{ color: 'var(--primary-purple)' }}>
          <i className="bi bi-person-gear me-2"></i>
          Role Management
        </h5>

        {/* Notification */}
        {notification && (
          <div className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type === 'warning' ? 'warning' : 'success'} alert-dismissible fade show`} role="alert">
            <i className={`bi bi-${notification.type === 'error' ? 'exclamation-triangle' : notification.type === 'warning' ? 'exclamation-triangle' : 'check-circle'} me-2`}></i>
            {notification.message}
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        )}

        {/* Current Role Display */}
        <div className="mb-3">
          <small className="text-muted">Current Role:</small>
          <div className="d-flex align-items-center">
            <span className="badge bg-primary me-2">
              {(user?.currentRole || user?.role) === ROLES.REGISTRAR ? 'Registrar' : 'Worker'}
            </span>
            {user?.canSwitchRoles && (
              <small className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                Role switching enabled
              </small>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 flex-wrap">
          {!user?.canSwitchRoles && !hasRequestedAccess && (
            <button
              className="btn btn-outline-primary"
              onClick={requestRegistrarAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Requesting...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Request Registrar Access
                </>
              )}
            </button>
          )}

          {hasRequestedAccess && !user?.canSwitchRoles && (
            <div className="alert alert-info mb-0">
              <i className="bi bi-clock me-2"></i>
              Your registrar access request is pending admin approval.
            </div>
          )}

          {user?.canSwitchRoles && (
            <button
              className={`btn ${(user?.currentRole || user?.role) === ROLES.WORKER ? 'btn-success' : 'btn-warning'}`}
              onClick={switchRole}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Switching...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Switch to {(user?.currentRole || user?.role) === ROLES.WORKER ? 'Registrar' : 'Worker'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Help Text */}
        {user?.canSwitchRoles && (
          <small className="text-muted mt-2 d-block">
            <i className="bi bi-info-circle me-1"></i>
            You can switch between Worker and Registrar roles at any time. The page will refresh after switching.
          </small>
        )}
      </div>
    </div>
  );
};

export default RoleSwitchingSection;
