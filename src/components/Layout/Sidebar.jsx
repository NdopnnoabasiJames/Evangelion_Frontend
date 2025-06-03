import React from 'react';
import { Nav } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAVIGATION_ITEMS, ROLES } from '../../utils/constants';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user?.role) return [];
    return NAVIGATION_ITEMS[user.role] || [];
  };

  const navItems = getNavItems();

  const handleNavClick = (path) => {
    navigate(path);
    // Auto-collapse sidebar on mobile after navigation
    if (window.innerWidth < 992) {
      setCollapsed(true);
    }
  };

  // Icon mapping for Bootstrap Icons
  const getIcon = (iconName) => {
    const iconMap = {
      dashboard: 'bi-speedometer2',
      event: 'bi-calendar-event',
      people: 'bi-people',
      work: 'bi-person-workspace',
      assignment: 'bi-clipboard-check',
      analytics: 'bi-graph-up'
    };
    return iconMap[iconName] || 'bi-circle';
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {!collapsed && (
        <div 
          className="d-lg-none position-fixed w-100 h-100 bg-dark bg-opacity-50"
          style={{ top: 0, left: 0, zIndex: 1040 }}
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`bg-light sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          position: 'fixed',
          top: '56px', // Height of navbar
          left: collapsed ? '-250px' : '0',
          width: '250px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          transition: 'left 0.3s ease',
          zIndex: 1050,
          borderRight: '1px solid #dee2e6'
        }}
      >
        <div className="p-3">
          {/* User info section */}
          <div className="mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                   style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-person-fill text-white"></i>
              </div>
              <div>
                <div className="fw-semibold small">{user?.name || 'User'}</div>
                <div className="text-muted small">
                  {user?.role?.replace('_', ' ') || 'Role'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <Nav className="flex-column">
            {navItems.map((item, index) => (
              <Nav.Link
                key={index}
                onClick={() => handleNavClick(item.path)}
                className={`d-flex align-items-center py-2 px-3 rounded mb-1 ${
                  location.pathname === item.path 
                    ? 'bg-primary text-white' 
                    : 'text-dark hover-bg-light'
                }`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className={`bi ${getIcon(item.icon)} me-3`}></i>
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          {/* Quick actions section */}
          <div className="mt-4 pt-3 border-top">
            <h6 className="text-muted small mb-3">Quick Actions</h6>
            <div className="d-grid gap-2">
              {(user?.role === ROLES.REGISTRAR || 
                user?.role === ROLES.WORKER) && (
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleNavClick('/check-in')}
                >
                  <i className="bi bi-qr-code-scan me-2"></i>
                  Quick Check-in
                </button>
              )}
              
              {(user?.role !== ROLES.GUEST && user?.role !== ROLES.REGISTRAR) && (
                <button 
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleNavClick('/events/new')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  New Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
